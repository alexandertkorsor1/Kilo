
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Images,
  MessageSquare,
  ArrowUpRight,
  Clock3,
  RefreshCw,
} from 'lucide-react';

import {
  getAdminDashboard,
  type DashboardResponse,
} from '@/lib/api';

const statisticsConfig = [
  {
    key: 'total_photographs',
    label: 'Total Photographs',
    description: 'All portfolio images',
    icon: Images,
  },
  {
    key: 'published_photographs',
    label: 'Published Photographs',
    description: 'Visible on your website',
    icon: Images,
  },
  {
    key: 'total_inquiries',
    label: 'Total Inquiries',
    description: 'Customer messages received',
    icon: MessageSquare,
  },
  {
    key: 'inquiries_last_seven_days',
    label: 'Inquiries This Week',
    description: 'Received in the last 7 days',
    icon: Clock3,
  },
] as const;

export default function AdminOverview() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await getAdminDashboard();

        if (active) {
          setDashboard(response);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard information.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-600">
            Workspace overview
          </p>

          <h1 className="mt-2 font-display text-3xl text-stone-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Welcome to your Kilo photography management workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-sm border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="mt-2 text-sm font-medium text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statisticsConfig.map((stat) => {
          const Icon = stat.icon;
          const value = dashboard?.statistics[stat.key];

          return (
            <div
              key={stat.key}
              className="rounded-sm border border-stone-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">
                  {stat.label}
                </span>

                <div className="rounded-sm bg-amber-50 p-2 text-amber-700">
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-5 text-3xl font-semibold text-stone-900">
                {loading ? '...' : (value ?? '—')}
              </p>

              <p className="mt-1 text-xs text-stone-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-stone-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-stone-900">
              Recent Inquiries
            </h2>

            <MessageSquare size={20} className="text-stone-400" />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <p className="text-sm text-stone-400">
                Loading inquiries...
              </p>
            </div>
          ) : dashboard?.recent_inquiries.length ? (
            <div className="mt-5 divide-y divide-stone-100">
              {dashboard.recent_inquiries.map((inquiry) => (
                <div key={inquiry.id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {inquiry.name}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {inquiry.email}
                      </p>
                    </div>

                    <span className="text-xs text-stone-400">
                      {formatDate(inquiry.created_at)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-stone-700">
                    {inquiry.subject}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                    {inquiry.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Clock3 size={30} className="text-stone-300" />

              <p className="mt-4 text-sm font-medium text-stone-600">
                No inquiries yet
              </p>

              <p className="mt-2 max-w-sm text-xs text-stone-400">
                Customer messages submitted through your website will appear
                here.
              </p>
            </div>
          )}

          <Link
            to="/admin/inquiries"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            View all inquiries
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="rounded-sm border border-stone-200 bg-white p-6">
          <h2 className="font-display text-xl text-stone-900">
            Quick Actions
          </h2>

          <div className="mt-6 space-y-3">
            <Link
              to="/admin/gallery"
              className="flex items-center justify-between rounded-sm bg-stone-50 p-4 transition hover:bg-amber-50"
            >
              <div className="flex items-center gap-3">
                <Images size={19} className="text-amber-700" />
                <span className="text-sm text-stone-700">
                  Manage Gallery
                </span>
              </div>

              <ArrowUpRight size={17} className="text-stone-400" />
            </Link>

            <Link
              to="/admin/inquiries"
              className="flex items-center justify-between rounded-sm bg-stone-50 p-4 transition hover:bg-amber-50"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={19} className="text-amber-700" />
                <span className="text-sm text-stone-700">
                  View Inquiries
                </span>
              </div>

              <ArrowUpRight size={17} className="text-stone-400" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

