'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import {
  clearPatientCollection,
  createClientId,
  getLocalDateTime,
  loadPatientRows,
  savePatientRows,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'vitalSigns';

const createEmptyRow = () => ({
  id: createClientId('vitals'),
  datetime: '',
  bloodPressure: '',
  temperature: '',
  pulseRate: '',
  respiratoryRate: '',
  oxygenSaturation: '',
});

export default function VitalSignsPage() {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    loadRows();
  }, []);

  const loadRows = async () => {
    setIsLoading(true);
    setError('');

    try {
      const savedRows = await loadPatientRows(COLLECTION_NAME, {
        sortBy: 'datetime',
        sortDirection: 'asc',
      });

      setRows(savedRows.length > 0 ? savedRows : [createEmptyRow()]);
    } catch (err) {
      console.error(err);
      setError('Failed to load vital signs records from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const addRow = () => {
    const newRow = createEmptyRow();

    setRows((prev) => [...prev, newRow]);

    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  };

  const deleteRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const clearSheet = async () => {
    if (!confirm('Clear all vital signs entries for this patient?')) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await clearPatientCollection(COLLECTION_NAME);
      setRows([createEmptyRow()]);
      setMessage('Vital signs sheet cleared.');
    } catch (err) {
      console.error(err);
      setError('Failed to clear vital signs records.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSheet = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await savePatientRows(COLLECTION_NAME, rows);
      setMessage('Vital signs sheet saved to Firestore.');
    } catch (err) {
      console.error(err);
      setError('Failed to save vital signs sheet.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Vital Signs" subtitle="Patient monitoring and bedside charting">
      <div className="pb-36">
        <PageIntro
          title="Vital Signs Monitoring"
          description="Record and monitor bedside vital signs in a nurse-friendly charting flowsheet."
        />

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Entries
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Monitoring Status
              </p>

              <p className="mt-1 text-sm font-medium text-emerald-600">
                {isLoading ? 'Loading...' : 'Active Monitoring'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Data Source
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">Firestore</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Vital Signs Flowsheet</h2>

            <p className="mt-1 text-sm text-slate-500">
              Inline bedside charting for repeated monitoring entries.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {['Date / Time', 'BP', 'Temp °C', 'PR', 'RR', 'O₂ Sat', 'Actions'].map(
                    (header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-cyan-50/40">
                    <td className="px-3 py-2">
                      <input
                        ref={index === rows.length - 1 ? firstInputRef : null}
                        type="datetime-local"
                        value={row.datetime || ''}
                        onChange={(e) => updateRow(row.id, 'datetime', e.target.value)}
                        placeholder=""
                        className="w-[180px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.bloodPressure || ''}
                        onChange={(e) => updateRow(row.id, 'bloodPressure', e.target.value)}
                        placeholder=""
                        className="w-[100px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={row.temperature || ''}
                        onChange={(e) => updateRow(row.id, 'temperature', e.target.value)}
                        placeholder=""
                        className="w-[80px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.pulseRate || ''}
                        onChange={(e) => updateRow(row.id, 'pulseRate', e.target.value)}
                        placeholder=""
                        className="w-[80px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.respiratoryRate || ''}
                        onChange={(e) => updateRow(row.id, 'respiratoryRate', e.target.value)}
                        placeholder=""
                        className="w-[80px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.oxygenSaturation || ''}
                        onChange={(e) => updateRow(row.id, 'oxygenSaturation', e.target.value)}
                        placeholder=""
                        className="w-[80px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        className="rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        <div className="fixed bottom-6 left-4 right-4 z-40 lg:left-72 lg:right-0">
          <div className="action-shell">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-slate-800">Vital Signs Monitoring</p>
                <p className="text-xs text-slate-500">
                  Bedside flowsheet documentation for repeated monitoring.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={addRow}
                  disabled={isLoading || isSaving}
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Add Row
                </button>

                <button
                  type="button"
                  onClick={saveSheet}
                  disabled={isLoading || isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Sheet'}
                </button>

                <button
                  type="button"
                  onClick={clearSheet}
                  disabled={isLoading || isSaving}
                  className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
