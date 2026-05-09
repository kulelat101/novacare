'use client';

import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function getProfileValue(profile, keys) {
  for (const key of keys) {
    const value = profile?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

export async function createLoginLog(user, roleOrProfile, fullNameFallback = '') {
  const profile = typeof roleOrProfile === 'object' && roleOrProfile !== null
    ? roleOrProfile
    : { role: roleOrProfile, fullName: fullNameFallback };

  const role = normalizeRole(profile?.role);
  const fullName = getProfileValue(profile, ['fullName', 'displayName', 'name']) || user.displayName || 'User';
  const patientId = getProfileValue(profile, [
    'linkedPatientDocId',
    'linkedPatientId',
    'patientDocId',
    'patientId',
    'visiblePatientId',
    'chartId',
  ]);
  const patientName = getProfileValue(profile, ['patientName', 'linkedPatientName']) || (role === 'patient' ? fullName : '');
  const doctorId = getProfileValue(profile, ['doctorId', 'providerId', 'physicianId']);
  const doctorName = getProfileValue(profile, ['doctorName', 'providerName', 'physicianName']) || (role === 'doctor' ? fullName : '');

  const ref = await addDoc(collection(db, 'loginLogs'), {
    userId: user.uid,
    fullName,
    email: user.email,
    role,
    accountType: role,
    patientId,
    patientName,
    doctorId,
    doctorName,
    loginAt: serverTimestamp(),
    logoutAt: null,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  window.sessionStorage.setItem('novacare_login_log_id', ref.id);
}

export async function closeLoginLog() {
  const logId = window.sessionStorage.getItem('novacare_login_log_id');
  if (!logId) return;

  await updateDoc(doc(db, 'loginLogs', logId), {
    logoutAt: serverTimestamp(),
    status: 'closed',
    updatedAt: serverTimestamp(),
  });

  window.sessionStorage.removeItem('novacare_login_log_id');
}
