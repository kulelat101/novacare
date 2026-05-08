'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { MODULES } from '@/lib/roles';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { profile } = useAuth();
  const modules = MODULES.filter((item) => item.href !== '/dashboard' && item.roles.includes(profile?.role));

  return (
    <AppShell title="Dashboard" subtitle="Hospital workflow overview">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Active Role</p>
          <p className="mt-2 text-2xl font-black capitalize text-slate-900">{profile?.role}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Available Modules</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{modules.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">System Type</p>
          <p className="mt-2 text-2xl font-black text-slate-900">Demo</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Backend</p>
          <p className="mt-2 text-2xl font-black text-slate-900">Firebase</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => (
          <Link key={item.href} href={item.href} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{item.group}</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">{item.label}</h3>
            <p className="mt-2 text-sm text-slate-500">Open module</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
