'use client';

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const LOGIN_LOG_SESSION_KEY = 'novacare_login_log_id';

export async function createLoginLog(user, role, fullName) {
  if (typeof window === 'undefined' || !user) return null;

  const ref = await addDoc(collection(db, 'loginLogs'), {
    userId: user.uid,
    fullName: fullName || user.displayName || 'User',
    email: user.email || '',
    role: role || 'user',
    loginAt: serverTimestamp(),
    logoutAt: null,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  window.sessionStorage.setItem(LOGIN_LOG_SESSION_KEY, ref.id);
  return ref.id;
}

export async function closeLoginLog() {
  if (typeof window === 'undefined') return;

  const logId = window.sessionStorage.getItem(LOGIN_LOG_SESSION_KEY);
  if (!logId) return;

  await updateDoc(doc(db, 'loginLogs', logId), {
    logoutAt: serverTimestamp(),
    status: 'closed',
    updatedAt: serverTimestamp(),
  });

  window.sessionStorage.removeItem(LOGIN_LOG_SESSION_KEY);
}
