'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'doctorName', label: 'Doctor Name', required: true },
  { name: 'orderType', label: 'Order Type', type: 'select', options: ['Medication', 'Laboratory', 'Imaging', 'Diet', 'Nursing Care', 'Discharge'], required: true },
  { name: 'orderText', label: "Doctor's Order", type: 'textarea', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Carried Out', 'Discontinued'], required: true },
];

export default function DoctorsOrdersPage() {
  return (
    <AppShell title="Doctor's Orders" subtitle="Orders and medication module">
      <PageIntro title="Order Entry" description="Record orders for medication, diagnostics, diet, nursing care, or discharge." />
      <RecordForm collectionName="doctorOrders" fields={fields} />
    </AppShell>
  );
}
