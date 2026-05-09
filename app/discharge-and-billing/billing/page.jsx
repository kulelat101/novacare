'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/lib/roles';
import {
  clearPatientCollection,
  createClientId,
  loadPatientRows,
  savePatientRows,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'billingItems';

const categoryOptions = [
  'Room Charges',
  'Professional Fees',
  'Operating Room Charges',
  'Pharmacy',
  'Laboratory',
  'Diagnostics',
  'Supplies and Materials',
  'Miscellaneous Charges',
  'Deductions',
  'Others',
];

const statusOptions = ['Unpaid', 'Paid', 'Partially Paid', 'Waived'];

const createEmptyRow = () => ({
  id: createClientId('bill'),
  category: '',
  description: '',
  amount: '',
  status: '',
  breakdown: '',
});

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayText(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function BillingPage() {
  const { profile } = useAuth();
  const isPatientView = profile?.role === ROLES.PATIENT;
  const [rows, setRows] = useState([createEmptyRow()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRows = async () => {
    setIsLoading(true);
    setError('');

    try {
      const savedRows = await loadPatientRows(COLLECTION_NAME, {
        sortBy: 'createdAt',
        sortDirection: 'asc',
      });

      setRows(savedRows.length > 0 ? savedRows : isPatientView ? [] : [createEmptyRow()]);
    } catch (err) {
      console.error(err);
      setError('Failed to load billing records from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [isPatientView]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const amount = Number(row.amount) || 0;
        const isDeduction = row.category === 'Deductions';

        if (isDeduction) {
          acc.deductions += amount;
        } else {
          acc.totalCharges += amount;

          if (row.status === 'Paid' || row.status === 'Waived') {
            acc.paid += amount;
          }
        }

        acc.totalBill = Math.max(acc.totalCharges - acc.deductions, 0);
        acc.balance = Math.max(acc.totalBill - acc.paid, 0);
        acc.unpaid = acc.balance;

        return acc;
      },
      {
        totalCharges: 0,
        deductions: 0,
        totalBill: 0,
        paid: 0,
        unpaid: 0,
        balance: 0,
      }
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

  const clearBilling = async () => {
    if (!confirm('Clear all billing items for this patient?')) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await clearPatientCollection(COLLECTION_NAME);
      setRows([createEmptyRow()]);
      setMessage('Billing sheet cleared.');
    } catch (err) {
      console.error(err);
      setError('Failed to clear billing records.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBilling = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await savePatientRows(COLLECTION_NAME, rows);
      setMessage('Billing records saved to Firestore.');
    } catch (err) {
      console.error(err);
      setError('Failed to save billing records.');
    } finally {
      setIsSaving(false);
    }
  };

  const headers = isPatientView
    ? ['Category', 'Description', 'Amount (₱)', 'Status', 'Breakdown']
    : ['Category', 'Description', 'Amount (₱)', 'Status', 'Breakdown', 'Actions'];

  return (
    <AppShell title="Billing" subtitle={isPatientView ? 'View billing statement' : 'Patient billing items and payment status'}>
      <div className={isPatientView ? '' : 'pb-36'}>
        <PageIntro
          title="Billing Sheet"
          description={isPatientView ? 'View your billing statement and balance.' : 'Track patient charges, payment status, and billing breakdown.'}
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

        {isPatientView && (
          <div className="mb-6 rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm font-medium text-cyan-800">
            This page is view-only for patient accounts.
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Charges</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {formatPeso(summary.totalCharges)}
            </h3>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Deductions</p>
            <h3 className="mt-2 text-2xl font-bold text-violet-900">
              - {formatPeso(summary.deductions)}
            </h3>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Total Bill</p>
            <h3 className="mt-2 text-2xl font-bold text-cyan-900">
              {formatPeso(summary.totalBill)}
            </h3>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Paid / Waived</p>
            <h3 className="mt-2 text-2xl font-bold text-emerald-900">{formatPeso(summary.paid)}</h3>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">Balance</p>
            <h3 className="mt-2 text-2xl font-bold text-red-900">{formatPeso(summary.balance)}</h3>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Billing Items</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isPatientView
                ? 'These billing items are read-only for patient accounts.'
                : 'Billing items here are used by the Discharge Billing Clearance panel.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {headers.map((header) => (
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
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="px-6 py-8 text-sm text-slate-500">
                      No billing items found yet.
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-cyan-50/40">
                    <td className="px-3 py-3">
                      {isPatientView ? (
                        <p className="text-sm font-semibold text-slate-800">{displayText(row.category)}</p>
                      ) : (
                        <select
                          value={row.category || ''}
                          onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                          className="w-[190px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        >
                          <option value=""></option>
                          {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {isPatientView ? (
                        <p className="text-sm text-slate-700">{displayText(row.description)}</p>
                      ) : (
                        <input
                          type="text"
                          value={row.description || ''}
                          onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                          placeholder=""
                          className="w-[280px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {isPatientView ? (
                        <p className="text-sm font-semibold text-slate-800">{formatPeso(row.amount)}</p>
                      ) : (
                        <input
                          type="number"
                          value={row.amount || ''}
                          onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                          placeholder=""
                          className="w-[140px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {isPatientView ? (
                        <p className="text-sm text-slate-700">{displayText(row.status)}</p>
                      ) : (
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
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {isPatientView ? (
                        <p className="text-sm text-slate-700">{displayText(row.breakdown)}</p>
                      ) : (
                        <input
                          type="text"
                          value={row.breakdown || ''}
                          onChange={(e) => updateRow(row.id, 'breakdown', e.target.value)}
                          placeholder=""
                          className="w-[240px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      )}
                    </td>

                    {!isPatientView && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          className="rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {!isPatientView && (
          <div className="fixed bottom-6 left-4 right-4 z-40 lg:left-72 lg:right-0">
            <div className="action-shell">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Billing Sheet</p>
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
                    onClick={clearBilling}
                    disabled={isLoading || isSaving}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={saveBilling}
                    disabled={isLoading || isSaving}
                    className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save Billing'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
