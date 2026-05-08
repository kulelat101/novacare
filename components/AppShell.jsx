'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { auth } from '@/lib/firebase';
import { MODULES } from '@/lib/roles';
import { closeLoginLog } from '@/lib/audit';
import { useAuth } from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';

function SidebarContent({ onNavigate }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const allowedModules = MODULES.filter((item) => item.roles.includes(profile?.role));
  const groups = allowedModules.reduce((acc, item) => {
    acc[item.group] = acc[item.group] || [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-cyan-800/40 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-800 p-2 shadow-sm">
            <img
              src="/images/novacare-icon.png"
              alt="NovaCare Icon"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-bold text-white">NovaCare</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-cyan-100/80">{group}</p>
            <div className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active ? 'bg-white text-cyan-800 shadow-sm' : 'text-cyan-50 hover:bg-cyan-800/60 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function AppShell({ title, subtitle, children }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const displayName = useMemo(() => profile?.fullName || user?.email || 'Demo User', [profile, user]);

  async function handleLogout() {
    await closeLoginLog();
    await signOut(auth);
    router.replace('/login');
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-gradient-to-b from-cyan-700 to-slate-900 lg:block">
          <SidebarContent />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-label="Close menu" />
            <aside className="relative h-full w-80 max-w-[85vw] bg-gradient-to-b from-cyan-700 to-slate-900 shadow-2xl">
              <button className="absolute right-4 top-4 rounded-lg p-2 text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(true)}>
                  <Bars3Icon className="h-6 w-6 text-slate-700" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
                  {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                  <p className="text-xs capitalize text-slate-500">{profile?.role || 'user'}</p>
                </div>
                <button className="btn-secondary" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
