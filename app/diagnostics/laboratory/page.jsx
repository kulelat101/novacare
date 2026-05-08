'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import SavedRecordsPanel from '@/components/SavedRecordsPanel';
import {
  addPatientRecord,
  getLocalDateTime,
} from '@/lib/patientFirestore';

const LAB_PANELS = [
  {
    id: 'completeBloodCount',
    order: 'Complete Blood Count',
    category: 'HEMATOLOGY',
    title: 'Complete Blood Count',
    sampleType: 'Whole Blood',
    description:
      'Enter CBC values including RBC, WBC, hemoglobin, hematocrit, differential count, red cell indices, and platelet.',
    sampleMeta: {
      sampleType: 'Whole Blood',
      sampleCollected: '2026-03-02T13:45',
      sampleReceived: '2026-03-02T14:25',
      reportDate: '2026-03-02T18:44',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'rbc', label: 'RBC', result: '4.5', unit: '× 10⁶ / uL', reference: '4.0–5.2 × 10⁶ / uL' },
      { key: 'wbc', label: 'WBC', result: '7,200', unit: '/ uL', reference: '4,000–11,000 / uL' },
      { key: 'hgb', label: 'Hgb', result: '12.8', unit: 'g/dL', reference: '12–16 g/dL' },
      { key: 'hct', label: 'Hct', result: '38', unit: '%', reference: '36–46%' },
      { key: 'neutrophils', label: 'Neutrophils', result: '60', unit: '%', reference: '40–70%' },
      { key: 'lymphocytes', label: 'Lymphocytes', result: '32', unit: '%', reference: '20–40%' },
      { key: 'monocytes', label: 'Monocytes', result: '5', unit: '%', reference: '2–8%' },
      { key: 'eosinophils', label: 'Eosinophils', result: '2', unit: '%', reference: '1–4%' },
      { key: 'basophils', label: 'Basophils', result: '1', unit: '%', reference: '0–1%' },
      { key: 'mcv', label: 'MCV', result: '88', unit: 'fL', reference: '80–100 fL' },
      { key: 'mch', label: 'MCH', result: '29', unit: 'pg', reference: '27–33 pg' },
      { key: 'mchc', label: 'MCHC', result: '33', unit: 'g/dL', reference: '32–36 g/dL' },
      { key: 'platelet', label: 'Platelet', result: '250,000', unit: '/ uL', reference: '150,000–400,000 / uL' },
    ],
  },
  {
    id: 'coagulationStudies',
    order: 'Coagulation Studies',
    category: 'COAGULATION STUDY',
    title: 'Coagulation Profile',
    sampleType: 'Whole Blood',
    description:
      'Enter coagulation values including PT, INR, aPTT, fibrinogen, bleeding time, and D-dimer.',
    sampleMeta: {
      sampleType: 'Whole Blood',
      sampleCollected: '2026-03-02T13:45',
      sampleReceived: '2026-03-02T14:25',
      reportDate: '2026-03-02T18:44',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'pt', label: 'Prothrombin Time (PT)', result: '12', unit: 'seconds', reference: '11–14 seconds' },
      { key: 'inr', label: 'INR', result: '1.0', unit: '', reference: '0.8–1.2' },
      { key: 'aptt', label: 'Activated Partial Thromboplastin Time (aPTT)', result: '30', unit: 'seconds', reference: '25–35 seconds' },
      { key: 'fibrinogen', label: 'Fibrinogen', result: '300', unit: 'mg/dL', reference: '200–400 mg/dL' },
      { key: 'bleedingTime', label: 'Bleeding Time', result: '3', unit: 'minutes', reference: '2–7 minutes' },
      { key: 'dDimer', label: 'D-Dimer', result: '0.3', unit: 'ug/mL', reference: '< 0.5 ug/mL' },
    ],
  },
  {
    id: 'bloodTyping',
    order: 'Blood Typing',
    category: 'HEMATOLOGY REPORT',
    title: 'Blood Group ABO & Rh Typing',
    sampleType: 'Whole Blood',
    description: 'Enter blood group and Rh factor results.',
    sampleMeta: {
      sampleType: 'Whole Blood',
      sampleCollected: '2026-03-02T13:45',
      sampleReceived: '2026-03-02T14:25',
      reportDate: '2026-03-02T18:44',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'bloodGroup', label: 'Blood Group', result: 'B', unit: '', reference: 'A / B / AB / O' },
      { key: 'rhFactor', label: 'Rh Factor', result: 'Positive', unit: '', reference: 'Positive / Negative' },
    ],
  },
];

