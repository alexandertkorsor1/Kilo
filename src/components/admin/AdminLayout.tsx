import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Images,
  CalendarDays,
  MessageSquare,
  Settings,
  LogOut,
  Camera,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/context/useAuth';

const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      navigate('/kilo-control', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-stone-950 text-stone-100">
      <div className="flex h-16 items-center justify-between border-b border-stone-800 px-6">
        <div className="flex items-center gap-3">
          <Camera className="text-amber-400" size={23} />
          <span className="font-display text-lg tracking-widest">
            KILO<span className="text-amber-400">.</span>
          </span>
        </div>

        <button
          type="button"
          className="text-stone-400 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X size={22} />
        </button>
      </div>

      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-xs uppercase tracking-widest text-stone-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-3 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-stone-800 p-4">
        <div className="mb-4 px-3">
          <p className="truncate text-sm font-medium text-stone-200">
            {user?.name ?? 'Administrator'}
          </p>
          <p className="truncate text-xs text-stone-500">
            {user?.email}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-sm text-stone-400 transition-colors hover:bg-stone-900 hover:text-red-400 disabled:opacity-50"
        >
          <LogOut size={18} />
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-stone-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="mr-4 text-stone-700 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={23} />
          </button>

          <p className="text-sm font-medium text-stone-600">
            Administrator Workspace
          </p>
        </header>

        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  );
}
