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

const COLLECTION_NAME = 'intakeOutput';

const shiftOptions = ['AM (6-2)', 'PM (2-10)', 'NIGHT (10-6)'];
const typeOptions = ['INPUT', 'OUTPUT'];
const routeOptions = ['PO', 'IVF', 'NGT', 'URINE', 'BM', 'EMESIS', 'BLOOD LOSS', 'DRAIN'];
const unitOptions = ['mL', 'x', 'cc'];

const createEmptyRow = () => ({
  id: createClientId('io'),
  datetime: getLocalDateTime(),
  shift: '',
  type: '',
  route: '',
  amount: '',
  unit: '',
});

export default function IntakeOutputPage() {
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
      setError('Failed to load intake and output records from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const amount = Number(row.amount) || 0;
        const unit = row.unit?.toLowerCase();

        if (unit !== 'ml' && unit !== 'cc') {
          return acc;
        }

        if (row.type === 'INPUT') {
          acc.intake += amount;
        }

        if (row.type === 'OUTPUT') {
          acc.output += amount;
        }

        acc.balance = acc.intake - acc.output;

        return acc;
      },
      { intake: 0, output: 0, balance: 0 }
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
    if (!confirm('Clear all intake and output records for this patient?')) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await clearPatientCollection(COLLECTION_NAME);
      setRows([createEmptyRow()]);
      setMessage('Intake and output sheet cleared.');
    } catch (err) {
      console.error(err);
      setError('Failed to clear intake and output records.');
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
      setMessage('Intake and output records saved to Firestore.');
    } catch (err) {
      console.error(err);
      setError('Failed to save intake and output records.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Intake & Output" subtitle="Fluid balance monitoring">
      <div className="pb-36">
        <PageIntro
          title="Intake & Output Flowsheet"
          description="Track fluid intake, output, and balance using a clinical flowsheet layout."
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
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Total Intake</p>
            <h3 className="mt-2 text-2xl font-bold text-cyan-900">{totals.intake} mL</h3>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Total Output</p>
            <h3 className="mt-2 text-2xl font-bold text-amber-900">{totals.output} mL</h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fluid Balance</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{totals.balance} mL</h3>
            <p className="mt-1 text-xs text-slate-500">Only mL and cc units are counted.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">I&O Sheet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Spreadsheet-style documentation for intake and output entries.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {['Date / Time', 'Shift', 'Type', 'Route', 'Amount', 'Unit', 'Actions'].map(
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
                      <select
                        value={row.shift || ''}
                        onChange={(e) => updateRow(row.id, 'shift', e.target.value)}
                        className="w-[150px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Select shift</option>
                        {shiftOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={row.type || ''}
                        onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                        className="w-[120px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Select type</option>
                        {typeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={row.route || ''}
                        onChange={(e) => updateRow(row.id, 'route', e.target.value)}
                        className="w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Select route</option>
                        {routeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-[110px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={row.unit || ''}
                        onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                        className="w-[110px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Select unit</option>
                        {unitOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
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
                <p className="text-sm font-semibold text-slate-800">Intake & Output</p>
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
