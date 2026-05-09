'use client';

import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, getSecondaryAuth } from '@/lib/firebase';
import { ROLES } from '@/lib/roles';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function generateTemporaryPassword() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NovaCare-${randomPart}!${new Date().getFullYear()}`;
}

export async function findPatientUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const usersQuery = query(
    collection(db, 'users'),
    where('email', '==', normalizedEmail),
    where('role', '==', ROLES.PATIENT)
  );

  const snapshot = await getDocs(usersQuery);
  const match = snapshot.docs[0];

  if (!match) return null;

  return {
    uid: match.id,
    ...match.data(),
  };
}

export async function createOrLinkPatientAccount({ patientId, email, fullName }) {
  const normalizedEmail = normalizeEmail(email);

  if (!patientId || !normalizedEmail) {
    return {
      created: false,
      linked: false,
      uid: '',
      email: normalizedEmail,
      temporaryPassword: '',
    };
  }

  const existingPatientUser = await findPatientUserByEmail(normalizedEmail);

  if (existingPatientUser) {
    await setDoc(
      doc(db, 'users', existingPatientUser.uid),
      {
        fullName: fullName || existingPatientUser.fullName || normalizedEmail,
        email: normalizedEmail,
        role: ROLES.PATIENT,
        patientId,
        linkedPatientId: patientId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      created: false,
      linked: true,
      uid: existingPatientUser.uid,
      email: normalizedEmail,
      temporaryPassword: '',
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const secondaryAuth = getSecondaryAuth();

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      normalizedEmail,
      temporaryPassword
    );

    await updateProfile(credential.user, {
      displayName: fullName || normalizedEmail,
    });

    await setDoc(doc(db, 'users', credential.user.uid), {
      fullName: fullName || normalizedEmail,
      email: normalizedEmail,
      role: ROLES.PATIENT,
      patientId,
      linkedPatientId: patientId,
      mustChangePassword: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      created: true,
      linked: false,
      uid: credential.user.uid,
      email: normalizedEmail,
      temporaryPassword,
    };
  } catch (err) {
    if (err?.code === 'auth/email-already-in-use') {
      throw new Error(
        'This email already exists in Firebase Authentication, but no matching patient profile was found in the users collection.'
      );
    }

    throw err;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }
}
