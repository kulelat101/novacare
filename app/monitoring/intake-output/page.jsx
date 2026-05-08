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

const intakeFields = [
  { key: 'oral', label: 'Oral' },
  { key: 'ivf', label: 'IVF' },
  { key: 'bt', label: 'BT' },
  { key: 'man', label: 'Man.' },
  { key: 'ivAnt', label: 'IV Ant.' },
];

const outputFields = [
  { key: 'urine', label: 'Urine' },
  { key: 'ngt', label: 'NGT' },
  { key: 'vomit', label: 'Vom.' },
  { key: 'others', label: 'Others' },
];

const createEmptyRow = () => ({
  id: createClientId('io'),
  datetime: getLocalDateTime(),
  shift: '',
  oral: '',
  ivf: '',
  bt: '',
  man: '',
  ivAnt: '',
  urine: '',
  ngt: '',
  vomit: '',
  others: '',
  student: '',
  remarks: '',
});

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRowIntakeTotal(row) {
  return intakeFields.reduce((total, field) => total + toNumber(row[field.key]), 0);
}

function getRowOutputTotal(row) {
  return outputFields.reduce((total, field) => total + toNumber(row[field.key]), 0);
}

function hasMeaningfulValue(row) {
  const trackedFields = [
    'shift',
    'oral',
    'ivf',
    'bt',
    'man',
    'ivAnt',
    'urine',
    'ngt',
    'vomit',
    'others',
    'student',
    'remarks',
  ];

  return trackedFields.some((field) => String(row[field] || '').trim() !== '');
}

function normalizeRow(row) {
  return {
    ...createEmptyRow(),
    ...row,
    id: row.id || createClientId('io'),
    datetime: row.datetime || getLocalDateTime(),
    shift: row.shift || '',
    oral: row.oral || '',
    ivf: row.ivf || '',
    bt: row.bt || '',
    man: row.man || '',
    ivAnt: row.ivAnt || '',
    urine: row.urine || '',
    ngt: row.ngt || '',
    vomit: row.vomit || '',
    others: row.others || '',
    student: row.student || '',
    remarks: row.remarks || '',
  };
}

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

      const normalizedRows = savedRows.map(normalizeRow);
      setRows(normalizedRows.length > 0 ? normalizedRows : [createEmptyRow()]);
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
        acc.intake += getRowIntakeTotal(row);
        acc.output += getRowOutputTotal(row);
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
    setRows((prev) => {
      const nextRows = prev.filter((row) => row.id !== id);
      return nextRows.length > 0 ? nextRows : [createEmptyRow()];
    });
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
      const rowsToSave = rows
        .filter(hasMeaningfulValue)
        .map((row) => ({
          ...row,
          intakeTotal: getRowIntakeTotal(row),
          outputTotal: getRowOutputTotal(row),
          balance: getRowIntakeTotal(row) - getRowOutputTotal(row),
        }));

      await savePatientRows(COLLECTION_NAME, rowsToSave);
      setRows(rowsToSave.length > 0 ? rowsToSave.map(normalizeRow) : [createEmptyRow()]);
      setMessage(
        rowsToSave.length > 0
          ? 'Intake and output records saved to Firestore.'
          : 'No filled rows to save. Existing intake and output records were cleared.'
      );
    } catch (err) {
      console.error(err);
      setError('Failed to save intake and output records.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderNumberInput = (row, fieldKey, placeholder = '0') => (
    <input
      type="number"
      min="0"
      value={row[fieldKey] || ''}
      onChange={(e) => updateRow(row.id, fieldKey, e.target.value)}
      placeholder={placeholder}
      className="w-[90px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
    />
  );

  return (
    <AppShell title="Intake & Output" subtitle="Fluid balance monitoring">
      <div className="pb-36">
        <PageIntro
          title="Intake & Output Flowsheet"
          description="Record intake and output in one grouped clinical table without selecting intake or output type."
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
            <p className="mt-1 text-xs text-slate-500">Intake minus output.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">I&O Sheet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter values directly under Intake or Output columns. Row totals are calculated automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th rowSpan="2" className="border-r border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Date / Time
                  </th>
                  <th rowSpan="2" className="border-r border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Shift
                  </th>
                  <th colSpan="6" className="border-r border-slate-200 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-cyan-700">
                    Intake
                  </th>
                  <th colSpan="5" className="border-r border-slate-200 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    Output
                  </th>
                  <th rowSpan="2" className="border-r border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Student
                  </th>
                  <th rowSpan="2" className="border-r border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Remarks
                  </th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>

                <tr className="border-b border-slate-200">
                  {intakeFields.map((field) => (
                    <th
                      key={field.key}
                      className="border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Total
                  </th>

                  {outputFields.map((field) => (
                    <th
                      key={field.key}
                      className="border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const intakeTotal = getRowIntakeTotal(row);
                  const outputTotal = getRowOutputTotal(row);

                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-cyan-50/40">
                      <td className="border-r border-slate-100 px-3 py-3">
                        <input
                          type="datetime-local"
                          value={row.datetime || ''}
                          onChange={(e) => updateRow(row.id, 'datetime', e.target.value)}
                          className="w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3">
                        <select
                          value={row.shift || ''}
                          onChange={(e) => updateRow(row.id, 'shift', e.target.value)}
                          className="w-[145px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        >
                          <option value="">Select shift</option>
                          {shiftOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>

                      {intakeFields.map((field) => (
                        <td key={field.key} className="border-r border-slate-100 px-3 py-3">
                          {renderNumberInput(row, field.key)}
                        </td>
                      ))}

                      <td className="border-r border-slate-100 bg-cyan-50/60 px-3 py-3 font-bold text-cyan-900">
                        {intakeTotal}
                      </td>

                      {outputFields.map((field) => (
                        <td key={field.key} className="border-r border-slate-100 px-3 py-3">
                          {renderNumberInput(row, field.key)}
                        </td>
                      ))}

                      <td className="border-r border-slate-100 bg-amber-50/60 px-3 py-3 font-bold text-amber-900">
                        {outputTotal}
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3">
                        <input
                          type="text"
                          value={row.student || ''}
                          onChange={(e) => updateRow(row.id, 'student', e.target.value)}
                          placeholder="Student name"
                          className="w-[170px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={(e) => updateRow(row.id, 'remarks', e.target.value)}
                          placeholder="Remarks"
                          className="w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
                <p className="text-sm font-semibold text-slate-800">Intake & Output</p>
                <p className="text-xs text-slate-500">
                  {isLoading
                    ? 'Loading records from Firestore...'
                    : 'Blank rows are ignored when saving.'}
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
                  onClick={loadRows}
                  disabled={isLoading || isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Load Saved
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
