import { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { getPublishedPhotos, type GalleryPhoto } from '@/lib/api';

type Category = GalleryPhoto['category'];
type Filter = Category | 'All';

const categories: Category[] = [
  'Portrait',
  'Landscape',
  'Street',
  'Wedding',
];

function GalleryImage({
  photo,
  eager,
}: {
  photo: GalleryPhoto;
  eager: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={photo.src}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      onLoad={() => setLoaded(true)}
      className={`h-full w-full object-cover transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPhotos() {
      try {
        const result = await getPublishedPhotos();

        if (active) {
          setPhotos(result);
          setError('');
        }
      } catch {
        if (active) {
          setError('Unable to load the portfolio. Please try again later.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPhotos();

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () =>
      filter === 'All'
        ? photos
        : photos.filter((photo) => photo.category === filter),
    [filter, photos]
  );

  const show = (index: number) => setLightbox(index);
  const close = () => setLightbox(null);

  const step = (direction: 1 | -1) => {
    setLightbox((current) =>
      current === null
        ? current
        : (current + direction + visible.length) % visible.length
    );
  };

  return (
    <section id="portfolio" className="bg-stone-950 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-4xl text-stone-50">Portfolio</h2>

        <p className="mt-3 max-w-lg text-stone-400">
          A selection of recent work.
        </p>

        {!loading && !error && photos.length > 0 && (
          <div
            className="mt-8 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter photos"
          >
            {(['All', ...categories] as Filter[]).map((category) => (
              <button
                key={category}
                role="tab"
                aria-selected={filter === category}
                onClick={() => {
                  setFilter(category);
                  setLightbox(null);
                }}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  filter === category
                    ? 'bg-amber-400 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="mt-10 text-stone-400" role="status">
            Loading portfolio photographs...
          </p>
        )}

        {error && (
          <p className="mt-10 text-red-400" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && photos.length === 0 && (
          <p className="mt-10 text-stone-400">
            No photographs have been published yet.
          </p>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {visible.map((photo, index) => (
              <figure
                key={photo.id}
                className="group relative mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-sm"
                onClick={() => show(index)}
              >
                <div
                  className={
                    photo.orientation === 'portrait'
                      ? 'aspect-[3/4]'
                      : 'aspect-[4/3]'
                  }
                >
                  <GalleryImage photo={photo} eager={index < 3} />
                </div>

                <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="p-4">
                    <p className="font-display text-lg text-stone-50">
                      {photo.title}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-amber-400">
                      {photo.category}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && visible[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={visible[lightbox].title}
          onClick={close}
        >
          <button
            className="absolute right-4 top-4 text-stone-300 hover:text-stone-50"
            aria-label="Close viewer"
            onClick={close}
          >
            <X size={28} />
          </button>

          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-stone-50"
            aria-label="Previous photo"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
          >
            <ChevronLeft size={36} />
          </button>

          <figure
            className="max-h-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={visible[lightbox].src}
              alt={visible[lightbox].alt}
              className="max-h-[80vh] w-auto rounded-sm object-contain"
            />

            <figcaption className="mt-3 text-center">
              <p className="font-display text-lg text-stone-50">
                {visible[lightbox].title}
              </p>
              <p className="text-xs uppercase tracking-widest text-amber-400">
                {visible[lightbox].category}
              </p>
            </figcaption>
          </figure>

          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-stone-50"
            aria-label="Next photo"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
          >
            <ChevronRight size={36} />
          </button>
        </div>
      )}
    </section>
  );
}