const REPORT_STATUS_OPTIONS = [
  'Final Report',
  'Preliminary',
  'Pending',
  'Amended',
];

function createEmptyResults(panel) {
  return panel.tests.reduce((acc, test) => {
    acc[test.key] = '';
    return acc;
  }, {});
}

function createSampleResults(panel) {
  return panel.tests.reduce((acc, test) => {
    acc[test.key] = test.result || '';
    return acc;
  }, {});
}

function createDefaultMeta(panel) {
  return {
    sampleType: panel.sampleType || '',
    sampleCollected: getLocalDateTime(),
    sampleReceived: getLocalDateTime(),
    reportDate: getLocalDateTime(),
    reportStatus: 'Final Report',
  };
}

function formatDate(value) {
  if (!value) return '—';
  return String(value).replace('T', ' ');
}

export default function LaboratoryPage() {
  const [selectedPanelId, setSelectedPanelId] = useState('completeBloodCount');

  const selectedPanel = useMemo(
    () =>
      LAB_PANELS.find((panel) => panel.id === selectedPanelId) ||
      LAB_PANELS[0],
    [selectedPanelId]
  );

  const [meta, setMeta] = useState(() => createDefaultMeta(LAB_PANELS[0]));
  const [results, setResults] = useState(() => createEmptyResults(LAB_PANELS[0]));
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  function handlePanelChange(panelId) {
    const nextPanel =
      LAB_PANELS.find((panel) => panel.id === panelId) || LAB_PANELS[0];

    setSelectedPanelId(panelId);
    setMeta(createDefaultMeta(nextPanel));
    setResults(createEmptyResults(nextPanel));
    setRemarks('');
    setMessage('');
    setError('');
  }

  function updateMeta(field, value) {
    setMeta((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateResult(key, value) {
    setResults((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function clearForm() {
    setMeta(createDefaultMeta(selectedPanel));
    setResults(createEmptyResults(selectedPanel));
    setRemarks('');
    setMessage('');
    setError('');
  }

  function loadSampleValues() {
    setMeta(selectedPanel.sampleMeta || createDefaultMeta(selectedPanel));
    setResults(createSampleResults(selectedPanel));
    setRemarks('');
    setMessage(`${selectedPanel.order} sample values loaded.`);
    setError('');
  }

  async function saveLaboratoryResult() {
    setIsSaving(true);
    setMessage('');
    setError('');

    const hasAtLeastOneResult = Object.values(results).some(
      (value) => String(value || '').trim() !== ''
    );

    if (!hasAtLeastOneResult) {
      setError('Please enter at least one laboratory result before saving.');
      setIsSaving(false);
      return;
    }

    try {
      const resultRows = selectedPanel.tests.map((test) => ({
        key: test.key,
        test: test.label,
        result: results[test.key] || '',
        unit: test.unit || '',
        reference: test.reference || '',
      }));

      await addPatientRecord('laboratoryResults', {
        order: selectedPanel.order,
        category: selectedPanel.category,
        title: selectedPanel.title,
        description: selectedPanel.description,
        sampleType: meta.sampleType,
        sampleCollected: meta.sampleCollected,
        sampleReceived: meta.sampleReceived,
        reportDate: meta.reportDate,
        reportStatus: meta.reportStatus,
        remarks,
        results: resultRows,
      });

      setMessage(`${selectedPanel.order} saved to Firestore.`);
      setRefreshKey((prev) => prev + 1);
      clearForm();
    } catch (err) {
      console.error(err);
      setError('Failed to save laboratory result. Please check your Firestore connection.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Laboratory" subtitle="Diagnostic results">
      <div className="space-y-6 pb-36">
        <PageIntro
          title="Laboratory Result Entry"
          description="Select a laboratory order, then enter the corresponding patient result values."
        />

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

        <section className="section-card p-5 lg:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className="label">Laboratory Order</label>
              <select
                value={selectedPanelId}
                onChange={(event) => handlePanelChange(event.target.value)}
                className="input"
              >
                {LAB_PANELS.map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.order}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Report Status</label>
              <select
                value={meta.reportStatus}
                onChange={(event) => updateMeta('reportStatus', event.target.value)}
                className="input"
              >
                {REPORT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Sample Type</label>
              <input
                type="text"
                value={meta.sampleType}
                onChange={(event) => updateMeta('sampleType', event.target.value)}
                placeholder="e.g., Whole Blood"
                className="input"
              />
            </div>

            <div>
              <label className="label">Sample Collected</label>
              <input
                type="datetime-local"
                value={meta.sampleCollected}
                onChange={(event) => updateMeta('sampleCollected', event.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Sample Received</label>
              <input
                type="datetime-local"
                value={meta.sampleReceived}
                onChange={(event) => updateMeta('sampleReceived', event.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Report Date</label>
              <input
                type="datetime-local"
                value={meta.reportDate}
                onChange={(event) => updateMeta('reportDate', event.target.value)}
                className="input"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={loadSampleValues}
                disabled={isSaving}
                className="w-full rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Load Reference Sample
              </button>
            </div>
          </div>
        </section>

        <section className="section-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 text-center">
            <p className="section-kicker">{selectedPanel.category}</p>
            <h2 className="mt-2 text-xl font-bold tracking-[0.18em] text-slate-900">
              {selectedPanel.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {selectedPanel.description}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="w-[28%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Test
                  </th>
                  <th className="w-[26%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Result
                  </th>
                  <th className="w-[18%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Unit
                  </th>
                  <th className="w-[28%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Reference
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {selectedPanel.tests.map((test) => (
                  <tr key={test.key} className="bg-white hover:bg-cyan-50/40">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">
                        {test.label}
                      </p>
                    </td>

                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={results[test.key] || ''}
                        onChange={(event) => updateResult(test.key, event.target.value)}
                        placeholder="Enter result"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </td>

                    <td className="px-5 py-3 text-sm font-medium text-slate-600">
                      {test.unit || '—'}
                    </td>

                    <td className="px-5 py-3 text-sm text-slate-500">
                      {test.reference || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card p-5 lg:p-6">
          <label className="label">Remarks / Interpretation</label>
          <textarea
            rows={4}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Optional notes, interpretation, or remarks..."
            className="input"
          />

          <p className="mt-2 text-xs text-slate-500">
            Reference ranges are shown for demo guidance and may vary by hospital,
            patient age, sex, and laboratory standard.
          </p>
        </section>

        <SavedRecordsPanel
          collectionName="laboratoryResults"
          title="Saved Laboratory Reports"
          description="View CBC, coagulation, blood typing, and other saved laboratory reports for this patient."
          sortBy="reportDate"
          sortDirection="desc"
          refreshKey={refreshKey}
          getTitle={(record) => record.order || record.panelName || record.title || 'Laboratory Report'}
          getSubtitle={(record) => `${formatDate(record.reportDate)} • ${record.reportStatus || 'No status'}`}
          getBadge={(record) => record.category || 'Lab'}
        />
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 lg:left-72 lg:right-0">
        <div className="action-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={clearForm}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={saveLaboratoryResult}
              disabled={isSaving}
              className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Laboratory Result'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
