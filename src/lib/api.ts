const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured.');
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(
      'Unable to initialize security session.',
      response.status
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const requiresCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (requiresCsrf) {
    let csrfToken = getCookie('XSRF-TOKEN');

    if (!csrfToken) {
      await initializeCsrf();
      csrfToken = getCookie('XSRF-TOKEN');
    }

    if (!csrfToken) {
      throw new Error('CSRF security token is missing.');
    }

    headers.set('X-XSRF-TOKEN', csrfToken);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      result?.message ?? 'The request could not be completed.',
      response.status,
      result?.errors
    );
  }

  return result as T;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  title: string;
  category: 'Portrait' | 'Landscape' | 'Street' | 'Wedding';
  orientation: 'portrait' | 'landscape';
}

interface GalleryPhotosResponse {
  photos: GalleryPhoto[];
}

export async function getPublishedPhotos(): Promise<GalleryPhoto[]> {
  const response = await apiRequest<GalleryPhotosResponse>('/api/photos');
  return response.photos;
}


export interface AdminPhoto extends GalleryPhoto {
  is_temporary: boolean;
  is_published: boolean;
  sort_order: number;
  created_at?: string | null;
}

interface AdminPhotosResponse {
  photos: AdminPhoto[];
}

interface PhotoResponse {
  message: string;
  photo: AdminPhoto;
}

interface MessageResponse {
  message: string;
}

export type UpdatePhotoData = Partial<
  Pick<
    AdminPhoto,
    'title' | 'alt' | 'category' | 'orientation' | 'is_published' | 'sort_order'
  >
>;

export async function getAdminPhotos(): Promise<AdminPhoto[]> {
  const response = await apiRequest<AdminPhotosResponse>('/api/admin/photos');
  return response.photos;
}

export async function uploadPhoto(
  formData: FormData
): Promise<AdminPhoto> {
  const response = await apiRequest<PhotoResponse>('/api/admin/photos', {
    method: 'POST',
    body: formData,
  });

  return response.photo;
}

export async function updatePhoto(
  id: string,
  data: UpdatePhotoData
): Promise<AdminPhoto> {
  const response = await apiRequest<PhotoResponse>(
    `/api/admin/photos/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  return response.photo;
}

export async function replacePhotoImage(
  id: string,
  image: File
): Promise<AdminPhoto> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await apiRequest<PhotoResponse>(
    `/api/admin/photos/${encodeURIComponent(id)}/image`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return response.photo;
}

export async function deletePhoto(id: string): Promise<void> {
  await apiRequest<MessageResponse>(
    `/api/admin/photos/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}
