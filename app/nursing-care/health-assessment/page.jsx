'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'generalAppearance', label: 'General Appearance', type: 'textarea', required: true },
  { name: 'painScore', label: 'Pain Score 0-10', type: 'number', required: true },
  { name: 'skinCondition', label: 'Skin Condition', required: true },
  { name: 'respiratoryAssessment', label: 'Respiratory Assessment', required: true },
  { name: 'cardiovascularAssessment', label: 'Cardiovascular Assessment', required: true },
  { name: 'nursingDiagnosis', label: 'Nursing Diagnosis', type: 'textarea', required: true },
];

export default function HealthAssessmentPage() {
  return (
    <AppShell title="Health Assessment" subtitle="Nursing care documentation">
      <PageIntro title="Assessment Entry" description="Document nursing assessment findings and nursing diagnosis." />
      <RecordForm collectionName="healthAssessments" fields={fields} />
    </AppShell>
  );
}
