'use client';

import { useMemo, useState } from 'react';
import SavedRecordsPanel from './SavedRecordsPanel';
import {
  addPatientRecord,
  getLocalDate,
  getLocalDateTime,
  savePatientDocument,
} from '@/lib/patientFirestore';

function flattenAssessmentRows(rows = []) {
  return rows.flatMap((row) => [
    row,
    ...flattenAssessmentRows(row.children || []),
  ]);
}

function buildAssessmentTableState(rows = []) {
  return flattenAssessmentRows(rows).reduce((acc, row) => {
    const options = (row.extraCheckboxes || []).reduce((optionAcc, option) => {
      optionAcc[option.key] = false;
      return optionAcc;
    }, {});

    const optionNotes = (row.extraCheckboxes || []).reduce((noteAcc, option) => {
      if (option.hasText) {
        noteAcc[option.key] = '';
      }

      return noteAcc;
    }, {});

    const selects = (row.extraSelects || []).reduce((selectAcc, select) => {
      selectAcc[select.key] = '';
      return selectAcc;
    }, {});

    acc[row.key] = {
      checked: false,
      note: '',
      options,
      optionNotes,
      selects,
    };

    return acc;
  }, {});
}

function normalizeAssessmentTableState(field, value) {
  const base = buildAssessmentTableState(field.rows || []);

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return base;
  }

  return Object.entries(base).reduce((acc, [rowKey, rowValue]) => {
    const existingValue = value[rowKey];

    if (!existingValue || typeof existingValue !== 'object' || Array.isArray(existingValue)) {
      acc[rowKey] = rowValue;
      return acc;
    }

    acc[rowKey] = {
      ...rowValue,
      ...existingValue,
      options: {
        ...(rowValue.options || {}),
        ...(existingValue.options || {}),
      },
      optionNotes: {
        ...(rowValue.optionNotes || {}),
        ...(existingValue.optionNotes || {}),
      },
      selects: {
        ...(rowValue.selects || {}),
        ...(existingValue.selects || {}),
      },
    };

    return acc;
  }, {});
}

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
      if (field.type === 'checkbox') {
        obj[field.name] = false;
      } else if (field.defaultValue !== undefined) {
        obj[field.name] = field.defaultValue;
      } else if (field.type === 'checkbox-group') {
        obj[field.name] = [];
      } else if (field.type === 'assessment-table') {
        obj[field.name] = buildAssessmentTableState(field.rows || []);
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
  const [editingRecord, setEditingRecord] = useState(null);

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

  const normalizeCheckboxGroupValue = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).toUpperCase());
    }

    if (typeof value === 'string') {
      if (value.toLowerCase() === 'oriented x4') {
        return ['PERSON', 'PLACE', 'TIME', 'SITUATION'];
      }

      return value
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
    }

    return [];
  };

  const handleCheckboxGroupChange = (name, option, checked) => {
    setFormData((prev) => {
      const selected = normalizeCheckboxGroupValue(prev[name]);
      const normalizedOption = String(option).toUpperCase();

      return {
        ...prev,
        [name]: checked
          ? Array.from(new Set([...selected, normalizedOption]))
          : selected.filter((item) => item !== normalizedOption),
      };
    });
  };

  const handleAssessmentRowChange = (field, rowKey, updates) => {
    setFormData((prev) => {
      const tableValue = normalizeAssessmentTableState(field, prev[field.name]);

      return {
        ...prev,
        [field.name]: {
          ...tableValue,
          [rowKey]: {
            ...tableValue[rowKey],
            ...updates,
          },
        },
      };
    });
  };

  const handleAssessmentOptionChange = (field, rowKey, optionKey, checked) => {
    setFormData((prev) => {
      const tableValue = normalizeAssessmentTableState(field, prev[field.name]);
      const rowValue = tableValue[rowKey] || { checked: false, note: '', options: {}, optionNotes: {}, selects: {} };

      return {
        ...prev,
        [field.name]: {
          ...tableValue,
          [rowKey]: {
            ...rowValue,
            options: {
              ...(rowValue.options || {}),
              [optionKey]: checked,
            },
          },
        },
      };
    });
  };

  const handleAssessmentOptionNoteChange = (field, rowKey, optionKey, note) => {
    setFormData((prev) => {
      const tableValue = normalizeAssessmentTableState(field, prev[field.name]);
      const rowValue = tableValue[rowKey] || { checked: false, note: '', options: {}, optionNotes: {}, selects: {} };

      return {
        ...prev,
        [field.name]: {
          ...tableValue,
          [rowKey]: {
            ...rowValue,
            optionNotes: {
              ...(rowValue.optionNotes || {}),
              [optionKey]: note,
            },
          },
        },
      };
    });
  };

  const handleAssessmentSelectChange = (field, rowKey, selectKey, value) => {
    setFormData((prev) => {
      const tableValue = normalizeAssessmentTableState(field, prev[field.name]);
      const rowValue = tableValue[rowKey] || { checked: false, note: '', options: {}, optionNotes: {}, selects: {} };

      return {
        ...prev,
        [field.name]: {
          ...tableValue,
          [rowKey]: {
            ...rowValue,
            selects: {
              ...(rowValue.selects || {}),
              [selectKey]: value,
            },
          },
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      if (editingRecord?.id) {
        await savePatientDocument(collectionName, editingRecord.id, formData, {
          patientId: editingRecord.__patientDocumentId,
        });
        setMessage('Saved record updated successfully.');
      } else {
        await addPatientRecord(collectionName, formData);
        setMessage('Record saved successfully.');
      }

      setFormData(initialState);
      setEditingRecord(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setError(
        editingRecord?.id
          ? 'Failed to update record. Please check your Firestore connection.'
          : 'Failed to save record. Please check your Firestore connection.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormData(initialState);
    setEditingRecord(null);
    setMessage('');
    setError('');
  };

  const handleLoadSavedRecord = (record) => {
    const loadedData = {};

    fields.forEach((field) => {
      if (record[field.name] !== undefined && record[field.name] !== null) {
        loadedData[field.name] = field.type === 'assessment-table'
          ? normalizeAssessmentTableState(field, record[field.name])
          : record[field.name];
      } else {
        loadedData[field.name] = initialState[field.name];
      }
    });

    setFormData(loadedData);
    setEditingRecord({
      id: record.id || record.docId || record.documentId,
      __patientDocumentId: record.__patientDocumentId || record.patientDocId || record.patientDocumentId || '',
    });
    setMessage('Saved record loaded. Changes will update the selected record instead of creating a new one.');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const renderAssessmentRow = (field, row, tableValue, depth = 0) => {
    const rowValue = tableValue[row.key] || {
      checked: false,
      note: '',
      options: {},
      optionNotes: {},
      selects: {},
    };
    const hasNote = row.hasNote !== false;
    const hasExtraCheckboxes = Array.isArray(row.extraCheckboxes) && row.extraCheckboxes.length > 0;
    const hasExtraSelects = Array.isArray(row.extraSelects) && row.extraSelects.length > 0;
    const hasControls = hasNote || hasExtraCheckboxes || hasExtraSelects;
    const isNested = depth > 0;

    return (
      <div key={row.key}>
        <div
          className={`grid gap-3 px-4 py-3 sm:grid-cols-[minmax(180px,0.75fr)_minmax(220px,1.25fr)] sm:items-start ${
            isNested ? 'bg-slate-50/70' : ''
          }`}
        >
          <label className={`flex items-start gap-3 text-sm font-semibold uppercase tracking-wide text-slate-800 ${
            isNested ? 'pl-8' : ''
          }`}>
            {!row.hideCheckbox && (
              <input
                type="checkbox"
                checked={rowValue.checked || false}
                onChange={(e) => handleAssessmentRowChange(field, row.key, { checked: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-600"
              />
            )}
            {row.hideCheckbox && <span className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{row.label}</span>
          </label>

          {hasControls && (
            <div className="space-y-3">
              {hasNote && row.noteType === 'textarea' ? (
                <textarea
                  rows={row.rows || 3}
                  value={rowValue.note || ''}
                  onChange={(e) => handleAssessmentRowChange(field, row.key, { note: e.target.value })}
                  placeholder=""
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                />
              ) : hasNote && row.noteType === 'select' ? (
                <select
                  value={rowValue.note || ''}
                  onChange={(e) => handleAssessmentRowChange(field, row.key, { note: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value=""></option>
                  {(row.noteOptions || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : hasNote ? (
                <input
                  type="text"
                  value={rowValue.note || ''}
                  onChange={(e) => handleAssessmentRowChange(field, row.key, { note: e.target.value })}
                  placeholder=""
                  className="w-full border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-0"
                />
              ) : null}

              {hasExtraSelects && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {row.extraSelects.map((select) => (
                    <label key={select.key} className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <span>{select.label}</span>
                      <select
                        value={rowValue.selects?.[select.key] || ''}
                        onChange={(e) => handleAssessmentSelectChange(field, row.key, select.key, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value=""></option>
                        {(select.options || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}

              {hasExtraCheckboxes && (
                <div className="flex flex-wrap gap-3">
                  {row.extraCheckboxes.map((option) => {
                    const checked = rowValue.options?.[option.key] || false;

                    return (
                      <div
                        key={option.key}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700"
                      >
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleAssessmentOptionChange(field, row.key, option.key, e.target.checked)}
                            className="h-4 w-4 accent-cyan-600"
                          />
                          <span>{option.label}</span>
                        </label>

                        {option.hasText && (
                          <input
                            type="text"
                            value={rowValue.optionNotes?.[option.key] || ''}
                            onChange={(e) => handleAssessmentOptionNoteChange(field, row.key, option.key, e.target.value)}
                            placeholder=""
                            className="min-w-[180px] flex-1 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-0 disabled:opacity-50"
                            disabled={!checked}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {Array.isArray(row.children) && row.children.length > 0 && (
          <div className="divide-y divide-slate-200">
            {row.children.map((childRow) => renderAssessmentRow(field, childRow, tableValue, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderAssessmentTable = (field) => {
    const tableValue = normalizeAssessmentTableState(field, formData[field.name]);

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
        {field.label && (
          <div className="border-b border-slate-300 bg-green-100 px-4 py-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            {field.label}
          </div>
        )}

        <div className="divide-y divide-slate-200">
          {(field.rows || []).map((row) => renderAssessmentRow(field, row, tableValue))}
        </div>
      </div>
    );
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

        {editingRecord?.id && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            Editing a saved record. Press Update Record to save changes to the selected history item, or Clear to start a new entry.
          </div>
        )}

        {Object.entries(groupedFields).map(([section, sectionFields]) => {
          const isAssessmentOnly = sectionFields.every((field) => field.type === 'assessment-table');

          return (
            <div
              key={section}
              className="section-card p-5 lg:p-6"
            >
              <h2 className={isAssessmentOnly ? 'sr-only' : 'mb-5 text-lg font-semibold text-slate-900 lg:text-xl'}>
                {section}
              </h2>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {sectionFields.map((field) => {
                  const isWideField = field.fullWidth !== false && (
                    field.type === 'textarea' ||
                    field.type === 'checkbox-group' ||
                    field.type === 'assessment-table'
                  );

                  return (
                    <div
                      key={field.name}
                      className={isWideField ? 'md:col-span-2' : ''}
                    >
                      {field.type !== 'checkbox' && field.type !== 'checkbox-group' && field.type !== 'assessment-table' && field.type !== 'range' && (
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
                      ) : field.type === 'checkbox-group' ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="mb-3 text-sm font-medium text-slate-700">
                            {field.label}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {field.options?.map((option) => {
                              const selected = normalizeCheckboxGroupValue(formData[field.name]);
                              const normalizedOption = String(option).toUpperCase();

                              return (
                                <label
                                  key={option}
                                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(normalizedOption)}
                                    onChange={(e) => handleCheckboxGroupChange(field.name, option, e.target.checked)}
                                    className="h-5 w-5 accent-cyan-600"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.type === 'assessment-table' ? (
                        renderAssessmentTable(field)
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={4}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          placeholder=""
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
                          <option value=""></option>

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
                          placeholder=""
                          required={field.required || false}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {showSavedRecords && (
          <SavedRecordsPanel
            collectionName={collectionName}
            title={savedRecordsTitle}
            description={savedRecordsDescription}
            sortBy={savedRecordsSortBy}
            sortDirection={savedRecordsSortDirection}
            refreshKey={refreshKey}
            onRecordSelect={handleLoadSavedRecord}
          />
        )}
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 xl:left-72 xl:right-0">
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
              {isSaving ? 'Saving...' : editingRecord?.id ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
