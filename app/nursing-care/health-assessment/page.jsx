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
      { key: 'hair', label: 'HAIR', defaultChecked: normalChecked },
      { key: 'perrla', label: 'PERRLA', defaultChecked: normalChecked },
      { key: 'nose', label: 'NOSE', defaultChecked: normalChecked },
      { key: 'ears', label: 'EARS', defaultChecked: normalChecked },
      {
        key: 'mouth',
        label: 'MOUTH',
        defaultChecked: normalChecked,
        children: [
          { key: 'mouthMidlineTongue', label: 'MIDLINE TONGUE', defaultChecked: normalChecked },
          { key: 'mouthMoist', label: 'MOIST', defaultChecked: normalChecked },
          { key: 'mouthLesions', label: 'LESIONS', defaultChecked: normalChecked },
          { key: 'mouthDentition', label: 'DENTITION', defaultChecked: normalChecked },
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
      { key: 'carotidPulse', label: 'CAROTID PULSE', defaultChecked: normalChecked },
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
      { key: 'apicalPulse', label: 'APICAL PULSE', defaultChecked: normalChecked },
      {
        key: 'chestFinding',
        label: 'FINDING',
        hideCheckbox: true,
        noteType: 'select',
        noteOptions: ['MUFFLED', 'ARRHYTHMIA'],
        placeholder: '',
      },
      { key: 'breathSoundsAnterior', label: 'BREATH SOUNDS - ANTERIOR', defaultChecked: normalChecked },
      { key: 'breathSoundsPosterior', label: 'POSTERIOR', defaultChecked: normalChecked },
      { key: 'breathSoundsLateral', label: 'LATERAL', defaultChecked: normalChecked },
      { key: 'chestSymmetry', label: 'CHEST SYMMETRY', defaultChecked: normalChecked },
      { key: 'skinTurgorClavicle', label: 'SKIN TURGOR (CLAVICLE)', defaultChecked: normalChecked },
    ],
  },

  // Abdomen
  {
    section: 'Abdomen',
    name: 'abdomenFindings',
    label: 'ABDOMEN',
    type: 'assessment-table',
    rows: [
      { key: 'inspection', label: 'INSPECTION', defaultChecked: normalChecked },
      {
        key: 'auscultation',
        label: 'AUSCULTATION',
        defaultChecked: normalChecked,
        extraSelects: [
          { key: 'luq', label: 'LUQ', options: bowelSoundOptions },
          { key: 'ruq', label: 'RUQ', options: bowelSoundOptions },
          { key: 'llq', label: 'LLQ', options: bowelSoundOptions },
          { key: 'rlq', label: 'RLQ', options: bowelSoundOptions },
        ],
      },
      { key: 'palpation', label: 'PALPATION', defaultChecked: normalChecked },
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
        placeholder: '',
        extraCheckboxes: [
          { key: 'other', label: 'OTHER', hasText: true, placeholder: '' },
        ],
      },
      { key: 'tempVsTrunk', label: 'TEMP VS. TRUNK (WARM / COOL)', defaultChecked: normalChecked },
      { key: 'gripEqualStrong', label: 'GRIP EQUAL AND STRONG', defaultChecked: normalChecked },
      { key: 'capillaryRefill', label: 'CAPILLARY REFILL', defaultChecked: normalChecked, placeholder: '' },
      { key: 'veinFillingRapid', label: 'VEIN FILLING RAPID', defaultChecked: normalChecked },
    ],
  },

  // Lower Extremities
  {
    section: 'Lower Extremities',
    name: 'lowerExtremitiesFindings',
    label: 'LOWER EXTREMITIES',
    type: 'assessment-table',
    rows: [
      { key: 'hairPresent', label: 'HAIR PRESENT', defaultChecked: normalChecked, placeholder: '' },
      { key: 'edema', label: 'EDEMA', defaultChecked: normalChecked },
      { key: 'footStrength', label: 'FOOT STRENGTH', defaultChecked: normalChecked },
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
        extraCheckboxes: [
          { key: 'yellowed', label: 'YELLOWED' },
          { key: 'thickened', label: 'THICKENED' },
          { key: 'ingrown', label: 'INGROWN' },
        ],
      },
      { key: 'pedalPulse', label: 'PEDAL PULSE', defaultChecked: normalChecked },
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
      { key: 'upperRight', label: 'UPPER R', defaultChecked: normalChecked },
      { key: 'upperLeft', label: 'UPPER L', defaultChecked: normalChecked },
      { key: 'lowerRight', label: 'LOWER R', defaultChecked: normalChecked },
      { key: 'lowerLeft', label: 'LOWER L', defaultChecked: normalChecked },
    ],
  },
  {
    section: 'ROM / Strength',
    name: 'strengthFindings',
    label: 'STRENGTH',
    type: 'assessment-table',
    fullWidth: false,
    rows: [
      { key: 'upperRight', label: 'UPPER R', defaultChecked: normalChecked },
      { key: 'upperLeft', label: 'UPPER L', defaultChecked: normalChecked },
      { key: 'lowerRight', label: 'LOWER R', defaultChecked: normalChecked },
      { key: 'lowerLeft', label: 'LOWER L', defaultChecked: normalChecked },
    ],
  },
  {
    section: 'ROM / Strength',
    name: 'sensationFindings',
    label: 'SENSATION',
    type: 'assessment-table',
    rows: [
      { key: 'sensation', label: 'SENSATION', defaultChecked: normalChecked },
    ],
  },

  // General Assessment
  {
    section: 'General Assessment',
    name: 'generalAssessmentFindings',
    label: 'GENERAL ASSESSMENT',
    type: 'assessment-table',
    rows: [
      { key: 'weightHeight', label: 'WEIGHT/HEIGHT', defaultChecked: normalChecked, placeholder: '' },
      { key: 'bmi', label: 'BMI', defaultChecked: normalChecked, placeholder: '' },
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
    type: 'assessment-table',
    rows: [
      { key: 'acuteChronic', label: 'ACUTE/CHRONIC', defaultChecked: normalChecked, placeholder: '' },
      { key: 'location', label: 'LOCATION', defaultChecked: normalChecked, placeholder: '' },
      { key: 'duration', label: 'DURATION', defaultChecked: normalChecked, placeholder: '' },
      { key: 'characteristics', label: 'CHARACTERISTICS', defaultChecked: normalChecked, placeholder: '' },
      { key: 'precipitation', label: 'PRECIPITATION', defaultChecked: normalChecked, placeholder: '' },
      { key: 'frequency', label: 'FREQUENCY', defaultChecked: normalChecked, placeholder: '' },
      { key: 'nonVerbals', label: 'NON-VERBALS', defaultChecked: normalChecked, placeholder: '' },
      { key: 'reliefFactors', label: 'RELIEF FACTORS', defaultChecked: normalChecked, placeholder: '' },
      { key: 'sleep', label: 'SLEEP', defaultChecked: normalChecked, placeholder: '' },
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
