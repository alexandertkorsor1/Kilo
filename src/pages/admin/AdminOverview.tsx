import {
  Images,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  ArrowUpRight,
  Clock3,
} from 'lucide-react';

const statistics = [
  {
    label: 'Total Photographs',
    value: '—',
    description: 'Portfolio images',
    icon: Images,
  },
  {
    label: 'Pending Bookings',
    value: '—',
    description: 'Awaiting confirmation',
    icon: CalendarDays,
  },
  {
    label: 'Confirmed Sessions',
    value: '—',
    description: 'Approved bookings',
    icon: CheckCircle2,
  },
  {
    label: 'New Inquiries',
    value: '—',
    description: 'Customer messages',
    icon: MessageSquare,
  },
];

export default function AdminOverview() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
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

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
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
                {stat.value}
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
              Recent Bookings
            </h2>

            <CalendarDays size={20} className="text-stone-400" />
          </div>

          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <Clock3 size={30} className="text-stone-300" />

            <p className="mt-4 text-sm font-medium text-stone-600">
              No booking data connected yet
            </p>

            <p className="mt-2 max-w-sm text-xs text-stone-400">
              Customer session bookings will appear here once the booking
              system is connected.
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stone-200 bg-white p-6">
          <h2 className="font-display text-xl text-stone-900">
            Quick Actions
          </h2>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-sm bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <Images size={19} className="text-amber-700" />
                <span className="text-sm text-stone-700">
                  Manage Gallery
                </span>
              </div>

              <ArrowUpRight size={17} className="text-stone-400" />
            </div>

            <div className="flex items-center justify-between rounded-sm bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <CalendarDays size={19} className="text-amber-700" />
                <span className="text-sm text-stone-700">
                  View Bookings
                </span>
              </div>

              <ArrowUpRight size={17} className="text-stone-400" />
            </div>

            <div className="flex items-center justify-between rounded-sm bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <MessageSquare size={19} className="text-amber-700" />
                <span className="text-sm text-stone-700">
                  View Inquiries
                </span>
              </div>

              <ArrowUpRight size={17} className="text-stone-400" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
