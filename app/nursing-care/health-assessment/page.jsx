'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  // Assessment Timestamp
  {
    section: 'Assessment Timestamp',
    name: 'assessmentDateTime',
    label: 'Date & Time',
    type: 'datetime-local',
    required: true,
  },
  {
    section: 'Assessment Timestamp',
    name: 'assessedBy',
    label: 'Assessed By',
    required: true,
  },
  {
    section: 'Assessment Timestamp',
    name: 'shift',
    label: 'Shift',
    type: 'select',
    options: [
      'AM (6-2)',
      'PM (2-10)',
      'NIGHT (10-6)',
    ],
  },

  // Neurological Status
  {
    section: 'Neurological Status',
    name: 'levelOfConsciousness',
    label: 'Level of Consciousness',
    type: 'select',
    options: [
      'Alert',
      'Drowsy',
      'Lethargic',
      'Stuporous',
      'Coma',
    ],
  },
  {
    section: 'Neurological Status',
    name: 'orientation',
    label: 'Orientation',
    type: 'select',
    options: [
      'Person',
      'Place',
      'Time',
      'Situation',
      'Oriented x4',
    ],
  },
  {
    section: 'Neurological Status',
    name: 'neurologicalNotes',
    label: 'Neurological Notes',
    type: 'textarea',
  },

  // Vital Signs
  {
    section: 'Vital Signs',
    name: 'bloodPressure',
    label: 'BP (mmHg)',
  },
  {
    section: 'Vital Signs',
    name: 'temperature',
    label: 'Temp (°C)',
    type: 'number',
  },
  {
    section: 'Vital Signs',
    name: 'pulseRate',
    label: 'PR (bpm)',
    type: 'number',
  },
  {
    section: 'Vital Signs',
    name: 'respiratoryRate',
    label: 'RR (cpm)',
    type: 'number',
  },
  {
    section: 'Vital Signs',
    name: 'oxygenSaturation',
    label: 'O₂ Sat (%)',
    type: 'number',
  },

  // Head & Neck
  {
    section: 'Head & Neck',
    name: 'headAssessment',
    label: 'Head / Scalp / Hair',
    type: 'textarea',
  },
  {
    section: 'Head & Neck',
    name: 'eyeAssessment',
    label: 'Eyes / PERRLA',
    type: 'textarea',
  },
  {
    section: 'Head & Neck',
    name: 'entAssessment',
    label: 'Ears / Nose / Throat',
    type: 'textarea',
  },
  {
    section: 'Head & Neck',
    name: 'neckAssessment',
    label: 'Neck / Lymph Nodes',
    type: 'textarea',
  },

  // Chest & Respiratory
  {
    section: 'Chest & Respiratory',
    name: 'respiratoryAssessment',
    label: 'Chest / Breath Sounds',
    type: 'textarea',
    required: true,
  },
  {
    section: 'Chest & Respiratory',
    name: 'cardiovascularAssessment',
    label: 'Cardiac / Heart Sounds',
    type: 'textarea',
    required: true,
  },

  // Abdomen
  {
    section: 'Abdomen',
    name: 'abdominalAssessment',
    label: 'Abdominal Assessment',
    type: 'textarea',
  },

  // Extremities & Skin
  {
    section: 'Extremities & Skin',
    name: 'extremitiesAssessment',
    label: 'Extremities / ROM / Strength',
    type: 'textarea',
  },
  {
    section: 'Extremities & Skin',
    name: 'skinCondition',
    label: 'Skin Integrity',
    type: 'textarea',
    required: true,
  },

  // Pain Assessment
  {
    section: 'Pain Assessment',
    name: 'painScore',
    label: 'Pain Scale (0-10):',
    type: 'range',
    min: 0,
    max: 10,
    step: 1,
  },
  {
    section: 'Pain Assessment',
    name: 'painLocation',
    label: 'Pain Location',
  },
  {
    section: 'Pain Assessment',
    name: 'painDescription',
    label: 'Pain Description',
    type: 'textarea',
  },

];

export default function HealthAssessmentPage() {
  return (
    <AppShell
      title="Health Assessment"
      subtitle="Nursing care documentation"
    >
      <div className="form-shell space-y-6">
      <PageIntro
        title="Assessment Entry"
        description="Document nursing assessment findings and nursing diagnosis."
      />

      <RecordForm
        collectionName="healthAssessments"
        fields={fields}
        savedRecordsTitle="Saved Health Assessments"
        savedRecordsDescription="View previous health assessment entries for this patient."
      />
      </div>
    </AppShell>
  );
}