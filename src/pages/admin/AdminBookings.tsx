import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import {
  ApiRequestError,
  getAdminBookings,
  updateAdminBooking,
  deleteAdminBooking,
  type Booking,
  type BookingStatus,
  type PaginatedBookings,
} from '@/lib/api';

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-stone-200 text-stone-700',
};

function formatDate(date: string) {
  const datePart = date.slice(0, 10);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(`${datePart}T12:00:00`));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function formatTime(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function AdminBookings() {
  const [result, setResult] = useState<PaginatedBookings | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [date, setDate] = useState('');

  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminBookings({
        search,
        status,
        date: date || undefined,
        page,
        per_page: 15,
      });

      setResult(data);

      if (selected) {
        const refreshed = data.data.find(
          (booking) => booking.id === selected.id
        );

        if (refreshed) {
          setSelected(refreshed);
          setDraftDate(refreshed.session_date.slice(0, 10));
          setDraftTime(refreshed.session_time.slice(0, 5));
          setAdminNotes(refreshed.admin_notes ?? '');
        } else {
          setSelected(null);
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to load bookings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, date, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, search ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [loadBookings, search]);

  function openBooking(booking: Booking) {
    setSelected(booking);
    setDraftDate(booking.session_date.slice(0, 10));
    setDraftTime(booking.session_time.slice(0, 5));
    setAdminNotes(booking.admin_notes ?? '');
    setError('');
    setSuccess('');
  }

  function applyUpdatedBooking(updated: Booking) {
    setSelected(updated);

    setResult((current) =>
      current
        ? {
            ...current,
            data: current.data.map((item) =>
              item.id === updated.id ? updated : item
            ),
          }
        : current
    );

    setDraftDate(updated.session_date.slice(0, 10));
    setDraftTime(updated.session_time.slice(0, 5));
    setAdminNotes(updated.admin_notes ?? '');
  }

  async function changeStatus(
    booking: Booking,
    nextStatus: BookingStatus
  ) {
    if (nextStatus === booking.status) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateAdminBooking(booking.id, {
        status: nextStatus,
      });

      applyUpdatedBooking(updated);
      setSuccess(`Booking ${updated.reference} updated successfully.`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to update the booking status.'
      );
    } finally {
      setUpdating(false);
    }
  }

  async function saveSchedule() {
    if (!selected) return;

    if (!draftDate || !draftTime) {
      setError('Please provide both a session date and time.');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateAdminBooking(selected.id, {
        session_date: draftDate,
        session_time: draftTime,
      });

      applyUpdatedBooking(updated);
      setSuccess('Booking schedule updated successfully.');
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to update the booking schedule.'
      );
    } finally {
      setUpdating(false);
    }
  }

  async function saveAdminNotes() {
    if (!selected) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateAdminBooking(selected.id, {
        admin_notes: adminNotes.trim() || null,
      });

      applyUpdatedBooking(updated);
      setSuccess('Internal notes saved successfully.');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to save internal notes.'
      );
    } finally {
      setUpdating(false);
    }
  }

  async function removeBooking(booking: Booking) {
    const confirmed = window.confirm(
      `Permanently delete booking ${booking.reference} from ${booking.customer_name}? This cannot be undone.`
    );

    if (!confirmed) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await deleteAdminBooking(booking.id);

      if (selected?.id === booking.id) {
        setSelected(null);
      }

      setSuccess(`Booking ${booking.reference} deleted.`);
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to delete this booking.'
      );
    } finally {
      setUpdating(false);
    }
  }

  const pageBookings = result?.data ?? [];
  const pendingCount = pageBookings.filter(
    (booking) => booking.status === 'pending'
  ).length;
  const confirmedCount = pageBookings.filter(
    (booking) => booking.status === 'confirmed'
  ).length;

  return (
    <section className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600">
            Kilo Administration
          </p>
          <h1 className="mt-2 font-display text-3xl text-stone-900">
            Session Bookings
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Review customer requests and manage photography sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBookings()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">
            Total bookings
          </p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {result?.total ?? '—'}
          </p>
        </div>

        <div className="border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">
            Pending requests
          </p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">
            {loading ? '—' : pendingCount}
          </p>
          <p className="mt-1 text-xs text-stone-400">On this page</p>
        </div>

        <div className="border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">
            Confirmed sessions
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">
            {loading ? '—' : confirmedCount}
          </p>
          <p className="mt-1 text-xs text-stone-400">On this page</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search reference, customer, email or phone..."
            className="w-full border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-600"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BookingStatus | '');
            setPage(1);
          }}
          className="border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600"
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by session date"
          className="border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600"
        />

        {date && (
          <button
            type="button"
            onClick={() => {
              setDate('');
              setPage(1);
            }}
            className="border border-stone-300 px-4 py-3 text-sm text-stone-600 hover:bg-stone-100"
          >
            Clear date
          </button>
        )}
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="overflow-hidden border border-stone-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-stone-500">
            Loading session bookings...
          </div>
        ) : pageBookings.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays
              className="mx-auto text-stone-300"
              size={32}
            />
            <p className="mt-3 text-sm text-stone-500">
              No bookings found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pageBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-stone-50 sm:flex-row sm:items-center"
              >
                <button
                  type="button"
                  onClick={() => openBooking(booking)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-900">
                      {booking.customer_name}
                    </span>
                    <span className="text-xs text-stone-400">
                      {booking.reference}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-stone-700">
                    {booking.service_type}
                  </p>

                  <p className="mt-1 truncate text-xs text-stone-500">
                    {booking.email} · {booking.phone}
                  </p>

                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatDate(booking.session_date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} />
                      {formatTime(booking.session_time)}
                    </span>
                  </p>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[booking.status]}`}
                  >
                    {statusOptions.find(
                      (option) => option.value === booking.status
                    )?.label ?? booking.status}
                  </span>

                  <button
                    type="button"
                    title="View booking details"
                    onClick={() => openBooking(booking)}
                    className="border border-stone-200 p-2 text-stone-500 hover:bg-stone-100"
                  >
                    <ClipboardList size={16} />
                  </button>

                  <button
                    type="button"
                    title="Delete booking"
                    disabled={updating}
                    onClick={() => void removeBooking(booking)}
                    className="border border-stone-200 p-2 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {result && result.last_page > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
          <span>
            Showing {result.from ?? 0}–{result.to ?? 0} of {result.total}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="border border-stone-300 p-2 disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span>
              Page {result.current_page} of {result.last_page}
            </span>

            <button
              type="button"
              disabled={page >= result.last_page || loading}
              onClick={() => setPage((current) => current + 1)}
              className="border border-stone-300 p-2 disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <button
            type="button"
            aria-label="Close booking details"
            onClick={() => setSelected(null)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-600">
                  Session request
                </p>
                <h2 className="mt-1 font-display text-2xl text-stone-900">
                  Booking details
                </h2>
                <p className="mt-1 text-xs text-stone-400">
                  {selected.reference}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Customer
                </p>
                <p className="mt-2 font-medium text-stone-900">
                  {selected.customer_name}
                </p>

                <a
                  href={`mailto:${selected.email}`}
                  className="mt-2 flex items-center gap-2 text-sm text-amber-700 hover:underline"
                >
                  <Mail size={14} />
                  {selected.email}
                </a>

                <a
                  href={`tel:${selected.phone}`}
                  className="mt-2 flex items-center gap-2 text-sm text-stone-600 hover:text-amber-700"
                >
                  <Phone size={14} />
                  {selected.phone}
                </a>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Requested service
                </p>
                <p className="mt-2 font-medium text-stone-900">
                  {selected.service_type}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">
                    Session date
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-stone-700">
                    <CalendarDays size={15} />
                    {formatDate(selected.session_date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">
                    Session time
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-stone-700">
                    <Clock size={15} />
                    {formatTime(selected.session_time)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Location
                </p>
                <p className="mt-2 flex items-start gap-2 text-sm text-stone-700">
                  <MapPin size={15} className="mt-0.5 shrink-0" />
                  {selected.location}
                </p>
              </div>

              {selected.message && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">
                    Customer message
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                    {selected.message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Clock size={14} />
                Submitted {formatDateTime(selected.created_at)}
              </div>

              {selected.confirmed_at && (
                <p className="text-xs text-emerald-700">
                  Confirmed {formatDateTime(selected.confirmed_at)}
                </p>
              )}

              <div className="border-t border-stone-200 pt-6">
                <label
                  htmlFor="booking-status"
                  className="text-xs uppercase tracking-wider text-stone-400"
                >
                  Booking status
                </label>

                <select
                  id="booking-status"
                  value={selected.status}
                  disabled={updating}
                  onChange={(event) =>
                    void changeStatus(
                      selected,
                      event.target.value as BookingStatus
                    )
                  }
                  className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-amber-600 disabled:opacity-50"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={updating || selected.status === 'confirmed'}
                    onClick={() =>
                      void changeStatus(selected, 'confirmed')
                    }
                    className="inline-flex items-center justify-center gap-2 bg-emerald-700 px-3 py-3 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-40"
                  >
                    <CheckCircle size={14} />
                    Confirm
                  </button>

                  <button
                    type="button"
                    disabled={updating || selected.status === 'rejected'}
                    onClick={() =>
                      void changeStatus(selected, 'rejected')
                    }
                    className="inline-flex items-center justify-center gap-2 border border-red-200 px-3 py-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={updating || selected.status === 'cancelled'}
                    onClick={() =>
                      void changeStatus(selected, 'cancelled')
                    }
                    className="border border-stone-300 px-3 py-3 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Reschedule session
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-date"
                      className="mb-1 block text-xs text-stone-500"
                    >
                      New date
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      min={new Date().toLocaleDateString('en-CA')}
                      value={draftDate}
                      disabled={updating}
                      onChange={(event) => setDraftDate(event.target.value)}
                      className="w-full border border-stone-300 px-3 py-3 text-sm outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="booking-time"
                      className="mb-1 block text-xs text-stone-500"
                    >
                      New time
                    </label>
                    <input
                      id="booking-time"
                      type="time"
                      value={draftTime}
                      disabled={updating}
                      onChange={(event) => setDraftTime(event.target.value)}
                      className="w-full border border-stone-300 px-3 py-3 text-sm outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={updating || !draftDate || !draftTime}
                  onClick={() => void saveSchedule()}
                  className="mt-3 w-full border border-stone-300 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Save new schedule
                </button>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <label
                  htmlFor="booking-admin-notes"
                  className="text-xs uppercase tracking-wider text-stone-400"
                >
                  Internal admin notes
                </label>

                <p className="mt-1 text-xs text-stone-400">
                  Private notes for administrators. Customers do not see these.
                </p>

                <textarea
                  id="booking-admin-notes"
                  rows={5}
                  maxLength={3000}
                  value={adminNotes}
                  disabled={updating}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Add internal notes about this booking..."
                  className="mt-3 w-full resize-y border border-stone-300 px-3 py-3 text-sm outline-none focus:border-amber-600 disabled:opacity-50"
                />

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => void saveAdminNotes()}
                  className="mt-2 w-full bg-stone-900 px-4 py-3 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  Save internal notes
                </button>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => void removeBooking(selected)}
                className="w-full border border-red-200 px-4 py-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete booking permanently
              </button>
            </div>

            {updating && (
              <div className="border-t border-stone-200 px-6 py-3 text-xs text-stone-400">
                Saving changes...
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
