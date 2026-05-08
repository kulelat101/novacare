'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'itemDate', label: 'Item Date', type: 'date', required: true },
  { name: 'category', label: 'Category', type: 'select', options: ['Room', 'Medication', 'Laboratory', 'Imaging', 'Professional Fee', 'Supplies', 'Other'], required: true },
  { name: 'description', label: 'Description', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function BillingPage() {
  return (
    <AppShell title="Billing" subtitle="Discharge and billing module">
      <PageIntro title="Billing Entry" description="Record billable items for the patient account." />
      <RecordForm collectionName="billingRecords" fields={fields} />
    </AppShell>
  );
}
