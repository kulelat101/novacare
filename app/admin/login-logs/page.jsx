'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { fetchRecent } from '@/lib/db';

function formatTime(value) {
  if (!value?.toDate) return '—';
  return value.toDate().toLocaleString();
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const rows = await fetchRecent('loginLogs', 50);
        setLogs(rows);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <AppShell title="Login Logs" subtitle="Tracks login and logout date/time only">
      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">Access Monitoring</h2>
          <p className="mt-1 text-sm text-slate-500">This page records only login and logout timestamps. It does not track page visits or clinical actions.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Login</th>
                <th className="px-5 py-3">Logout</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td className="px-5 py-4 text-slate-500" colSpan="6">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td className="px-5 py-4 text-slate-500" colSpan="6">No login logs yet.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{log.fullName}</td>
                  <td className="px-5 py-4 text-slate-600">{log.email}</td>
                  <td className="px-5 py-4 capitalize text-slate-600">{log.role}</td>
                  <td className="px-5 py-4 text-slate-600">{formatTime(log.loginAt)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatTime(log.logoutAt)}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
