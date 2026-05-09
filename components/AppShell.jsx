'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BeakerIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HeartIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  SignalIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { auth } from '@/lib/firebase';
import { MODULES } from '@/lib/roles';
import { closeLoginLog } from '@/lib/audit';
import { useAuth } from './AuthProvider';
import { formatPatientName, usePatient } from './PatientProvider';
import ProtectedRoute from './ProtectedRoute';

const ICON_MAP = {
  ArrowRightOnRectangleIcon,
  BeakerIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HeartIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  SignalIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserPlusIcon,
};

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
    <div className="flex h-full flex-col bg-[#0f2c52] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 ring-1 ring-white/10">
            <img
              src="/images/novacare-icon.png"
              alt="NovaCare Icon"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">NovaCare</p>
            <p className="text-xs text-cyan-100/80">Clinical workflow</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100/65">
                {group}
              </p>
              <ChevronDownIcon className="h-3.5 w-3.5 text-cyan-100/35" />
            </div>
            <div className="space-y-1.5">
              {items.map((item) => {
                const active = pathname === item.href;
                const Icon = ICON_MAP[item.icon] || Squares2X2Icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-white shadow-lg shadow-cyan-900/25'
                        : 'text-slate-200 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-300'}`} />
                    <span>{item.label}</span>
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

export default function AppShell({ title, subtitle, children, showHeader = true }) {
  const { user, profile } = useAuth();
  const { activePatient, activePatientId } = usePatient();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const displayName = useMemo(() => profile?.fullName || user?.email || 'User', [profile, user]);

  async function handleLogout() {
    await closeLoginLog();
    await signOut(auth);
    router.replace('/login');
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-hidden border-r border-slate-200/20 bg-[#0f2c52] xl:block">
          <SidebarContent />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button className="absolute inset-0 bg-slate-900/55" onClick={() => setOpen(false)} aria-label="Close menu" />
            <aside className="relative h-full w-80 max-w-[85vw] overflow-hidden bg-[#0f2c52] shadow-2xl">
              <button className="absolute right-4 top-4 rounded-xl p-2 text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="xl:pl-72">
          {showHeader && (
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm xl:hidden" onClick={() => setOpen(true)}>
                    <Bars3Icon className="h-6 w-6 text-slate-700" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
                    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activePatientId && (
                    <Link
                      href="/patients/select"
                      className="hidden rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2.5 text-left shadow-sm transition hover:bg-cyan-100 xl:block"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Active Patient</p>
                      <p className="text-sm font-semibold text-slate-900">{activePatient ? formatPatientName(activePatient) : activePatientId}</p>
                    </Link>
                  )}

                  <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                      <UserCircleIcon className="h-7 w-7 text-cyan-700" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                      <p className="text-xs capitalize text-slate-500">{profile?.role || 'user'}</p>
                    </div>
                  </div>
                  <button className="btn-secondary inline-flex items-center gap-2" onClick={handleLogout}>
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </header>
          )}

          <main className="min-w-0 p-4 sm:p-6 lg:p-8"><div className="content-shell">{children}</div></main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
