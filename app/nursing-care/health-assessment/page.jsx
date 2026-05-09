'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const normalChecked = false;
const bowelSoundOptions = ['active', 'hyper', 'absent'];
const positiveNegativeOptions = ['+', '-'];

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
    type: 'checkbox-group',
    options: [
      'PERSON',
      'PLACE',
      'TIME',
      'SITUATION',
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

  // Head
  {
    section: 'Head',
    name: 'headFindings',
    label: 'HEAD',
    type: 'assessment-table',
    rows: [
      { key: 'hair', label: 'HAIR', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'perrla', label: 'PERRLA', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'nose', label: 'NOSE', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'ears', label: 'EARS', defaultChecked: normalChecked, defaultNote: '' },
      {
        key: 'mouth',
        label: 'MOUTH',
        defaultChecked: normalChecked,
        defaultNote: '',
        children: [
          { key: 'mouthMidlineTongue', label: 'MIDLINE TONGUE', defaultChecked: normalChecked, defaultNote: '' },
          { key: 'mouthMoist', label: 'MOIST', defaultChecked: normalChecked, defaultNote: '' },
          { key: 'mouthLesions', label: 'LESIONS', defaultChecked: normalChecked, defaultNote: '' },
          { key: 'mouthDentition', label: 'DENTITION', defaultChecked: normalChecked, defaultNote: '' },
        ],
      },
    ],
  },

  // Neck
  {
    section: 'Neck',
    name: 'neckFindings',
    label: 'NECK',
    type: 'assessment-table',
    rows: [
      { key: 'carotidPulse', label: 'CAROTID PULSE', defaultChecked: normalChecked, defaultNote: '' },
      {
        key: 'neckFinding',
        label: 'FINDINGS',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: ['JVD +', 'TRACHEA MIDLINE'],
        placeholder: '',
      },
    ],
  },

  // Chest
  {
    section: 'Chest',
    name: 'chestFindings',
    label: 'CHEST',
    type: 'assessment-table',
    rows: [
      { key: 'apicalPulse', label: 'APICAL PULSE', defaultChecked: normalChecked, defaultNote: '' },
      {
        key: 'chestFinding',
        label: 'FINDING',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: ['MUFFLED', 'ARRHYTHMIA'],
        placeholder: '',
      },
      { key: 'breathSoundsAnterior', label: 'BREATH SOUNDS - ANTERIOR', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'breathSoundsPosterior', label: 'POSTERIOR', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'breathSoundsLateral', label: 'LATERAL', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'chestSymmetry', label: 'CHEST SYMMETRY', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'skinTurgorClavicle', label: 'SKIN TURGOR (CLAVICLE)', defaultChecked: normalChecked, defaultNote: '' },
    ],
  },

  // Abdomen
  {
    section: 'Abdomen',
    name: 'abdomenFindings',
    label: 'ABDOMEN',
    type: 'assessment-table',
    rows: [
      { key: 'inspection', label: 'INSPECTION', defaultChecked: normalChecked, defaultNote: '' },
      {
        key: 'auscultation',
        label: 'AUSCULTATION',
        defaultChecked: normalChecked,
        defaultNote: '',
        extraSelects: [
          { key: 'luq', label: 'LUQ', options: bowelSoundOptions },
          { key: 'ruq', label: 'RUQ', options: bowelSoundOptions },
          { key: 'llq', label: 'LLQ', options: bowelSoundOptions },
          { key: 'rlq', label: 'RLQ', options: bowelSoundOptions },
        ],
      },
      { key: 'palpation', label: 'PALPATION', defaultChecked: normalChecked, defaultNote: '' },
    ],
  },

  // Upper Extremities
  {
    section: 'Upper Extremities',
    name: 'upperExtremitiesFindings',
    label: 'UPPER EXTREMITIES',
    type: 'assessment-table',
    rows: [
      {
        key: 'radialPulses',
        label: 'RADIAL PULSES EQUAL, +2',
        defaultChecked: normalChecked,
        defaultNote: '',
        placeholder: 'e.g. Equal, +2',
        extraCheckboxes: [
          { key: 'other', label: 'OTHER', hasText: true, placeholder: '' },
        ],
      },
      { key: 'tempVsTrunk', label: 'TEMP VS. TRUNK (WARM / COOL)', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'gripEqualStrong', label: 'GRIP EQUAL AND STRONG', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'capillaryRefill', label: 'CAPILLARY REFILL <3 SEC', defaultChecked: normalChecked, hasNote: false },
      { key: 'veinFillingRapid', label: 'VEIN FILLING RAPID', defaultChecked: normalChecked, defaultNote: 'Rapid' },
    ],
  },

  // Lower Extremities
  {
    section: 'Lower Extremities',
    name: 'lowerExtremitiesFindings',
    label: 'LOWER EXTREMITIES',
    type: 'assessment-table',
    rows: [
      { key: 'hairPresent', label: 'HAIR PRESENT', defaultChecked: normalChecked, hasNote: false },
      { key: 'edema', label: 'EDEMA', defaultChecked: normalChecked, defaultNote: 'No edema noted' },
      { key: 'footStrength', label: 'FOOT STRENGTH', defaultChecked: normalChecked, defaultNote: '' },
      {
        key: 'homans',
        label: 'HOMAN’S',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: positiveNegativeOptions,
        placeholder: '',
      },
      {
        key: 'claudication',
        label: 'CLAUDICATION',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: positiveNegativeOptions,
        placeholder: '',
      },
      {
        key: 'nails',
        label: 'NAILS',
        defaultChecked: normalChecked,
        defaultNote: '',
        extraCheckboxes: [
          { key: 'yellowed', label: 'YELLOWED' },
          { key: 'thickened', label: 'THICKENED' },
          { key: 'ingrown', label: 'INGROWN' },
        ],
      },
      { key: 'pedalPulse', label: 'PEDAL PULSE', defaultChecked: normalChecked, defaultNote: '' },
    ],
  },

  // ROM and Strength
  {
    section: 'ROM / Strength',
    name: 'romFindings',
    label: 'ROM',
    type: 'assessment-table',
    fullWidth: false,
    rows: [
      { key: 'upperRight', label: 'UPPER R', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'upperLeft', label: 'UPPER L', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'lowerRight', label: 'LOWER R', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'lowerLeft', label: 'LOWER L', defaultChecked: normalChecked, defaultNote: '' },
    ],
  },
  {
    section: 'ROM / Strength',
    name: 'strengthFindings',
    label: 'STRENGTH',
    type: 'assessment-table',
    fullWidth: false,
    rows: [
      { key: 'upperRight', label: 'UPPER R', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'upperLeft', label: 'UPPER L', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'lowerRight', label: 'LOWER R', defaultChecked: normalChecked, defaultNote: '' },
      { key: 'lowerLeft', label: 'LOWER L', defaultChecked: normalChecked, defaultNote: '' },
    ],
  },
  {
    section: 'ROM / Strength',
    name: 'sensationFindings',
    label: 'SENSATION',
    type: 'assessment-table',
    rows: [
      { key: 'sensation', label: 'SENSATION', defaultChecked: normalChecked, defaultNote: '' },
    ],
  },

  // General Assessment
  {
    section: 'General Assessment',
    name: 'generalAssessmentFindings',
    label: 'GENERAL ASSESSMENT',
    type: 'assessment-table',
    rows: [
      { key: 'weightHeight', label: 'WEIGHT/HEIGHT', defaultChecked: normalChecked, defaultNote: '', placeholder: '' },
      { key: 'bmi', label: 'BMI', defaultChecked: normalChecked, defaultNote: '', placeholder: '' },
    ],
  },

  // Skin Assessment
  {
    section: 'Skin Assessment',
    name: 'skinAssessment',
    label: 'Skin Assessment',
    type: 'textarea',
    placeholder: '',
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
    name: 'painAssessmentChecklist',
    label: 'Pain Assessment Checklist',
    type: 'checkbox-group',
    options: [
      'ACUTE/CHRONIC',
      'LOCATION',
      'DURATION',
      'CHARACTERISTICS',
      'PRECIPITATION',
      'FREQUENCY',
      'NON-VERBALS',
      'RELIEF FACTORS',
      'SLEEP',
    ],
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
