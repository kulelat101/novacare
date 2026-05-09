'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import {
  clearPatientCollection,
  createClientId,
  getLocalDate,
  getLocalTime,
  loadPatientRows,
  savePatientRows,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'ivSheet';

const statusOptions = ['Running', 'Consumed', 'Discontinued', 'Changed', 'Held'];

const createEmptyRow = () => ({
  id: createClientId('iv'),
  solutionBottle: '',
  dateStarted: getLocalDate(),
  timeStarted: getLocalTime(),
  dateConsumed: '',
  timeConsumed: '',
  status: '',
  remarks: '',
});

function calculateDuration(row) {
  if (!row.dateStarted || !row.timeStarted || !row.dateConsumed || !row.timeConsumed) {
    return '—';
  }

  const start = new Date(`${row.dateStarted}T${row.timeStarted}`);
  const end = new Date(`${row.dateConsumed}T${row.timeConsumed}`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '—';
  }

  if (end < start) {
    return 'Invalid';
  }

  const diffMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export default function IVSheetPage() {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRows();
  }, []);

  const loadRows = async () => {
    setIsLoading(true);
    setError('');

    try {
      const savedRows = await loadPatientRows(COLLECTION_NAME, {
        sortBy: 'dateStarted',
        sortDirection: 'asc',
      });

      setRows(savedRows.length > 0 ? savedRows : [createEmptyRow()]);
    } catch (err) {
      console.error(err);
      setError('Failed to load IV sheet records from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.status === 'Running') acc.running += 1;
        if (row.status === 'Consumed') acc.consumed += 1;
        if (row.status === 'Held') acc.held += 1;
        return acc;
      },
      { running: 0, consumed: 0, held: 0 }
    );
  }, [rows]);

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
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const deleteRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const clearSheet = async () => {
    if (!confirm('Clear all IV sheet records for this patient?')) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await clearPatientCollection(COLLECTION_NAME);
      setRows([createEmptyRow()]);
      setMessage('IV sheet cleared.');
    } catch (err) {
      console.error(err);
      setError('Failed to clear IV sheet records.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveRecords = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const rowsWithDuration = rows.map((row) => ({
        ...row,
        duration: calculateDuration(row),
      }));

      await savePatientRows(COLLECTION_NAME, rowsWithDuration);
      setRows(rowsWithDuration);
      setMessage('IV sheet records saved to Firestore.');
    } catch (err) {
      console.error(err);
      setError('Failed to save IV sheet records.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="IV Sheet" subtitle="Intravenous fluid monitoring">
      <div className="pb-36">
        <PageIntro
          title="IV Sheet"
          description="Track IV solutions, bottle timing, duration, status, and remarks."
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

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Running</p>
            <h3 className="mt-2 text-2xl font-bold text-cyan-900">{summary.running}</h3>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Consumed</p>
            <h3 className="mt-2 text-2xl font-bold text-emerald-900">{summary.consumed}</h3>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Held</p>
            <h3 className="mt-2 text-2xl font-bold text-amber-900">{summary.held}</h3>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">IV Fluid Monitoring</h2>
            <p className="mt-1 text-sm text-slate-500">
              Duration is calculated once start and consumed date/time are provided.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    'Solution & Bottle',
                    'Date Started',
                    'Time Started',
                    'Date Consumed',
                    'Time Consumed',
                    'Duration',
                    'Status',
                    'Remarks',
                    'Actions',
                  ].map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const duration = calculateDuration(row);

                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-cyan-50/40">
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={row.solutionBottle || ''}
                          onChange={(e) => updateRow(row.id, 'solutionBottle', e.target.value)}
                          placeholder=""
                          className="w-[210px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="date"
                          value={row.dateStarted || ''}
                          onChange={(e) => updateRow(row.id, 'dateStarted', e.target.value)}
                          className="w-[150px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="time"
                          value={row.timeStarted || ''}
                          onChange={(e) => updateRow(row.id, 'timeStarted', e.target.value)}
                          className="w-[120px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="date"
                          value={row.dateConsumed || ''}
                          onChange={(e) => updateRow(row.id, 'dateConsumed', e.target.value)}
                          className="w-[150px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="time"
                          value={row.timeConsumed || ''}
                          onChange={(e) => updateRow(row.id, 'timeConsumed', e.target.value)}
                          className="w-[120px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex min-w-[90px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                            duration === 'Invalid'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {duration}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <select
                          value={row.status || ''}
                          onChange={(e) => updateRow(row.id, 'status', e.target.value)}
                          className="w-[160px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        >
                          <option value=""></option>
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={(e) => updateRow(row.id, 'remarks', e.target.value)}
                          placeholder=""
                          className="w-[220px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>


        <div className="fixed bottom-6 left-4 right-4 z-40 lg:left-72 lg:right-0">
          <div className="action-shell">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-slate-800">IV Sheet</p>
                <p className="text-xs text-slate-500">
                  {isLoading ? 'Loading records from Firestore...' : 'Save visible rows for the active patient.'}
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
                  onClick={clearSheet}
                  disabled={isLoading || isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={saveRecords}
                  disabled={isLoading || isSaving}
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Records'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
