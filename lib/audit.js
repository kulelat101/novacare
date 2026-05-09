'use client';

import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createLoginLog(user, role, fullName) {
  const ref = await addDoc(collection(db, 'loginLogs'), {
    userId: user.uid,
    fullName: fullName || user.displayName || 'User',
    email: user.email,
    role,
    loginAt: serverTimestamp(),
    logoutAt: null,
    status: 'active',
  });

  window.sessionStorage.setItem('novacare_login_log_id', ref.id);
}

export async function closeLoginLog() {
  const logId = window.sessionStorage.getItem('novacare_login_log_id');
  if (!logId) return;

  await updateDoc(doc(db, 'loginLogs', logId), {
    logoutAt: serverTimestamp(),
    status: 'closed',
  });

  window.sessionStorage.removeItem('novacare_login_log_id');
}
