
import { aboutImage } from '@/lib/images';

export default function About() {
  return (
    <section id="about" className="bg-stone-900 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-sm">
          <img
            src={aboutImage}
            alt="Photography featured in the Kilo Photographer portfolio"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>

        <div>
          <h2 className="font-display text-4xl text-stone-50">
            About Kilo Photographer
          </h2>

          <p className="mt-6 leading-relaxed text-stone-300">
            Kilo Photographer is a photography portfolio celebrating the art
            of capturing meaningful moments, places, and people.
          </p>

          <p className="mt-4 leading-relaxed text-stone-300">
            Explore a collection of portrait, landscape, street, and wedding
            photography, each offering a different perspective through the
            lens.
          </p>

          <p className="mt-6 text-sm text-stone-400">
            Every photograph tells a story. Discover yours through the gallery.
          </p>
        </div>
      </div>
    </section>
  );
}
