export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
};

export const MODULES = [
  { label: 'Dashboard', href: '/dashboard', group: 'Overview', icon: 'Squares2X2Icon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Select Patient', href: '/patients/select', group: 'Admission', icon: 'UserCircleIcon', roles: [ROLES.PATIENT, ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Patient Registration', href: '/admission/registration', group: 'Admission', icon: 'UserPlusIcon', roles: [ROLES.PATIENT, ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Daily Checklist', href: '/nursing-care/daily-checklist', group: 'Nursing Care', icon: 'CheckBadgeIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Health Assessment', href: '/nursing-care/health-assessment', group: 'Nursing Care', icon: 'HeartIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: "Nurse's Notes", href: '/nursing-care/nurses-notes', group: 'Nursing Care', icon: 'PencilSquareIcon', roles: [ROLES.NURSE] },
  { label: 'Vital Signs', href: '/monitoring/vital-signs', group: 'Monitoring', icon: 'SignalIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Intake & Output', href: '/monitoring/intake-output', group: 'Monitoring', icon: 'MapPinIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'IV Sheet', href: '/monitoring/iv-sheet', group: 'Monitoring', icon: 'BeakerIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: "Doctor's Orders", href: '/orders-and-meds/doctors-orders', group: 'Orders & Meds', icon: 'DocumentTextIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Medication Record', href: '/orders-and-meds/medication-record', group: 'Orders & Meds', icon: 'ClipboardDocumentListIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Laboratory', href: '/diagnostics/laboratory', group: 'Diagnostics', icon: 'BuildingLibraryIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Imaging', href: '/diagnostics/imaging', group: 'Diagnostics', icon: 'PhotoIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Billing', href: '/discharge-and-billing/billing', group: 'Discharge & Billing', icon: 'CreditCardIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Discharge', href: '/discharge-and-billing/discharge', group: 'Discharge & Billing', icon: 'ArrowRightOnRectangleIcon', roles: [ROLES.DOCTOR, ROLES.NURSE] },
  { label: 'Login Logs', href: '/admin/login-logs', group: 'Admin Demo', icon: 'ClockIcon', roles: [ROLES.NURSE] },
];

export function canAccess(role, href) {
  const module = MODULES.find((item) => item.href === href);
  return Boolean(module?.roles.includes(role));
}

export function getDefaultRoute(role) {
  if (role === ROLES.PATIENT) return '/patients/select';
  return '/patients/select';
}
