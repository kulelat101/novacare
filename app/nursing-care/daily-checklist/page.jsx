'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import SavedRecordsPanel from '@/components/SavedRecordsPanel';
import {
  getLocalDate,
  loadPatientDocument,
  savePatientDocument,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'dailyChecklist';

const ACTIVITIES = [
  'Vital Signs',
  'Intake & Output',
  'Medication Record',
  'Nursing Care Plan',
  'Monitoring',
  'Fall Assessment',
  'Skin Assessment',
  'Health Teaching',
  'Laboratory Results Checking',
  'Health Assessment',
];

const STATUS_OPTIONS = ['Done', 'N/A', 'Discharged'];

function getDateRangeDocumentId(from, to) {
  return `${from || 'no-start'}_to_${to || 'no-end'}`;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value.toISOString().split('T')[0];
}

export default function DailyChecklistPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dates, setDates] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const today = getLocalDate();
    const next4 = addDays(today, 4);

    setDateFrom(today);
    setDateTo(next4);
    generateDates(today, next4);
  }, []);

  const generateDates = (from, to) => {
    setMessage('');
    setError('');

    if (!from || !to) return;

    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);

    if (end < start) {
      setError('Date To cannot be earlier than Date From.');
      return;
    }

    const generated = [];
    const current = new Date(start);

    while (current <= end) {
      generated.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    setDates(generated);

    const initialChecklist = {};

    ACTIVITIES.forEach((activity) => {
      initialChecklist[activity] = Array(generated.length).fill('Done');
    });

    setChecklist(initialChecklist);
  };

  const updateChecklist = (activity, dayIndex, value) => {
    setChecklist((prev) => ({
      ...prev,
      [activity]: prev[activity].map((status, index) =>
        index === dayIndex ? value : status
      ),
    }));
  };

  const saveChecklist = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await savePatientDocument(
        COLLECTION_NAME,
        getDateRangeDocumentId(dateFrom, dateTo),
        {
          dateFrom,
          dateTo,
          dates,
          remarks,
          checklist,
        }
      );

      setMessage('Checklist saved to Firestore.');
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setError('Failed to save checklist.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadChecklist = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const saved = await loadPatientDocument(
        COLLECTION_NAME,
        getDateRangeDocumentId(dateFrom, dateTo)
      );

      if (!saved) {
        setError('No saved checklist found for the selected date range.');
        return;
      }

      setDateFrom(saved.dateFrom || '');
      setDateTo(saved.dateTo || '');
      setDates(saved.dates || []);
      setRemarks(saved.remarks || '');
      setChecklist(saved.checklist || {});
      setMessage('Saved checklist loaded from Firestore.');
    } catch (err) {
      console.error(err);
      setError('Failed to load checklist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell
      title="Daily Checklist"
      subtitle="Track daily nursing responsibilities and completion status."
    >
      <PageIntro
        title="Daily Checklist"
        description="Track daily nursing responsibilities and completion status."
      />

      <div className="space-y-6 pb-36">
        {(message || error) && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Configure Checklist Period</h2>
          <p className="mb-6 text-sm text-slate-500">
            Select the date range for this nursing checklist.
          </p>

          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <button
              type="button"
              onClick={() => generateDates(dateFrom, dateTo)}
              className="h-[50px] rounded-xl bg-cyan-600 text-white transition hover:bg-cyan-700"
            >
              Generate Checklist
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Nursing Activities</h2>

          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Activity</th>

                {dates.map((date) => (
                  <th key={date} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-500">
                        {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </span>

                      <span>
                        {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ACTIVITIES.map((activity) => (
                <tr key={activity} className="border-b border-slate-100">
                  <td className="px-4 py-4 font-medium">{activity}</td>

                  {checklist[activity]?.map((status, dayIndex) => (
                    <td key={dayIndex} className="px-4 py-4 text-center">
                      <select
                        value={status}
                        onChange={(e) => updateChecklist(activity, dayIndex, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Remarks</h2>

          <textarea
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="General remarks for this checklist period..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <SavedRecordsPanel
          collectionName={COLLECTION_NAME}
          title="Saved Checklist History"
          description="View previously saved checklist periods for the active patient."
          sortBy="updatedAt"
          sortDirection="desc"
          refreshKey={refreshKey}
          getTitle={(record) => `${record.dateFrom || 'No start'} to ${record.dateTo || 'No end'}`}
          getSubtitle={(record) => `${record.dates?.length || 0} day${record.dates?.length === 1 ? '' : 's'} recorded`}
          getBadge={() => 'Checklist'}
          renderDetails={(record) => (
            <div className="space-y-5">
              {record.remarks && (
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <p className="section-kicker">Remarks</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{record.remarks}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3">Activity</th>
                        {record.dates?.map((date) => (
                          <th key={date} className="px-4 py-3 text-center">{date}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {Object.entries(record.checklist || {}).map(([activity, statuses]) => (
                        <tr key={activity}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{activity}</td>
                          {Array.isArray(statuses) && statuses.map((status, index) => (
                            <td key={index} className="px-4 py-3 text-center text-slate-700">{status}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 lg:left-72 lg:right-0">
        <div className="action-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={loadChecklist}
            disabled={isLoading || isSaving}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Load Saved'}
          </button>

          <button
            type="button"
            onClick={saveChecklist}
            disabled={isLoading || isSaving}
            className="rounded-xl bg-cyan-600 px-5 py-3 text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Checklist'}
          </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
