'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import {
  deletePatientDocument,
  getLocalDate,
  loadPatientRows,
  savePatientDocument,
} from '@/lib/patientFirestore';
import { usePatient } from '@/components/PatientProvider';

const COLLECTION_NAME = 'dailyChecklists';

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

const DATE_RANGE_STORAGE_KEY = 'novacare_daily_checklist_date_range';

function getPatientDateRangeStorageKey(patientId) {
  return patientId
    ? `${DATE_RANGE_STORAGE_KEY}_${patientId}`
    : DATE_RANGE_STORAGE_KEY;
}

function isDateInputValue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function getDefaultDateRange() {
  const today = getLocalDate();

  return {
    dateFrom: today,
    dateTo: addDays(today, 4),
  };
}

function normalizeStoredDateRange(value) {
  if (!value || typeof value !== 'object') return null;

  const storedDateFrom = String(value.dateFrom || '');
  const storedDateTo = String(value.dateTo || '');

  if (!isDateInputValue(storedDateFrom) || !isDateInputValue(storedDateTo)) {
    return null;
  }

  if (parseDateInput(storedDateTo) < parseDateInput(storedDateFrom)) {
    return null;
  }

  return {
    dateFrom: storedDateFrom,
    dateTo: storedDateTo,
  };
}

function readStoredDateRange(patientId) {
  if (typeof window === 'undefined') return null;

  const keysToTry = [
    getPatientDateRangeStorageKey(patientId),
    DATE_RANGE_STORAGE_KEY,
  ];

  for (const key of keysToTry) {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) continue;

    try {
      const normalizedRange = normalizeStoredDateRange(JSON.parse(rawValue));
      if (normalizedRange) return normalizedRange;
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  return null;
}

function saveStoredDateRange(dateFrom, dateTo, patientId) {
  if (typeof window === 'undefined') return;

  const normalizedRange = normalizeStoredDateRange({ dateFrom, dateTo });
  if (!normalizedRange) return;

  const payload = JSON.stringify(normalizedRange);

  window.localStorage.setItem(DATE_RANGE_STORAGE_KEY, payload);

  if (patientId) {
    window.localStorage.setItem(getPatientDateRangeStorageKey(patientId), payload);
  }
}

function parseDateInput(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const value = parseDateInput(dateString);
  value.setDate(value.getDate() + days);
  return formatDateInput(value);
}

function generateDateValues(from, to) {
  if (!from || !to) return [];

  const start = parseDateInput(from);
  const end = parseDateInput(to);

  if (end < start) return [];

  const generated = [];
  const current = new Date(start);

  while (current <= end) {
    generated.push(formatDateInput(current));
    current.setDate(current.getDate() + 1);
  }

  return generated;
}

function createEmptyChecklist(dateCount) {
  const initialChecklist = {};

  ACTIVITIES.forEach((activity) => {
    initialChecklist[activity] = Array(dateCount).fill('');
  });

  return initialChecklist;
}

function getActivityKey(activity) {
  return activity
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getChecklistDocumentId(date, activity) {
  return `${date}_${getActivityKey(activity)}`;
}

function buildEntriesFromChecklist(checklist, dates) {
  const entries = [];

  ACTIVITIES.forEach((activity) => {
    const statuses = checklist[activity] || [];

    dates.forEach((date, index) => {
      const status = statuses[index];

      if (!status) return;

      entries.push({
        id: getChecklistDocumentId(date, activity),
        date,
        activity,
        activityKey: getActivityKey(activity),
        status,
      });
    });
  });

  return entries;
}

function createChecklistFromRows(rows, dates) {
  const checklist = createEmptyChecklist(dates.length);
  const dateIndexByDate = new Map(dates.map((date, index) => [date, index]));

  rows.forEach((row) => {
    const dateIndex = dateIndexByDate.get(row.date);

    if (dateIndex === undefined) return;
    if (!ACTIVITIES.includes(row.activity)) return;
    if (!STATUS_OPTIONS.includes(row.status)) return;

    checklist[row.activity][dateIndex] = row.status;
  });

  return checklist;
}

function formatDisplayDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DailyChecklistPage() {
  const { activePatientId } = usePatient();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dates, setDates] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedEntries = useMemo(
    () => buildEntriesFromChecklist(checklist, dates),
    [checklist, dates]
  );

  const loadChecklistForDates = useCallback(async (dateValues, options = {}) => {
    const { showMessage = false } = options;

    setError('');

    if (!Array.isArray(dateValues) || dateValues.length === 0) {
      setChecklist({});
      return;
    }

    setIsLoading(true);

    try {
      const dateSet = new Set(dateValues);
      const rows = await loadPatientRows(COLLECTION_NAME, {
        patientId: activePatientId,
        sortBy: 'date',
        sortDirection: 'asc',
      });

      const matchingRows = rows.filter((row) => {
        return row.date && dateSet.has(row.date);
      });

      setChecklist(createChecklistFromRows(matchingRows, dateValues));

      if (showMessage) {
        setMessage(
          matchingRows.length > 0
            ? 'Saved checklist data loaded for the selected date range.'
            : 'No saved checklist data found for the selected date range.'
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.message
          ? `Failed to load checklist: ${err.message}`
          : 'Failed to load checklist.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activePatientId]);

  useEffect(() => {
    const storedRange = readStoredDateRange(activePatientId);
    const defaultRange = getDefaultDateRange();
    const nextDateFrom = storedRange?.dateFrom || defaultRange.dateFrom;
    const nextDateTo = storedRange?.dateTo || defaultRange.dateTo;
    const generatedDates = generateDateValues(nextDateFrom, nextDateTo);

    setDateFrom(nextDateFrom);
    setDateTo(nextDateTo);
    setDates(generatedDates);
    setChecklist(createEmptyChecklist(generatedDates.length));
    loadChecklistForDates(generatedDates);
  }, [loadChecklistForDates, activePatientId]);

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    saveStoredDateRange(value, dateTo, activePatientId);
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    saveStoredDateRange(dateFrom, value, activePatientId);
  };

  const generateDates = async () => {
    setMessage('');
    setError('');

    if (!dateFrom || !dateTo) {
      setError('Please select both Date From and Date To.');
      return;
    }

    const start = parseDateInput(dateFrom);
    const end = parseDateInput(dateTo);

    if (end < start) {
      setError('Date To cannot be earlier than Date From.');
      return;
    }

    const generatedDates = generateDateValues(dateFrom, dateTo);

    saveStoredDateRange(dateFrom, dateTo, activePatientId);
    setDates(generatedDates);
    setChecklist(createEmptyChecklist(generatedDates.length));
    await loadChecklistForDates(generatedDates, { showMessage: true });
  };

  const updateChecklist = (activity, dayIndex, value) => {
    setChecklist((prev) => {
      const currentStatuses = prev[activity] || Array(dates.length).fill('');

      return {
        ...prev,
        [activity]: currentStatuses.map((status, index) =>
          index === dayIndex ? value : status
        ),
      };
    });
  };

  const clearCurrentView = () => {
    setChecklist(createEmptyChecklist(dates.length));
    setMessage('Current view cleared. Click Save Checklist to remove saved values for this date range.');
    setError('');
  };

  const saveChecklist = async () => {
    setMessage('');
    setError('');

    if (!dateFrom || !dateTo || dates.length === 0) {
      setError('Please generate a checklist period before saving.');
      return;
    }

    const expectedDates = generateDateValues(dateFrom, dateTo);
    const isVisibleRangeCurrent = expectedDates.join('|') === dates.join('|');

    if (!isVisibleRangeCurrent) {
      setError('Please click Generate / Load Dates after changing the date range before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const tasks = [];

      ACTIVITIES.forEach((activity) => {
        const statuses = checklist[activity] || [];

        dates.forEach((date, index) => {
          const status = statuses[index] || '';
          const documentId = getChecklistDocumentId(date, activity);

          if (status) {
            tasks.push(
              savePatientDocument(
                COLLECTION_NAME,
                documentId,
                {
                  id: documentId,
                  date,
                  activity,
                  activityKey: getActivityKey(activity),
                  status,
                },
                { patientId: activePatientId }
              )
            );
          } else {
            tasks.push(
              deletePatientDocument(COLLECTION_NAME, documentId, {
                patientId: activePatientId,
              })
            );
          }
        });
      });

      await Promise.all(tasks);

      setMessage(
        `Checklist saved. ${selectedEntries.length} selected item${
          selectedEntries.length === 1 ? '' : 's'
        } stored. Empty cells were not saved.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err?.message
          ? `Failed to save checklist: ${err.message}`
          : 'Failed to save checklist.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      title="Daily Checklist"
      subtitle="Track daily nursing responsibilities and completion status."
    >
      <PageIntro
        title="Daily Checklist"
        description="Track daily nursing responsibilities by date. Saved values are loaded by date, not by checklist history."
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
            Select any date range. Existing saved activity statuses inside that range will load automatically.
          </p>

          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <button
              type="button"
              onClick={generateDates}
              disabled={isLoading || isSaving}
              className="h-[50px] rounded-xl bg-cyan-600 text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Loading...' : 'Generate / Load Dates'}
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Nursing Activities</h2>
              <p className="mt-1 text-sm text-slate-500">
                Each selected cell is saved as one record by date and activity. Empty cells are ignored.
              </p>
            </div>

            <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              {selectedEntries.length} selected
            </div>
          </div>

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

                  {dates.map((date, dayIndex) => {
                    const status = checklist[activity]?.[dayIndex] || '';

                    return (
                      <td key={`${activity}-${date}`} className="px-4 py-4 text-center">
                        <select
                          value={status}
                          onChange={(e) =>
                            updateChecklist(activity, dayIndex, e.target.value)
                          }
                          className={`rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 ${
                            status ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          <option value=""></option>

                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {dates.length > 0 && (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
              Showing {formatDisplayDate(dates[0])} to {formatDisplayDate(dates[dates.length - 1])}.
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 xl:left-72 xl:right-0">
        <div className="action-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={clearCurrentView}
              disabled={isLoading || isSaving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear Current View
            </button>

            <button
              type="button"
              onClick={() => loadChecklistForDates(dates, { showMessage: true })}
              disabled={isLoading || isSaving || dates.length === 0}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Loading...' : 'Reload Saved'}
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

// 'use client';

// import { useCallback, useEffect, useMemo, useState } from 'react';
// import AppShell from '@/components/AppShell';
// import PageIntro from '@/components/PageIntro';
// import {
//   deletePatientDocument,
//   getLocalDate,
//   loadPatientRows,
//   savePatientDocument,
// } from '@/lib/patientFirestore';
// import { usePatient } from '@/components/PatientProvider';

// const COLLECTION_NAME = 'dailyChecklists';

// const ACTIVITIES = [
//   'Vital Signs',
//   'Intake & Output',
//   'Medication Record',
//   'Nursing Care Plan',
//   'Monitoring',
//   'Fall Assessment',
//   'Skin Assessment',
//   'Health Teaching',
//   'Laboratory Results Checking',
//   'Health Assessment',
// ];

// const STATUS_OPTIONS = ['Done', 'N/A', 'Discharged'];

// function parseDateInput(value) {
//   const [year, month, day] = String(value).split('-').map(Number);
//   return new Date(year, month - 1, day);
// }

// function formatDateInput(date) {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');

//   return `${year}-${month}-${day}`;
// }

// function addDays(dateString, days) {
//   const value = parseDateInput(dateString);
//   value.setDate(value.getDate() + days);
//   return formatDateInput(value);
// }

// function generateDateValues(from, to) {
//   if (!from || !to) return [];

//   const start = parseDateInput(from);
//   const end = parseDateInput(to);

//   if (end < start) return [];

//   const generated = [];
//   const current = new Date(start);

//   while (current <= end) {
//     generated.push(formatDateInput(current));
//     current.setDate(current.getDate() + 1);
//   }

//   return generated;
// }

// function createEmptyChecklist(dateCount) {
//   const initialChecklist = {};

//   ACTIVITIES.forEach((activity) => {
//     initialChecklist[activity] = Array(dateCount).fill('');
//   });

//   return initialChecklist;
// }

// function getActivityKey(activity) {
//   return activity
//     .toLowerCase()
//     .replace(/&/g, 'and')
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/(^-|-$)/g, '');
// }

// function getChecklistDocumentId(date, activity) {
//   return `${date}_${getActivityKey(activity)}`;
// }

// function buildEntriesFromChecklist(checklist, dates) {
//   const entries = [];

//   ACTIVITIES.forEach((activity) => {
//     const statuses = checklist[activity] || [];

//     dates.forEach((date, index) => {
//       const status = statuses[index];

//       if (!status) return;

//       entries.push({
//         id: getChecklistDocumentId(date, activity),
//         date,
//         activity,
//         activityKey: getActivityKey(activity),
//         status,
//       });
//     });
//   });

//   return entries;
// }

// function createChecklistFromRows(rows, dates) {
//   const checklist = createEmptyChecklist(dates.length);
//   const dateIndexByDate = new Map(dates.map((date, index) => [date, index]));

//   rows.forEach((row) => {
//     const dateIndex = dateIndexByDate.get(row.date);

//     if (dateIndex === undefined) return;
//     if (!ACTIVITIES.includes(row.activity)) return;
//     if (!STATUS_OPTIONS.includes(row.status)) return;

//     checklist[row.activity][dateIndex] = row.status;
//   });

//   return checklist;
// }

// function formatDisplayDate(date) {
//   return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
//     weekday: 'short',
//     month: 'short',
//     day: 'numeric',
//   });
// }

// export default function DailyChecklistPage() {
//   const { activePatientId } = usePatient();
//   const [dateFrom, setDateFrom] = useState('');
//   const [dateTo, setDateTo] = useState('');
//   const [dates, setDates] = useState([]);
//   const [checklist, setChecklist] = useState({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const selectedEntries = useMemo(
//     () => buildEntriesFromChecklist(checklist, dates),
//     [checklist, dates]
//   );

//   const loadChecklistForDates = useCallback(async (dateValues, options = {}) => {
//     const { showMessage = false } = options;

//     setError('');

//     if (!Array.isArray(dateValues) || dateValues.length === 0) {
//       setChecklist({});
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const dateSet = new Set(dateValues);
//       const rows = await loadPatientRows(COLLECTION_NAME, {
//         sortBy: 'date',
//         sortDirection: 'asc',
//       });

//       const matchingRows = rows.filter((row) => {
//         return row.date && dateSet.has(row.date);
//       });

//       setChecklist(createChecklistFromRows(matchingRows, dateValues));

//       if (showMessage) {
//         setMessage(
//           matchingRows.length > 0
//             ? 'Saved checklist data loaded for the selected date range.'
//             : 'No saved checklist data found for the selected date range.'
//         );
//       }
//     } catch (err) {
//       console.error(err);
//       setError(
//         err?.message
//           ? `Failed to load checklist: ${err.message}`
//           : 'Failed to load checklist.'
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const today = getLocalDate();
//     const next4 = addDays(today, 4);
//     const generatedDates = generateDateValues(today, next4);

//     setDateFrom(today);
//     setDateTo(next4);
//     setDates(generatedDates);
//     setChecklist(createEmptyChecklist(generatedDates.length));
//     loadChecklistForDates(generatedDates);
//   }, [loadChecklistForDates, activePatientId]);

//   const generateDates = async () => {
//     setMessage('');
//     setError('');

//     if (!dateFrom || !dateTo) {
//       setError('Please select both Date From and Date To.');
//       return;
//     }

//     const start = parseDateInput(dateFrom);
//     const end = parseDateInput(dateTo);

//     if (end < start) {
//       setError('Date To cannot be earlier than Date From.');
//       return;
//     }

//     const generatedDates = generateDateValues(dateFrom, dateTo);

//     setDates(generatedDates);
//     setChecklist(createEmptyChecklist(generatedDates.length));
//     await loadChecklistForDates(generatedDates, { showMessage: true });
//   };

//   const updateChecklist = (activity, dayIndex, value) => {
//     setChecklist((prev) => {
//       const currentStatuses = prev[activity] || Array(dates.length).fill('');

//       return {
//         ...prev,
//         [activity]: currentStatuses.map((status, index) =>
//           index === dayIndex ? value : status
//         ),
//       };
//     });
//   };

//   const clearCurrentView = () => {
//     setChecklist(createEmptyChecklist(dates.length));
//     setMessage('Current view cleared. Click Save Checklist to remove saved values for this date range.');
//     setError('');
//   };

//   const saveChecklist = async () => {
//     setMessage('');
//     setError('');

//     if (!dateFrom || !dateTo || dates.length === 0) {
//       setError('Please generate a checklist period before saving.');
//       return;
//     }

//     const expectedDates = generateDateValues(dateFrom, dateTo);
//     const isVisibleRangeCurrent = expectedDates.join('|') === dates.join('|');

//     if (!isVisibleRangeCurrent) {
//       setError('Please click Generate / Load Dates after changing the date range before saving.');
//       return;
//     }

//     setIsSaving(true);

//     try {
//       const tasks = [];

//       ACTIVITIES.forEach((activity) => {
//         const statuses = checklist[activity] || [];

//         dates.forEach((date, index) => {
//           const status = statuses[index] || '';
//           const documentId = getChecklistDocumentId(date, activity);

//           if (status) {
//             tasks.push(
//               savePatientDocument(COLLECTION_NAME, documentId, {
//                 id: documentId,
//                 date,
//                 activity,
//                 activityKey: getActivityKey(activity),
//                 status,
//               })
//             );
//           } else {
//             tasks.push(deletePatientDocument(COLLECTION_NAME, documentId));
//           }
//         });
//       });

//       await Promise.all(tasks);

//       setMessage(
//         `Checklist saved. ${selectedEntries.length} selected item${
//           selectedEntries.length === 1 ? '' : 's'
//         } stored. Empty cells were not saved.`
//       );
//     } catch (err) {
//       console.error(err);
//       setError(
//         err?.message
//           ? `Failed to save checklist: ${err.message}`
//           : 'Failed to save checklist.'
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <AppShell
//       title="Daily Checklist"
//       subtitle="Track daily nursing responsibilities and completion status."
//     >
//       <PageIntro
//         title="Daily Checklist"
//         description="Track daily nursing responsibilities by date. Saved values are loaded by date, not by checklist history."
//       />

//       <div className="space-y-6 pb-36">
//         {(message || error) && (
//           <div
//             className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
//               error
//                 ? 'border-red-200 bg-red-50 text-red-700'
//                 : 'border-emerald-200 bg-emerald-50 text-emerald-700'
//             }`}
//           >
//             {error || message}
//           </div>
//         )}

//         <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//           <h2 className="mb-2 text-xl font-semibold">Configure Checklist Period</h2>
//           <p className="mb-6 text-sm text-slate-500">
//             Select any date range. Existing saved activity statuses inside that range will load automatically.
//           </p>

//           <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
//             <div>
//               <label className="mb-2 block text-sm font-medium">Date From</label>
//               <input
//                 type="date"
//                 value={dateFrom}
//                 onChange={(e) => setDateFrom(e.target.value)}
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
//               />
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-medium">Date To</label>
//               <input
//                 type="date"
//                 value={dateTo}
//                 onChange={(e) => setDateTo(e.target.value)}
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
//               />
//             </div>

//             <button
//               type="button"
//               onClick={generateDates}
//               disabled={isLoading || isSaving}
//               className="h-[50px] rounded-xl bg-cyan-600 text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isLoading ? 'Loading...' : 'Generate / Load Dates'}
//             </button>
//           </div>
//         </div>

//         <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//           <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
//             <div>
//               <h2 className="text-xl font-semibold">Nursing Activities</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Each selected cell is saved as one record by date and activity. Empty cells are ignored.
//               </p>
//             </div>

//             <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
//               {selectedEntries.length} selected
//             </div>
//           </div>

//           <table className="w-full min-w-[900px] border-collapse">
//             <thead>
//               <tr className="border-b border-slate-200">
//                 <th className="px-4 py-3 text-left">Activity</th>

//                 {dates.map((date) => (
//                   <th key={date} className="px-4 py-3 text-center">
//                     <div className="flex flex-col items-center">
//                       <span className="text-xs text-slate-500">
//                         {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
//                           weekday: 'short',
//                         })}
//                       </span>

//                       <span>
//                         {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
//                           month: 'short',
//                           day: 'numeric',
//                         })}
//                       </span>
//                     </div>
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody>
//               {ACTIVITIES.map((activity) => (
//                 <tr key={activity} className="border-b border-slate-100">
//                   <td className="px-4 py-4 font-medium">{activity}</td>

//                   {dates.map((date, dayIndex) => {
//                     const status = checklist[activity]?.[dayIndex] || '';

//                     return (
//                       <td key={`${activity}-${date}`} className="px-4 py-4 text-center">
//                         <select
//                           value={status}
//                           onChange={(e) =>
//                             updateChecklist(activity, dayIndex, e.target.value)
//                           }
//                           className={`rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 ${
//                             status ? 'text-slate-900' : 'text-slate-400'
//                           }`}
//                         >
//                           <option value=""></option>

//                           {STATUS_OPTIONS.map((option) => (
//                             <option key={option} value={option}>
//                               {option}
//                             </option>
//                           ))}
//                         </select>
//                       </td>
//                     );
//                   })}
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {dates.length > 0 && (
//             <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
//               Showing {formatDisplayDate(dates[0])} to {formatDisplayDate(dates[dates.length - 1])}.
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="fixed bottom-6 left-4 right-4 z-50 xl:left-72 xl:right-0">
//         <div className="action-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
//           <div className="flex flex-wrap justify-end gap-3">
//             <button
//               type="button"
//               onClick={clearCurrentView}
//               disabled={isLoading || isSaving}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               Clear Current View
//             </button>

//             <button
//               type="button"
//               onClick={() => loadChecklistForDates(dates, { showMessage: true })}
//               disabled={isLoading || isSaving || dates.length === 0}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isLoading ? 'Loading...' : 'Reload Saved'}
//             </button>

//             <button
//               type="button"
//               onClick={saveChecklist}
//               disabled={isLoading || isSaving}
//               className="rounded-xl bg-cyan-600 px-5 py-3 text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isSaving ? 'Saving...' : 'Save Checklist'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </AppShell>
//   );
// }
