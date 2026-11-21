const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured.');
}

export interface BookingAvailability {
  date: string;
  timezone: string;
  duration_minutes: number;
  slot_interval_minutes: number;
  slots: string[];
}

export async function getBookingAvailability(
  date: string
): Promise<BookingAvailability> {
  const params = new URLSearchParams({ date });

  return apiRequest<BookingAvailability>(
    `/api/bookings/availability?${params.toString()}`
  );
}


export interface DashboardStatistics {
  total_photographs: number;
  published_photographs: number;
  total_inquiries: number;
  inquiries_last_seven_days: number;
}

export interface DashboardInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface DashboardResponse {
  statistics: DashboardStatistics;
  recent_inquiries: DashboardInquiry[];
}

export async function getAdminDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>('/api/admin/dashboard');
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

/* ================================
   ADMIN INQUIRY MANAGEMENT API
================================ */

export type InquiryStatus =
  | 'new'
  | 'in_progress'
  | 'responded'
  | 'closed';

export interface AdminInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  status: InquiryStatus;
  created_at: string;
  updated_at: string | null;
}

export interface PaginatedInquiries {
  data: AdminInquiry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface InquiryFilters {
  search?: string;
  status?: InquiryStatus | '';
  is_read?: boolean;
  page?: number;
  per_page?: number;
}

export interface UpdateInquiryData {
  status?: InquiryStatus;
  is_read?: boolean;
}

interface InquiryResponse {
  data: AdminInquiry;
}

export async function getAdminInquiries(
  filters: InquiryFilters = {}
): Promise<PaginatedInquiries> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);

  if (filters.is_read !== undefined) {
    params.set('is_read', filters.is_read ? '1' : '0');
  }

  params.set('page', String(filters.page ?? 1));
  params.set('per_page', String(filters.per_page ?? 15));

  return apiRequest<PaginatedInquiries>(
    `/api/admin/inquiries?${params.toString()}`
  );
}

export async function getAdminInquiry(
  id: string
): Promise<AdminInquiry> {
  const response = await apiRequest<InquiryResponse>(
    `/api/admin/inquiries/${encodeURIComponent(id)}`
  );

  return response.data;
}

export async function updateAdminInquiry(
  id: string,
  data: UpdateInquiryData
): Promise<AdminInquiry> {
  const response = await apiRequest<InquiryResponse>(
    `/api/admin/inquiries/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  return response.data;
}

export async function deleteAdminInquiry(id: string): Promise<void> {
  await apiRequest<MessageResponse>(
    `/api/admin/inquiries/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}

// ============================================
// BOOKING MANAGEMENT
// ============================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export interface Booking {
  id: string;
  reference: string;
  customer_name: string;
  email: string;
  phone: string;
  service_type: string;
  session_date: string;
  session_time: string;
  location: string;
  message: string | null;
  status: BookingStatus;
  admin_notes: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingSubmission {
  customer_name: string;
  email: string;
  phone: string;
  service_type: string;
  session_date: string;
  session_time: string;
  location: string;
  message?: string;
}

export interface BookingFilters {
  search?: string;
  status?: BookingStatus;
  date?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedBookings {
  current_page: number;
  data: Booking[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

interface BookingResponse {
  message: string;
  data: Booking;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  session_date?: string;
  session_time?: string;
  admin_notes?: string | null;
}

// Public customer booking submission
export async function submitBooking(
  data: BookingSubmission
): Promise<BookingResponse> {
  return apiRequest<BookingResponse>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Admin: retrieve bookings
export async function getAdminBookings(
  filters: BookingFilters = {}
): Promise<PaginatedBookings> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return apiRequest<PaginatedBookings>(
    `/api/admin/bookings${query ? `?${query}` : ''}`
  );
}

// Admin: retrieve one booking
export async function getAdminBooking(
  id: string
): Promise<Booking> {
  const response = await apiRequest<{ data: Booking }>(
    `/api/admin/bookings/${encodeURIComponent(id)}`
  );

  return response.data;
}

// Admin: update booking
export async function updateAdminBooking(
  id: string,
  data: UpdateBookingData
): Promise<Booking> {
  const response = await apiRequest<BookingResponse>(
    `/api/admin/bookings/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  return response.data;
}

// Admin: delete booking
export async function deleteAdminBooking(
  id: string
): Promise<void> {
  await apiRequest<void>(
    `/api/admin/bookings/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}

