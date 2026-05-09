'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import {
  clearPatientCollection,
  createClientId,
  getLocalDateTime,
  loadPatientRows,
  savePatientRows,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'medicationRecords';

const statusOptions = ['Given', 'Completed', 'Held', 'Refused'];

const createEmptyRow = () => ({
  id: createClientId('med'),
  datetime: getLocalDateTime(),
  medication: '',
  dose: '',
  route: '',
  frequency: '',
  orderedBy: '',
  timeGiven: '',
  status: '',
  nurse: '',
  remarks: '',
});

export default function MedicationRecordPage() {
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
        sortBy: 'datetime',
        sortDirection: 'asc',
      });

      setRows(savedRows.length > 0 ? savedRows : [createEmptyRow()]);
    } catch (err) {
      console.error(err);
      setError('Failed to load medication records from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.status === 'Given') acc.given += 1;
        if (row.status === 'Completed') acc.completed += 1;
        if (row.status === 'Held') acc.held += 1;
        if (row.status === 'Refused') acc.refused += 1;
        return acc;
      },
      { given: 0, completed: 0, held: 0, refused: 0 }
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
    if (!confirm('Clear all medication records for this patient?')) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await clearPatientCollection(COLLECTION_NAME);
      setRows([createEmptyRow()]);
      setMessage('Medication record cleared.');
    } catch (err) {
      console.error(err);
      setError('Failed to clear medication records.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveRecords = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await savePatientRows(COLLECTION_NAME, rows);
      setMessage('Medication records saved to Firestore.');
    } catch (err) {
      console.error(err);
      setError('Failed to save medication records.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Medication Record" subtitle="Medication administration record">
      <div className="pb-36">
        <PageIntro
          title="Medication Record"
          description="Document ordered medications, administration status, and nursing remarks."
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

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Given</p>
            <h3 className="mt-2 text-2xl font-bold text-emerald-900">{summary.given}</h3>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Completed</p>
            <h3 className="mt-2 text-2xl font-bold text-cyan-900">{summary.completed}</h3>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Held</p>
            <h3 className="mt-2 text-2xl font-bold text-amber-900">{summary.held}</h3>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">Refused</p>
            <h3 className="mt-2 text-2xl font-bold text-red-900">{summary.refused}</h3>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Medication Administration Sheet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Table-style MAR entries with status tracking.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    'Date / Time',
                    'Medication',
                    'Dose',
                    'Route',
                    'Frequency',
                    'Ordered By',
                    'Time Given',
                    'Status',
                    'Nurse',
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
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-cyan-50/40">
                    <td className="px-3 py-3">
                      <input
                        type="datetime-local"
                        value={row.datetime || ''}
                        onChange={(e) => updateRow(row.id, 'datetime', e.target.value)}
                        className="w-[180px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.medication || ''}
                        onChange={(e) => updateRow(row.id, 'medication', e.target.value)}
                        placeholder=""
                        className="w-[190px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.dose || ''}
                        onChange={(e) => updateRow(row.id, 'dose', e.target.value)}
                        placeholder=""
                        className="w-[110px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.route || ''}
                        onChange={(e) => updateRow(row.id, 'route', e.target.value)}
                        placeholder=""
                        className="w-[110px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.frequency || ''}
                        onChange={(e) => updateRow(row.id, 'frequency', e.target.value)}
                        placeholder=""
                        className="w-[140px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.orderedBy || ''}
                        onChange={(e) => updateRow(row.id, 'orderedBy', e.target.value)}
                        placeholder=""
                        className="w-[160px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="time"
                        value={row.timeGiven || ''}
                        onChange={(e) => updateRow(row.id, 'timeGiven', e.target.value)}
                        className="w-[120px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={row.status || ''}
                        onChange={(e) => updateRow(row.id, 'status', e.target.value)}
                        className="w-[150px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
                        value={row.nurse || ''}
                        onChange={(e) => updateRow(row.id, 'nurse', e.target.value)}
                        placeholder=""
                        className="w-[150px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
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
                ))}
              </tbody>
            </table>
          </div>
        </section>


        <div className="fixed bottom-6 left-4 right-4 z-40 xl:left-72 xl:right-0">
          <div className="action-shell">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-slate-800">Medication Record</p>
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
