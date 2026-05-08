'use client';

import { useMemo, useState } from 'react';
import SavedRecordsPanel from './SavedRecordsPanel';
import {
  addPatientRecord,
  getLocalDate,
  getLocalDateTime,
} from '@/lib/patientFirestore';

export default function RecordForm({
  fields = [],
  collectionName = 'records',
  showSavedRecords = true,
  savedRecordsTitle = 'Saved Records',
  savedRecordsDescription = 'Previously saved entries for this patient.',
  savedRecordsSortBy = 'createdAt',
  savedRecordsSortDirection = 'desc',
}) {
  const initialState = useMemo(() => {
    const obj = {};

    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        obj[field.name] = field.defaultValue;
      } else if (field.type === 'checkbox') {
        obj[field.name] = false;
      } else if (field.type === 'range') {
        obj[field.name] = field.min ?? 0;
      } else if (field.type === 'date') {
        obj[field.name] = getLocalDate();
      } else if (field.type === 'datetime-local') {
        obj[field.name] = getLocalDateTime();
      } else {
        obj[field.name] = '';
      }
    });

    return obj;
  }, [fields]);

  const [formData, setFormData] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const groupedFields = useMemo(() => {
    return fields.reduce((acc, field) => {
      const section = field.section || 'General';

      if (!acc[section]) {
        acc[section] = [];
      }

      acc[section].push(field);

      return acc;
    }, {});
  }, [fields]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await addPatientRecord(collectionName, formData);
      setMessage('Record saved successfully.');
      setFormData(initialState);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setError('Failed to save record. Please check your Firestore connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormData(initialState);
    setMessage('');
    setError('');
  };

  return (
    <>
      <div className="form-shell space-y-6 pb-36">
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

        {Object.entries(groupedFields).map(([section, sectionFields]) => (
          <div
            key={section}
            className="section-card p-5 lg:p-6"
          >
            <h2 className="mb-5 text-lg font-semibold text-slate-900 lg:text-xl">{section}</h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              {sectionFields.map((field) => (
                <div
                  key={field.name}
                  className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  {field.type !== 'checkbox' && field.type !== 'range' && (
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                  )}

                  {field.type === 'range' ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700">
                          {field.label}{' '}
                          <span className="font-semibold text-cyan-600">
                            {formData[field.name] ?? field.min ?? 0}
                          </span>
                          {field.required && <span className="ml-1 text-red-500">*</span>}
                        </label>
                      </div>

                      <input
                        type="range"
                        min={field.min ?? 0}
                        max={field.max ?? 10}
                        step={field.step ?? 1}
                        value={formData[field.name] ?? field.min ?? 0}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full accent-cyan-600"
                      />

                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>0 No pain</span>
                        <span>5 Moderate</span>
                        <span>10 Worst</span>
                      </div>
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <label className="mt-3 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={(e) => handleChange(field.name, e.target.checked)}
                        className="h-5 w-5 accent-cyan-600"
                      />

                      <span className="text-sm text-slate-700">
                        {field.checkboxLabel || field.label}
                      </span>
                    </label>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required || false}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required || false}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">{field.placeholder || 'Select option'}</option>

                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required || false}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {showSavedRecords && (
          <SavedRecordsPanel
            collectionName={collectionName}
            title={savedRecordsTitle}
            description={savedRecordsDescription}
            sortBy={savedRecordsSortBy}
            sortDirection={savedRecordsSortDirection}
            refreshKey={refreshKey}
          />
        )}
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 lg:left-72 lg:right-0">
        <div className="action-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Record'}
          </button>
          </div>
        </div>
      </div>
    </>
  );
}
