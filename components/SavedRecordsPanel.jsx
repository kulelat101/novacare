'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  deletePatientDocument,
  loadPatientRows,
} from '@/lib/patientFirestore';
import { usePatient } from './PatientProvider';

const HIDDEN_KEYS = new Set([
  'id',
  'patientId',
  'createdAt',
  'updatedAt',
]);

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleString();
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '—';

    const hasOnlySimpleValues = value.every((item) => {
      return item === null || ['string', 'number', 'boolean'].includes(typeof item);
    });

    if (hasOnlySimpleValues) {
      return value.map((item) => String(item)).join(', ');
    }

    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function getRecordDate(record) {
  return (
    record.dateTime ||
    record.reportDate ||
    record.assessmentDateTime ||
    record.dateAdmission ||
    record.dischargeDateTime ||
    record.datetime ||
    record.updatedAt ||
    record.createdAt ||
    ''
  );
}

function defaultTitle(record, index) {
  return (
    record.order ||
    record.orderName ||
    record.panelName ||
    record.title ||
    record.doctorName ||
    record.imagingType ||
    record.testName ||
    record.finalDiagnosis ||
    record.caseNo ||
    `Record ${index + 1}`
  );
}

function DefaultDetails({ record }) {
  const normalFields = Object.entries(record).filter(([key]) => {
    return !HIDDEN_KEYS.has(key) && key !== 'results' && key !== 'checklist';
  });

  return (
    <div className="space-y-5">
      {normalFields.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {normalFields.map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {formatLabel(key)}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-slate-800">
                {formatValue(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(record.results) && record.results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Result Details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-white text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {record.results.map((item, index) => (
                  <tr key={item.key || item.test || item.label || index}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.test || item.label || item.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatValue(item.result)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatValue(item.unit)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatValue(item.reference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedRecordsPanel({
  collectionName,
  title = 'Saved Records',
  description = 'Previously saved records for the active patient.',
  emptyMessage = 'No saved records yet.',
  sortBy = 'createdAt',
  sortDirection = 'desc',
  refreshKey = 0,
  getTitle = defaultTitle,
  getSubtitle,
  getBadge,
  renderDetails,
  canDelete = true,
  onRecordSelect,
}) {
  const { activePatientId } = usePatient();
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function loadRecords() {
    setIsLoading(true);
    setError('');

    try {
      const rows = await loadPatientRows(collectionName, {
        sortBy,
        sortDirection,
      });

      setRecords(rows);
      setSelectedId((current) => {
        if (current && rows.some((item) => item.id === current)) return current;
        return rows[0]?.id || '';
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load saved records from Firestore.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [collectionName, refreshKey, activePatientId]);

  const selectedRecord = useMemo(
    () => records.find((item) => item.id === selectedId),
    [records, selectedId]
  );

  function handleSelectRecord(record) {
    setSelectedId(record.id);

    if (onRecordSelect) {
      onRecordSelect(record);
    }
  }

  async function handleDelete(recordId) {
    if (!confirm('Delete this saved record?')) return;

    setIsDeleting(true);
    setError('');

    try {
      await deletePatientDocument(collectionName, recordId);
      await loadRecords();
    } catch (err) {
      console.error(err);
      setError('Failed to delete saved record.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="section-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-kicker">History</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={loadRecords}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="px-6 py-8 text-sm text-slate-500">Loading saved records...</div>
      ) : records.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[360px,1fr]">
          <div className="max-h-[540px] overflow-y-auto border-b border-slate-200 lg:border-b-0 lg:border-r">
            {records.map((record, index) => {
              const active = record.id === selectedId;
              const subtitle = getSubtitle
                ? getSubtitle(record, index)
                : formatValue(getRecordDate(record));
              const badge = getBadge?.(record, index);

              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => handleSelectRecord(record)}
                  className={`block w-full border-b border-slate-100 px-5 py-4 text-left transition ${
                    active ? 'bg-cyan-50/70' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {getTitle(record, index)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                    </div>

                    {badge && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-5 lg:p-6">
            {selectedRecord ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {getTitle(selectedRecord, records.findIndex((item) => item.id === selectedRecord.id))}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {getSubtitle
                        ? getSubtitle(selectedRecord, records.findIndex((item) => item.id === selectedRecord.id))
                        : formatValue(getRecordDate(selectedRecord))}
                    </p>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedRecord.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>

                {renderDetails ? (
                  renderDetails(selectedRecord)
                ) : (
                  <DefaultDetails record={selectedRecord} />
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a saved record to view details.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
