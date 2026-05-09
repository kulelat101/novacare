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
      { key: 'hair', label: 'HAIR', defaultChecked: normalChecked, defaultNote: 'Clean, no lice, and no bald spots' },
      { key: 'perrla', label: 'PERRLA', defaultChecked: normalChecked, defaultNote: 'Pupils are equal, clear, and reactive to light; no redness' },
      { key: 'nose', label: 'NOSE', defaultChecked: normalChecked, defaultNote: 'No blockage and bleeding' },
      { key: 'ears', label: 'EARS', defaultChecked: normalChecked, defaultNote: 'Equal on both sides; no discharge' },
      {
        key: 'mouth',
        label: 'MOUTH',
        defaultChecked: normalChecked,
        defaultNote: 'Pink and moist; no sores',
        children: [
          { key: 'mouthMidlineTongue', label: 'MIDLINE TONGUE', defaultChecked: normalChecked, defaultNote: 'Centered, no deviation observed' },
          { key: 'mouthMoist', label: 'MOIST', defaultChecked: normalChecked, defaultNote: 'Wet and shiny' },
          { key: 'mouthLesions', label: 'LESIONS', defaultChecked: normalChecked, defaultNote: 'No lesions inspected' },
          { key: 'mouthDentition', label: 'DENTITION', defaultChecked: normalChecked, defaultNote: 'Teeth intact, no missing teeth' },
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
      { key: 'carotidPulse', label: 'CAROTID PULSE', defaultChecked: normalChecked, defaultNote: 'Normal rhythm and equal bilaterally' },
      {
        key: 'neckFinding',
        label: 'FINDINGS',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: ['JVD +', 'TRACHEA MIDLINE'],
        placeholder: 'Select finding',
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
      { key: 'apicalPulse', label: 'APICAL PULSE', defaultChecked: normalChecked, defaultNote: 'Regular and within normal range' },
      {
        key: 'chestFinding',
        label: 'FINDING',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: ['MUFFLED', 'ARRHYTHMIA'],
        placeholder: 'Select finding',
      },
      { key: 'breathSoundsAnterior', label: 'BREATH SOUNDS - ANTERIOR', defaultChecked: normalChecked, defaultNote: 'Clear' },
      { key: 'breathSoundsPosterior', label: 'POSTERIOR', defaultChecked: normalChecked, defaultNote: 'Clear' },
      { key: 'breathSoundsLateral', label: 'LATERAL', defaultChecked: normalChecked, defaultNote: 'Clear' },
      { key: 'chestSymmetry', label: 'CHEST SYMMETRY', defaultChecked: normalChecked, defaultNote: 'Symmetric, equal rise, and fall' },
      { key: 'skinTurgorClavicle', label: 'SKIN TURGOR (CLAVICLE)', defaultChecked: normalChecked, defaultNote: 'Good and elastic' },
    ],
  },

  // Abdomen
  {
    section: 'Abdomen',
    name: 'abdomenFindings',
    label: 'ABDOMEN',
    type: 'assessment-table',
    rows: [
      { key: 'inspection', label: 'INSPECTION', defaultChecked: normalChecked, defaultNote: 'No abnormalities observed' },
      {
        key: 'auscultation',
        label: 'AUSCULTATION',
        defaultChecked: normalChecked,
        defaultNote: 'No abnormal sounds',
        extraSelects: [
          { key: 'luq', label: 'LUQ', options: bowelSoundOptions },
          { key: 'ruq', label: 'RUQ', options: bowelSoundOptions },
          { key: 'llq', label: 'LLQ', options: bowelSoundOptions },
          { key: 'rlq', label: 'RLQ', options: bowelSoundOptions },
        ],
      },
      { key: 'palpation', label: 'PALPATION', defaultChecked: normalChecked, defaultNote: 'No masses palpated' },
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
          { key: 'other', label: 'OTHER', hasText: true, placeholder: 'Specify other finding' },
        ],
      },
      { key: 'tempVsTrunk', label: 'TEMP VS. TRUNK (WARM / COOL)', defaultChecked: normalChecked, defaultNote: 'Warm, same as trunk' },
      { key: 'gripEqualStrong', label: 'GRIP EQUAL AND STRONG', defaultChecked: normalChecked, defaultNote: 'Strength is equal and strong' },
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
      { key: 'footStrength', label: 'FOOT STRENGTH', defaultChecked: normalChecked, defaultNote: 'Strength is equal and strong' },
      {
        key: 'homans',
        label: 'HOMAN’S',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: positiveNegativeOptions,
        placeholder: 'Select',
      },
      {
        key: 'claudication',
        label: 'CLAUDICATION',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: positiveNegativeOptions,
        placeholder: 'Select',
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
      { key: 'pedalPulse', label: 'PEDAL PULSE', defaultChecked: normalChecked, defaultNote: 'Palpable and equal' },
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
      { key: 'upperRight', label: 'UPPER R', defaultChecked: normalChecked, defaultNote: 'Full ROM, moves freely' },
      { key: 'upperLeft', label: 'UPPER L', defaultChecked: normalChecked, defaultNote: 'Full ROM, moves freely' },
      { key: 'lowerRight', label: 'LOWER R', defaultChecked: normalChecked, defaultNote: 'Full ROM, moves freely' },
      { key: 'lowerLeft', label: 'LOWER L', defaultChecked: normalChecked, defaultNote: 'Full ROM, moves freely' },
    ],
  },
  {
    section: 'ROM / Strength',
    name: 'strengthFindings',
    label: 'STRENGTH',
    type: 'assessment-table',
    fullWidth: false,
    rows: [
      { key: 'upperRight', label: 'UPPER R', defaultChecked: normalChecked, defaultNote: 'Strong and equal bilaterally' },
      { key: 'upperLeft', label: 'UPPER L', defaultChecked: normalChecked, defaultNote: 'Strong and equal bilaterally' },
      { key: 'lowerRight', label: 'LOWER R', defaultChecked: normalChecked, defaultNote: 'Strong and equal bilaterally' },
      { key: 'lowerLeft', label: 'LOWER L', defaultChecked: normalChecked, defaultNote: 'Strong and equal bilaterally' },
    ],
  },
  {
    section: 'ROM / Strength',
    name: 'sensationFindings',
    label: 'SENSATION',
    type: 'assessment-table',
    rows: [
      { key: 'sensation', label: 'SENSATION', defaultChecked: normalChecked, defaultNote: 'Intact and equal' },
    ],
  },

  // General Assessment
  {
    section: 'General Assessment',
    name: 'generalAssessmentFindings',
    label: 'GENERAL ASSESSMENT',
    type: 'assessment-table',
    rows: [
      { key: 'weightHeight', label: 'WEIGHT/HEIGHT', defaultChecked: normalChecked, defaultNote: '', placeholder: 'e.g. 85 kg / 157 cm' },
      { key: 'bmi', label: 'BMI', defaultChecked: normalChecked, defaultNote: '', placeholder: 'e.g. 34.5 - Obesity' },
    ],
  },

  // Skin Assessment
  {
    section: 'Skin Assessment',
    name: 'skinAssessment',
    label: 'Skin Assessment',
    type: 'textarea',
    placeholder: 'Enter skin assessment findings...',
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
