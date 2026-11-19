import { useCallback, useEffect, useState } from 'react';
import {
  ImagePlus,
  Loader2,
  RefreshCw,
  Upload,
  Images,
  Pencil,
  X,
  Save,
} from 'lucide-react';
import {
  ApiRequestError,
  getAdminPhotos,
  uploadPhoto,
  updatePhoto,
  replacePhotoImage,
  deletePhoto,
  type AdminPhoto,
} from '@/lib/api';

const categories = ['All', 'Portrait', 'Landscape', 'Street', 'Wedding'] as const;

type CategoryFilter = (typeof categories)[number];

export default function AdminGallery() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('All');

  const [title, setTitle] = useState('');
  const [alt, setAlt] = useState('');
  const [category, setCategory] =
    useState<AdminPhoto['category']>('Portrait');
  const [orientation, setOrientation] =
    useState<AdminPhoto['orientation']>('portrait');
  const [image, setImage] = useState<File | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<AdminPhoto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editCategory, setEditCategory] =
    useState<AdminPhoto['category']>('Portrait');
  const [editOrientation, setEditOrientation] =
    useState<AdminPhoto['orientation']>('portrait');
  const [editPublished, setEditPublished] = useState(false);
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [savingEdit, setSavingEdit] = useState(false);
  const [replacementImage, setReplacementImage] = useState<File | null>(null);
  const [replacementPreview, setReplacementPreview] = useState('');
  const [replacingImage, setReplacingImage] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);




  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getAdminPhotos();
      setPhotos(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load portfolio photos.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    if (!replacementImage) {
      setReplacementPreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(replacementImage);
    setReplacementPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [replacementImage]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!image) {
      setError('Please select an image to upload.');
      return;
    }

    if (image.size > 10 * 1024 * 1024) {
      setError('The image must be smaller than 10 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('title', title.trim());
    formData.append('alt', alt.trim());
    formData.append('category', category);
    formData.append('orientation', orientation);

    setUploading(true);

    try {
      await uploadPhoto(formData);
      setTitle('');
      setAlt('');
      setCategory('Portrait');
      setOrientation('portrait');
      setImage(null);

      const fileInput = document.getElementById(
        'gallery-image'
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = '';

      await loadPhotos();
      setSuccess('Photo uploaded successfully. It is currently unpublished.');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? Object.values(err.errors ?? {}).flat().join(' ') || err.message
          : err instanceof Error
            ? err.message
            : 'Photo upload failed.'
      );
    } finally {
      setUploading(false);
    }
  }

  function openEdit(photo: AdminPhoto) {
    setReplacementImage(null);
    setEditingPhoto(photo);
    setEditTitle(photo.title);
    setEditAlt(photo.alt);
    setEditCategory(photo.category);
    setEditOrientation(photo.orientation);
    setEditPublished(photo.is_published);
    setEditSortOrder(String(photo.sort_order));
    setError('');
    setSuccess('');
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingPhoto) return;

    const order = Number(editSortOrder);

    if (!Number.isInteger(order) || order < 0) {
      setError('Display order must be a non-negative whole number.');
      return;
    }

    setSavingEdit(true);
    setError('');
    setSuccess('');

    try {
      await updatePhoto(editingPhoto.id, {
        title: editTitle.trim(),
        alt: editAlt.trim(),
        category: editCategory,
        orientation: editOrientation,
        is_published: editPublished,
        sort_order: order,
      });

      setEditingPhoto(null);
      await loadPhotos();
      setSuccess('Photo updated successfully.');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? Object.values(err.errors ?? {}).flat().join(' ') || err.message
          : err instanceof Error
            ? err.message
            : 'Unable to update this photo.'
      );
    } finally {
      setSavingEdit(false);
    }
  }


  async function handleReplaceImage() {
    if (!editingPhoto || !replacementImage) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(replacementImage.type)) {
      setError('Choose a JPG, PNG or WebP image.');
      return;
    }

    if (replacementImage.size > 10 * 1024 * 1024) {
      setError('The replacement image must be smaller than 10 MB.');
      return;
    }

    setReplacingImage(true);
    setError('');
    setSuccess('');

    try {
      const updatedPhoto = await replacePhotoImage(editingPhoto.id, replacementImage);
      setEditingPhoto(updatedPhoto);
      setReplacementImage(null);
      await loadPhotos();
      setSuccess('Photograph image replaced successfully.');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? Object.values(err.errors ?? {}).flat().join(' ') || err.message
          : err instanceof Error
            ? err.message
            : 'Unable to replace this photograph.'
      );
    } finally {
      setReplacingImage(false);
    }
  }


  async function handleDeletePhoto() {
    if (!editingPhoto) return;

    setDeletingPhoto(true);
    setError('');

    try {
      await deletePhoto(editingPhoto.id);
      setEditingPhoto(null);
      setConfirmDelete(false);
      setReplacementImage(null);
      await loadPhotos();
      setSuccess('Photograph deleted successfully.');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to delete this photograph.'
      );
      setConfirmDelete(false);
    } finally {
      setDeletingPhoto(false);
    }
  }

  const visiblePhotos =
    filter === 'All'
      ? photos
      : photos.filter((photo) => photo.category === filter);

  const publishedCount = photos.filter(
    (photo) => photo.is_published
  ).length;

  const unpublishedCount = photos.length - publishedCount;

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600">
            Kilo Administration
          </p>
          <h1 className="mt-2 font-display text-3xl text-stone-900">
            Gallery Management
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Upload and organize your photography portfolio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPhotos()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh gallery
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total photos</p>
          <p className="mt-2 font-display text-3xl text-stone-900">
            {photos.length}
          </p>
        </div>
        <div className="border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Published</p>
          <p className="mt-2 font-display text-3xl text-green-700">
            {publishedCount}
          </p>
        </div>
        <div className="border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Unpublished</p>
          <p className="mt-2 font-display text-3xl text-amber-600">
            {unpublishedCount}
          </p>
        </div>
      </div>

      <div className="border border-stone-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-amber-400/10 text-amber-700">
            <ImagePlus size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl text-stone-900">
              Upload a photograph
            </h2>
            <p className="text-sm text-stone-500">
              New uploads are saved as unpublished until you approve them.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Photo title
              </span>
              <input
                required
                maxLength={150}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                placeholder="Enter photo title"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Alternative text
              </span>
              <input
                required
                maxLength={255}
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                placeholder="Describe the photograph"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Category
              </span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as AdminPhoto['category'])
                }
                className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              >
                {categories.filter((item) => item !== 'All').map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Orientation
              </span>
              <select
                value={orientation}
                onChange={(event) =>
                  setOrientation(
                    event.target.value as AdminPhoto['orientation']
                  )
                }
                className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Photograph
            </span>
            <input
              id="gallery-image"
              required
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setImage(event.target.files?.[0] ?? null)
              }
              className="block w-full border border-stone-300 bg-stone-50 text-sm text-stone-600 file:mr-4 file:border-0 file:bg-stone-900 file:px-4 file:py-3 file:text-sm file:text-white hover:file:bg-stone-700"
            />
            <span className="mt-1 block text-xs text-stone-500">
              JPG, JPEG, PNG or WebP. Maximum size: 10 MB.
            </span>
          </label>

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 bg-stone-900 px-6 py-3 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Upload size={17} />
            )}
            {uploading ? 'Uploading...' : 'Upload photograph'}
          </button>
        </form>
      </div>

      <div>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl text-stone-900">
              Portfolio photographs
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Manage all published and unpublished photographs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-3 py-2 text-xs transition ${
                  filter === item
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 border border-stone-200 bg-white py-16 text-sm text-stone-500">
            <Loader2 size={20} className="animate-spin" />
            Loading photographs...
          </div>
        ) : visiblePhotos.length === 0 ? (
          <div className="border border-stone-200 bg-white px-6 py-16 text-center">
            <Images className="mx-auto text-stone-400" size={32} />
            <p className="mt-3 text-sm text-stone-600">
              No photographs found in this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePhotos.map((photo) => (
              <article
                key={photo.id}
                className="overflow-hidden border border-stone-200 bg-white"
              >
                <div className="relative aspect-[4/3] bg-stone-200">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span
                    className={`absolute right-3 top-3 px-2.5 py-1 text-xs ${
                      photo.is_published
                        ? 'bg-green-700 text-white'
                        : 'bg-amber-500 text-stone-950'
                    }`}
                  >
                    {photo.is_published ? 'Published' : 'Unpublished'}
                  </span>
                </div>

                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-stone-900">
                      {photo.title}
                    </h3>
                    <span className="shrink-0 text-xs text-stone-500">
                      #{photo.sort_order}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {photo.category} · {photo.orientation}
                  </p>
                  <p className="line-clamp-2 text-xs text-stone-500">
                    {photo.alt}
                  </p>
                  <button
                    type="button"
                    onClick={() => openEdit(photo)}
                    className="mt-3 inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs text-stone-700 transition hover:border-amber-500 hover:text-amber-700"
                  >
                    <Pencil size={14} />
                    Edit photograph
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingEdit) {
              setEditingPhoto(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-photo-title"
            className="my-auto w-full max-w-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-600">
                  Gallery Management
                </p>
                <h2 id="edit-photo-title" className="mt-1 font-display text-2xl text-stone-900">
                  Edit photograph
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                disabled={savingEdit}
                aria-label="Close editor"
                className="p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 p-6">
              <img
                src={replacementPreview || editingPhoto.src}
                alt={editingPhoto.alt}
                className="h-48 w-full bg-stone-100 object-contain"
              />

              <div className="space-y-3 border border-stone-200 p-4">
                <div>
                  <h3 className="text-sm font-medium text-stone-800">
                    Replace photograph
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    Choose a new image from your device. Preview it before replacing the current image.
                  </p>
                </div>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={replacingImage}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setReplacementImage(file);
                    setError('');
                  }}
                  className="block w-full border border-stone-300 bg-stone-50 text-sm text-stone-600 file:mr-4 file:border-0 file:bg-stone-900 file:px-4 file:py-2.5 file:text-sm file:text-white"
                />

                <p className="text-xs text-stone-500">
                  JPG, PNG or WebP · Maximum size: 10 MB.
                </p>

                {replacementImage && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="break-all text-xs text-stone-600">
                      Selected: {replacementImage.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleReplaceImage()}
                      disabled={replacingImage}
                      className="inline-flex shrink-0 items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-sm text-white transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      {replacingImage ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ImagePlus size={16} />
                      )}
                      {replacingImage ? 'Replacing image...' : 'Replace image'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Photo title
                  </span>
                  <input
                    required
                    maxLength={150}
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Alternative text
                  </span>
                  <input
                    required
                    maxLength={255}
                    value={editAlt}
                    onChange={(event) => setEditAlt(event.target.value)}
                    className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Category
                  </span>
                  <select
                    value={editCategory}
                    onChange={(event) =>
                      setEditCategory(event.target.value as AdminPhoto['category'])
                    }
                    className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  >
                    {categories.filter((item) => item !== 'All').map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Orientation
                  </span>
                  <select
                    value={editOrientation}
                    onChange={(event) =>
                      setEditOrientation(event.target.value as AdminPhoto['orientation'])
                    }
                    className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Display order
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={editSortOrder}
                    onChange={(event) => setEditSortOrder(event.target.value)}
                    className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 border border-stone-200 p-4">
                <input
                  type="checkbox"
                  checked={editPublished}
                  onChange={(event) => setEditPublished(event.target.checked)}
                  className="h-4 w-4 accent-amber-600"
                />
                <span>
                  <span className="block text-sm font-medium text-stone-800">
                    Publish photograph
                  </span>
                  <span className="block text-xs text-stone-500">
                    Published photographs are visible in the public portfolio.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={savingEdit || deletingPhoto}
                  className="border border-red-200 px-5 py-2.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete photograph
                </button>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(false);
                      setEditingPhoto(null);
                    }}
                    disabled={savingEdit || deletingPhoto}
                    className="border border-stone-300 px-5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center justify-center gap-2 bg-stone-900 px-5 py-2.5 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {savingEdit ? 'Saving changes...' : 'Save changes'}
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && editingPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-photo-title"
            className="w-full max-w-md bg-white p-6 shadow-2xl"
          >
            <h3 id="delete-photo-title" className="text-lg font-semibold text-stone-900">
              Delete this photograph?
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              You are about to permanently delete "{editingPhoto.title}". This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deletingPhoto}
                className="border border-stone-300 px-5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Keep photograph
              </button>
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={deletingPhoto}
                className="bg-red-700 px-5 py-2.5 text-sm text-white hover:bg-red-800 disabled:opacity-50"
              >
                {deletingPhoto ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
