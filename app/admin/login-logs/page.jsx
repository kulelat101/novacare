'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import AppShell from '@/components/AppShell';
import { db } from '@/lib/firebase';

function formatTime(value) {
  if (!value?.toDate) return '—';
  return value.toDate().toLocaleString();
}

function formatText(value) {
  const text = String(value || '').trim();
  return text || '—';
}

function getPatientDoctorLabel(log) {
  const role = String(log.role || log.accountType || '').toLowerCase();

  if (role === 'patient') {
    return formatText(log.patientName || log.fullName || log.patientId || log.linkedPatientId);
  }

  if (role === 'doctor') {
    return formatText(log.doctorName || log.fullName || log.doctorId);
  }

  return formatText(log.patientName || log.doctorName || log.patientId || log.doctorId);
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError('');

      try {
        const logsQuery = query(
          collection(db, 'loginLogs'),
          orderBy('loginAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(logsQuery);
        setLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (err) {
        console.error(err);
        setError('Failed to load login logs. Please check Firestore rules for loginLogs read access.');
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
          <p className="mt-1 text-sm text-slate-500">
            This page records nurse, doctor, and patient account login/logout timestamps. It does not track page visits or clinical actions.
          </p>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Patient / Doctor</th>
                <th className="px-5 py-3">Login</th>
                <th className="px-5 py-3">Logout</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td className="px-5 py-4 text-slate-500" colSpan="7">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td className="px-5 py-4 text-slate-500" colSpan="7">No login logs yet.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{formatText(log.fullName)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatText(log.email)}</td>
                  <td className="px-5 py-4 capitalize text-slate-600">{formatText(log.role || log.accountType)}</td>
                  <td className="px-5 py-4 text-slate-600">{getPatientDoctorLabel(log)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatTime(log.loginAt)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatTime(log.logoutAt)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                      {formatText(log.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
