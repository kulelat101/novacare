'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import SavedRecordsPanel from '@/components/SavedRecordsPanel';
import { useAuth } from '@/components/AuthProvider';
import { ROLES } from '@/lib/roles';
import { addPatientRecord } from '@/lib/patientFirestore';

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
      { key: 'rbc', section: 'Complete Blood Count', label: 'RBC', result: '4.5', unit: '× 10⁶ / uL', reference: '4.0–5.2 × 10⁶ / uL' },
      { key: 'wbc', section: 'Complete Blood Count', label: 'WBC', result: '7,200', unit: '/ uL', reference: '4,000–11,000 / uL' },
      { key: 'hgb', section: 'Complete Blood Count', label: 'Hgb', result: '12.8', unit: 'g/dL', reference: '12–16 g/dL' },
      { key: 'hct', section: 'Complete Blood Count', label: 'Hct', result: '38', unit: '%', reference: '36–46%' },
      { key: 'neutrophils', section: 'Differential Count', label: 'Neutrophils', result: '60', unit: '%', reference: '40–70%' },
      { key: 'lymphocytes', section: 'Differential Count', label: 'Lymphocytes', result: '32', unit: '%', reference: '20–40%' },
      { key: 'monocytes', section: 'Differential Count', label: 'Monocytes', result: '5', unit: '%', reference: '2–8%' },
      { key: 'eosinophils', section: 'Differential Count', label: 'Eosinophils', result: '2', unit: '%', reference: '1–4%' },
      { key: 'basophils', section: 'Differential Count', label: 'Basophils', result: '1', unit: '%', reference: '0–1%' },
      { key: 'mcv', section: 'Red Cell Indices', label: 'MCV', result: '88', unit: 'fL', reference: '80–100 fL' },
      { key: 'mch', section: 'Red Cell Indices', label: 'MCH', result: '29', unit: 'pg', reference: '27–33 pg' },
      { key: 'mchc', section: 'Red Cell Indices', label: 'MCHC', result: '33', unit: 'g/dL', reference: '32–36 g/dL' },
      { key: 'platelet', section: 'Platelet', label: 'Platelet', result: '250,000', unit: '/ uL', reference: '150,000–400,000 / uL' },
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
      { key: 'pt', section: 'Coagulation', label: 'Prothrombin Time (PT)', result: '12', unit: 'seconds', reference: '11–14 seconds' },
      { key: 'inr', section: 'Coagulation', label: 'INR', result: '1.0', unit: '', reference: '0.8–1.2' },
      { key: 'aptt', section: 'Coagulation', label: 'Activated Partial Thromboplastin Time (aPTT)', result: '30', unit: 'seconds', reference: '25–35 seconds' },
      { key: 'fibrinogen', section: 'Coagulation', label: 'Fibrinogen', result: '300', unit: 'mg/dL', reference: '200–400 mg/dL' },
      { key: 'bleedingTime', section: 'Coagulation', label: 'Bleeding Time', result: '3', unit: 'minutes', reference: '2–7 minutes' },
      { key: 'dDimer', section: 'Coagulation', label: 'D-Dimer', result: '0.3', unit: 'ug/mL', reference: '< 0.5 ug/mL' },
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
      { key: 'bloodGroup', section: 'Blood Typing', label: 'Blood Group', result: 'B', unit: '', reference: 'A / B / AB / O' },
      { key: 'rhFactor', section: 'Blood Typing', label: 'Rh Factor', result: 'Positive', unit: '', reference: 'Positive / Negative' },
    ],
  },
  {
    id: 'urinalysis',
    order: 'Urinalysis',
    category: 'URINALYSIS',
    title: 'Urinalysis',
    sampleType: 'Urine',
    description:
      'Enter urine color, appearance, chemistry, and screening findings.',
    sampleMeta: {
      sampleType: 'Urine',
      sampleCollected: '2026-03-02T07:30',
      sampleReceived: '2026-03-02T07:50',
      reportDate: '2026-03-02T09:00',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'urineColor', section: 'Macroscopic', label: 'Color', result: 'Yellow', unit: '', reference: '' },
      { key: 'urineAppearance', section: 'Macroscopic', label: 'Appearance', result: 'Clear', unit: '', reference: '' },
      { key: 'urinePh', section: 'Chemistry', label: 'pH', result: '6.0', unit: '', reference: '4.6–7.8' },
      { key: 'urineSpecificGravity', section: 'Chemistry', label: 'Specific Gravity', result: '1.020', unit: '', reference: '1.015–1.025' },
      { key: 'urineGlucose', section: 'Chemistry', label: 'Glucose', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'urineProtein', section: 'Chemistry', label: 'Protein', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'urineKetones', section: 'Chemistry', label: 'Ketones', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'urineNitrites', section: 'Chemistry', label: 'Nitrites', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'urineLeukocytes', section: 'Chemistry', label: 'Leukocytes', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'urineBlood', section: 'Chemistry', label: 'Blood', result: 'Negative', unit: '', reference: 'Negative' },
    ],
  },
  {
    id: 'fecalysis',
    order: 'Fecalysis',
    category: 'FECALYSIS',
    title: 'Fecalysis',
    sampleType: 'Stool',
    description:
      'Enter stool macroscopic and microscopic findings such as color, consistency, WBC, RBC, and bacteria.',
    sampleMeta: {
      sampleType: 'Stool',
      sampleCollected: '2026-03-02T08:00',
      sampleReceived: '2026-03-02T08:30',
      reportDate: '2026-03-02T10:00',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'fecalColor', section: 'Macroscopic', label: 'Color', result: 'Brown', unit: '', reference: '' },
      { key: 'fecalConsistency', section: 'Macroscopic', label: 'Consistency', result: 'Soft', unit: '', reference: '' },
      { key: 'fecalWbc', section: 'Microscopic', label: 'WBC', result: '0–2', unit: '/ HPF', reference: '' },
      { key: 'fecalRbc', section: 'Microscopic', label: 'RBC', result: '0–2', unit: '/ HPF', reference: '' },
      { key: 'fecalBacteria', section: 'Microscopic', label: 'Bacteria', result: 'Few', unit: '', reference: '' },
    ],
  },
  {
    id: 'chemistry',
    order: 'Chemistry',
    category: 'CHEMISTRY',
    title: 'Chemistry',
    sampleType: 'Blood Serum',
    description:
      'Enter electrolyte chemistry values including chloride, potassium, and sodium.',
    sampleMeta: {
      sampleType: 'Blood Serum',
      sampleCollected: '2026-03-02T09:00',
      sampleReceived: '2026-03-02T09:20',
      reportDate: '2026-03-02T11:00',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'chloride', section: 'Electrolytes', label: 'Chloride', result: '102', unit: 'mmol/L', reference: '98–107' },
      { key: 'potassium', section: 'Electrolytes', label: 'Potassium', result: '4.0', unit: 'mmol/L', reference: '3.5–5.1' },
      { key: 'sodium', section: 'Electrolytes', label: 'Sodium', result: '140', unit: 'mmol/L', reference: '136–145' },
    ],
  },
  {
    id: 'immunology',
    order: 'Immunology',
    category: 'IMMUNOLOGY',
    title: 'Immunology',
    sampleType: 'Blood Serum',
    description:
      'Enter immunology results such as dengue NS1 antigen, dengue IgM, and dengue IgG.',
    sampleMeta: {
      sampleType: 'Blood Serum',
      sampleCollected: '2026-03-02T09:00',
      sampleReceived: '2026-03-02T09:30',
      reportDate: '2026-03-02T12:00',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'dengueNs1Ag', section: 'Dengue Panel', label: 'Dengue NS1 Ag', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'dengueIgm', section: 'Dengue Panel', label: 'Dengue IgM', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'dengueIgg', section: 'Dengue Panel', label: 'Dengue IgG', result: 'Negative', unit: '', reference: 'Negative' },
    ],
  },
  {
    id: 'clinicalMicroscopy',
    order: 'Clinical Microscopy',
    category: 'CLINICAL MICROSCOPY',
    title: 'Clinical Microscopy',
    sampleType: 'Urine',
    description:
      'Enter clinical microscopy values including macroscopic, chemistry, and microscopic urine findings.',
    sampleMeta: {
      sampleType: 'Urine',
      sampleCollected: '2026-03-02T07:30',
      sampleReceived: '2026-03-02T07:50',
      reportDate: '2026-03-02T09:00',
      reportStatus: 'Final Report',
    },
    tests: [
      { key: 'cmColor', section: 'Macroscopic', label: 'Color', result: 'Yellow', unit: '', reference: '' },
      { key: 'cmClarity', section: 'Macroscopic', label: 'Clarity', result: 'Clear', unit: '', reference: '' },
      { key: 'cmLeukoEsterase', section: 'Chemistry', label: 'Leukocyte Esterase', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmNitrite', section: 'Chemistry', label: 'Nitrite', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmUrobilinogen', section: 'Chemistry', label: 'Urobilinogen', result: 'Normal', unit: '', reference: 'Normal' },
      { key: 'cmProtein', section: 'Chemistry', label: 'Protein', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmPh', section: 'Chemistry', label: 'pH', result: '6.0', unit: '', reference: '4.6–7.8' },
      { key: 'cmBlood', section: 'Chemistry', label: 'Blood', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmSpecificGravity', section: 'Chemistry', label: 'Specific Gravity', result: '1.020', unit: '', reference: '1.015–1.025' },
      { key: 'cmKetone', section: 'Chemistry', label: 'Ketone', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmBilirubin', section: 'Chemistry', label: 'Bilirubin', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmGlucose', section: 'Chemistry', label: 'Glucose', result: 'Negative', unit: '', reference: 'Negative' },
      { key: 'cmWbc', section: 'Microscopic', label: 'WBC', result: '0–5', unit: '/ uL', reference: '< 20' },
      { key: 'cmRbc', section: 'Microscopic', label: 'RBC', result: '0–2', unit: '/ uL', reference: '< 10' },
      { key: 'cmBacteria', section: 'Microscopic', label: 'Bacteria', result: 'None Seen', unit: '', reference: '' },
      { key: 'cmEpithelialCells', section: 'Microscopic', label: 'Epithelial Cells', result: 'Few', unit: '', reference: '' },
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


function createEmptyMeta() {
  return {
    sampleType: '',
    sampleCollected: '',
    sampleReceived: '',
    reportDate: '',
    reportStatus: '',
  };
}

function formatDate(value) {
  if (!value) return '—';
  return String(value).replace('T', ' ');
}

function getSectionClasses(section) {
  switch (section) {
    case 'Macroscopic':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'Microscopic':
      return 'bg-violet-50 text-violet-700 ring-violet-100';
    case 'Chemistry':
    case 'Electrolytes':
      return 'bg-cyan-50 text-cyan-700 ring-cyan-100';
    case 'Dengue Panel':
      return 'bg-amber-50 text-amber-700 ring-amber-100';
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-100';
  }
}

export default function LaboratoryPage() {
  const { profile } = useAuth();
  const isPatientView = profile?.role === ROLES.PATIENT;
  const [selectedPanelId, setSelectedPanelId] = useState('');

  const selectedPanel = useMemo(
    () => LAB_PANELS.find((panel) => panel.id === selectedPanelId) || null,
    [selectedPanelId]
  );

  const [meta, setMeta] = useState(() => createEmptyMeta());
  const [results, setResults] = useState({});
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  function handlePanelChange(panelId) {
    const nextPanel = LAB_PANELS.find((panel) => panel.id === panelId) || null;

    setSelectedPanelId(panelId);
    setMeta(createEmptyMeta());
    setResults(nextPanel ? createEmptyResults(nextPanel) : {});
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
    setSelectedPanelId('');
    setMeta(createEmptyMeta());
    setResults({});
    setRemarks('');
    setMessage('');
    setError('');
  }


  function loadSavedLaboratoryReport(record) {
    const matchingPanel =
      LAB_PANELS.find((panel) => panel.order === record.order) ||
      LAB_PANELS.find((panel) => panel.title === record.title) ||
      null;

    if (!matchingPanel) {
      setError('Unable to match the selected saved report to a laboratory order.');
      setMessage('');
      return;
    }

    const loadedResults = createEmptyResults(matchingPanel);

    if (Array.isArray(record.results)) {
      record.results.forEach((item) => {
        if (item?.key && Object.prototype.hasOwnProperty.call(loadedResults, item.key)) {
          loadedResults[item.key] = item.result || '';
        }
      });
    }

    setSelectedPanelId(matchingPanel.id);
    setMeta({
      sampleType: record.sampleType || '',
      sampleCollected: record.sampleCollected || '',
      sampleReceived: record.sampleReceived || '',
      reportDate: record.reportDate || '',
      reportStatus: record.reportStatus || '',
    });
    setResults(loadedResults);
    setRemarks(record.remarks || '');
    setMessage('Saved laboratory report loaded into the form.');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function saveLaboratoryResult() {
    setIsSaving(true);
    setMessage('');
    setError('');

    if (!selectedPanel) {
      setError('Please select a laboratory order before saving.');
      setIsSaving(false);
      return;
    }

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
        section: test.section || '',
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


  if (isPatientView) {
    return (
      <AppShell title="Laboratory" subtitle="View diagnostic results">
        <div className="space-y-6">
          <PageIntro
            title="Laboratory Results"
            description="View saved laboratory reports connected to your patient chart."
          />

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm font-medium text-cyan-800">
            This page is view-only for patient accounts.
          </div>

          <SavedRecordsPanel
            collectionName="laboratoryResults"
            title="Laboratory Reports"
            description="Saved CBC, coagulation, blood typing, urinalysis, fecalysis, chemistry, immunology, and clinical microscopy reports for this patient."
            emptyMessage="No laboratory reports are available yet."
            sortBy="reportDate"
            sortDirection="desc"
            canDelete={false}
            suppressLoadError
            getTitle={(record) => record.order || record.panelName || record.title || 'Laboratory Report'}
            getSubtitle={(record) => `${formatDate(record.reportDate)} • ${record.reportStatus || 'No status'}`}
            getBadge={(record) => record.category || 'Lab'}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Laboratory" subtitle="Diagnostic results">
      <div className="space-y-6 pb-36">
        <PageIntro
          title="Laboratory Result Entry"
          description="Select a laboratory order, then manually enter the corresponding patient result values. New reports start blank."
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
                <option value=""></option>
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
                <option value=""></option>
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
                placeholder=""
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
          </div>
        </section>

        <section className="section-card overflow-hidden">
          {selectedPanel ? (
            <>
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
                      <th className="w-[30%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Test
                      </th>
                      <th className="w-[26%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Result
                      </th>
                      <th className="w-[18%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Unit
                      </th>
                      <th className="w-[26%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Reference
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {selectedPanel.tests.map((test, index) => {
                      const previousTest = selectedPanel.tests[index - 1];
                      const showSection = test.section && test.section !== previousTest?.section;

                      return (
                        <tr key={test.key} className="bg-white hover:bg-cyan-50/40">
                          <td className="px-5 py-3">
                            {showSection && (
                              <span
                                className={`mb-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ring-1 ${getSectionClasses(test.section)}`}
                              >
                                {test.section}
                              </span>
                            )}

                            <p className="font-semibold text-slate-900">
                              {test.label}
                            </p>
                          </td>

                          <td className="px-5 py-3">
                            <input
                              type="text"
                              value={results[test.key] || ''}
                              onChange={(event) => updateResult(test.key, event.target.value)}
                              placeholder=""
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="section-kicker">No laboratory order selected</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Select a laboratory order to begin.
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
                New entries start blank. Select a laboratory order to show the result table; sample type, report status, dates, remarks, and all result fields will remain empty until typed manually or loaded from saved history.
              </p>
            </div>
          )}
        </section>

        <section className="section-card p-5 lg:p-6">
          <label className="label">Remarks / Interpretation</label>
          <textarea
            rows={4}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder=""
            className="input"
          />

          <p className="mt-2 text-xs text-slate-500">
            Reference ranges are shown for guidance and may vary by hospital,
            patient age, sex, and laboratory standard.
          </p>
        </section>

        <SavedRecordsPanel
          collectionName="laboratoryResults"
          title="Saved Laboratory Reports"
          description=""
          sortBy="reportDate"
          sortDirection="desc"
          refreshKey={refreshKey}
          onRecordSelect={loadSavedLaboratoryReport}
          getTitle={(record) => record.order || record.panelName || record.title || 'Laboratory Report'}
          getSubtitle={(record) => `${formatDate(record.reportDate)} • ${record.reportStatus || 'No status'}`}
          getBadge={(record) => record.category || 'Lab'}
        />
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 xl:left-72 xl:right-0">
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
