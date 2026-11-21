
import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Mail,
  MailOpen,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
} from 'lucide-react';

import {
  ApiRequestError,
  getAdminInquiries,
  updateAdminInquiry,
  deleteAdminInquiry,
  type AdminInquiry,
  type InquiryStatus,
  type PaginatedInquiries,
} from '@/lib/api';

const statusOptions: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'responded', label: 'Responded' },
  { value: 'closed', label: 'Closed' },
];

const statusStyles: Record<InquiryStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  responded: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-stone-200 text-stone-700',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function AdminInquiries() {
  const [result, setResult] = useState<PaginatedInquiries | null>(null);
  const [selected, setSelected] = useState<AdminInquiry | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InquiryStatus | ''>('');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminInquiries({
        search,
        status,
        is_read:
          readFilter === 'all'
            ? undefined
            : readFilter === 'read',
        page,
        per_page: 15,
      });

      setResult(data);

      if (selected) {
        const refreshed = data.data.find(
          (inquiry) => inquiry.id === selected.id
        );

        if (refreshed) {
          setSelected(refreshed);
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to load inquiries. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, readFilter, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInquiries();
    }, search ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [loadInquiries, search]);

  async function openInquiry(inquiry: AdminInquiry) {
    setSelected(inquiry);

    if (!inquiry.is_read) {
      try {
        const updated = await updateAdminInquiry(inquiry.id, {
          is_read: true,
        });

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
      } catch {
        setError('Could not mark this inquiry as read.');
      }
    }
  }

  async function toggleRead(inquiry: AdminInquiry) {
    setUpdating(true);
    setError('');

    try {
      const updated = await updateAdminInquiry(inquiry.id, {
        is_read: !inquiry.is_read,
      });

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

      if (selected?.id === updated.id) {
        setSelected(updated);
      }
    } catch {
      setError('Unable to update the read status.');
    } finally {
      setUpdating(false);
    }
  }

  async function changeStatus(
    inquiry: AdminInquiry,
    nextStatus: InquiryStatus
  ) {
    setUpdating(true);
    setError('');

    try {
      const updated = await updateAdminInquiry(inquiry.id, {
        status: nextStatus,
      });

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

      if (selected?.id === updated.id) {
        setSelected(updated);
      }
    } catch {
      setError('Unable to update the inquiry status.');
    } finally {
      setUpdating(false);
    }
  }

  async function removeInquiry(inquiry: AdminInquiry) {
    const confirmed = window.confirm(
      `Permanently delete the inquiry from ${inquiry.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    setUpdating(true);
    setError('');

    try {
      await deleteAdminInquiry(inquiry.id);

      if (selected?.id === inquiry.id) {
        setSelected(null);
      }

      await loadInquiries();
    } catch {
      setError('Unable to delete this inquiry.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600">
            Kilo Administration
          </p>
          <h1 className="mt-2 font-display text-3xl text-stone-900">
            Customer Inquiries
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Review and manage messages from your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadInquiries()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">
            Total inquiries
          </p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {result?.total ?? '—'}
          </p>
        </div>

        <div className="border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">
            Unread inquiries
          </p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">
            {result?.data.filter((item) => !item.is_read).length ?? '—'}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            On this page
          </p>
        </div>

        <div className="border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">
            New inquiries
          </p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {result?.data.filter((item) => item.status === 'new').length ?? '—'}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            On this page
          </p>
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
            placeholder="Search name, email, subject or message..."
            className="w-full border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-600"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as InquiryStatus | '');
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

        <select
          value={readFilter}
          onChange={(event) => {
            setReadFilter(event.target.value as typeof readFilter);
            setPage(1);
          }}
          className="border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600"
        >
          <option value="all">All messages</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden border border-stone-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-stone-500">
            Loading customer inquiries...
          </div>
        ) : result?.data.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto text-stone-300" size={32} />
            <p className="mt-3 text-sm text-stone-500">
              No inquiries found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {result?.data.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`flex flex-col gap-4 p-5 transition hover:bg-stone-50 sm:flex-row sm:items-center ${
                  !inquiry.is_read ? 'bg-amber-50/30' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => void openInquiry(inquiry)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        inquiry.is_read ? 'bg-stone-300' : 'bg-amber-600'
                      }`}
                    />
                    <span className="font-medium text-stone-900">
                      {inquiry.name}
                    </span>
                    {!inquiry.is_read && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                        Unread
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm font-medium text-stone-700">
                    {inquiry.subject}
                  </p>
                  <p className="mt-1 truncate text-xs text-stone-500">
                    {inquiry.email} · {inquiry.message}
                  </p>
                  <p className="mt-2 text-xs text-stone-400">
                    {formatDate(inquiry.created_at)}
                  </p>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[inquiry.status]
                    }`}
                  >
                    {statusOptions.find(
                      (option) => option.value === inquiry.status
                    )?.label ?? inquiry.status}
                  </span>

                  <button
                    type="button"
                    title={inquiry.is_read ? 'Mark unread' : 'Mark read'}
                    disabled={updating}
                    onClick={() => void toggleRead(inquiry)}
                    className="border border-stone-200 p-2 text-stone-500 hover:bg-stone-100"
                  >
                    {inquiry.is_read ? (
                      <Mail size={16} />
                    ) : (
                      <MailOpen size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    title="Delete inquiry"
                    disabled={updating}
                    onClick={() => void removeInquiry(inquiry)}
                    className="border border-stone-200 p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"
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
            aria-label="Close inquiry details"
            onClick={() => setSelected(null)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-600">
                  Customer message
                </p>
                <h2 className="mt-1 font-display text-2xl text-stone-900">
                  Inquiry details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 p-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Customer
                </p>
                <p className="mt-2 font-medium text-stone-900">
                  {selected.name}
                </p>
                <a
                  href={`mailto:${selected.email}`}
                  className="mt-1 block text-sm text-amber-700 hover:underline"
                >
                  {selected.email}
                </a>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Subject
                </p>
                <p className="mt-2 font-medium text-stone-900">
                  {selected.subject}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  Message
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {selected.message}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Clock size={14} />
                Received {formatDate(selected.created_at)}
              </div>

              <div>
                <label
                  htmlFor="inquiry-status"
                  className="text-xs uppercase tracking-wider text-stone-400"
                >
                  Inquiry status
                </label>
                <select
                  id="inquiry-status"
                  value={selected.status}
                  disabled={updating}
                  onChange={(event) =>
                    void changeStatus(
                      selected,
                      event.target.value as InquiryStatus
                    )
                  }
                  className="mt-2 w-full border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-amber-600"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => void toggleRead(selected)}
                className="w-full border border-stone-300 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Mark as {selected.is_read ? 'unread' : 'read'}
              </button>
            </div>

            <div className="border-t border-stone-200 p-6">
              <button
                type="button"
                disabled={updating}
                onClick={() => void removeInquiry(selected)}
                className="inline-flex w-full items-center justify-center gap-2 bg-red-50 px-4 py-3 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete inquiry
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

