'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  HeartIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/AppShell';
import { MODULES } from '@/lib/roles';
import { useAuth } from '@/components/AuthProvider';
import {
  formatPatientName,
  getPatientDiagnosis,
  getPatientRoomWard,
  usePatient,
} from '@/components/PatientProvider';
import { loadPatientRows } from '@/lib/patientFirestore';

const DASHBOARD_STAT_CARDS = [
  {
    key: 'registeredPatient',
    label: 'Registered Patient',
    icon: UserPlusIcon,
    value: 1,
    tone: 'bg-cyan-50 text-cyan-700',
  },
  {
    key: 'vitalSigns',
    label: 'Vital Sign Entries',
    collectionName: 'vitalSigns',
    icon: HeartIcon,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'doctorOrders',
    label: "Doctor's Orders",
    collectionName: 'doctorOrders',
    icon: ClipboardDocumentListIcon,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'billingItems',
    label: 'Billing Items',
    collectionName: 'billingItems',
    icon: CreditCardIcon,
    tone: 'bg-blue-50 text-blue-700',
  },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const { activePatient, activePatientId } = usePatient();
  const modules = useMemo(
    () => MODULES.filter((item) => item.href !== '/dashboard' && item.roles.includes(profile?.role)),
    [profile?.role]
  );
  const [stats, setStats] = useState({
    registeredPatient: 1,
    vitalSigns: 0,
    doctorOrders: 0,
    billingItems: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      setLoadingStats(true);

      try {
        const [vitalSigns, doctorOrders, billingItems] = await Promise.all([
          loadPatientRows('vitalSigns').catch(() => []),
          loadPatientRows('doctorOrders').catch(() => []),
          loadPatientRows('billingItems').catch(() => []),
        ]);

        if (!mounted) return;

        setStats({
          registeredPatient: 1,
          vitalSigns: vitalSigns.length,
          doctorOrders: doctorOrders.length,
          billingItems: billingItems.length,
        });
      } finally {
        if (mounted) setLoadingStats(false);
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [activePatientId]);

  return (
    <AppShell title="Dashboard" subtitle="Hospital workflow overview">
      <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-7 shadow-sm lg:px-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">System Overview</h1>
            <p className="mt-2 text-sm text-slate-500">
              System overview, workflow modules, and the currently selected patient chart.
            </p>
          </div>

          <Link href="/admission/registration" className="btn-primary inline-flex items-center justify-center gap-2 self-start rounded-2xl px-5 py-3 shadow-lg shadow-cyan-600/15">
            <span className="text-lg leading-none">+</span>
            Register Patient
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STAT_CARDS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="card flex items-center gap-4 p-5 lg:p-6">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-4xl font-black tracking-tight text-slate-950">
                  {loadingStats && item.collectionName ? '...' : stats[item.key] ?? item.value ?? 0}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Modules</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Clinical quick access</h2>
            </div>
            <p className="text-sm text-slate-500">{modules.length} available</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {modules.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/40"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.group}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                  <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <p className="section-kicker">Active patient</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Current patient context</h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Patient</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatPatientName(activePatient)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Patient ID</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activePatient?.patientId || activePatientId || '—'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Care Setting</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{getPatientRoomWard(activePatient)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Primary Diagnosis</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{getPatientDiagnosis(activePatient)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
