'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const DEMO_PATIENT_ID = 'NC-2026-001';
export const ACTIVE_PATIENT_STORAGE_KEY = 'novacare_active_patient_id';

export function createClientId(prefix = 'row') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getStoredActivePatientId() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ACTIVE_PATIENT_STORAGE_KEY) || '';
}

export function setStoredActivePatientId(patientId) {
  if (typeof window === 'undefined') return;

  if (patientId) {
    window.localStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patientId);
  } else {
    window.localStorage.removeItem(ACTIVE_PATIENT_STORAGE_KEY);
  }
}

export function clearStoredActivePatientId() {
  setStoredActivePatientId('');
}

export function getActivePatientId(fallback = DEMO_PATIENT_ID) {
  return getStoredActivePatientId() || fallback;
}

function resolvePatientId(patientId) {
  return patientId || getStoredActivePatientId() || '';
}

export function isPermissionError(err) {
  return err?.code === 'permission-denied' || String(err?.message || '').toLowerCase().includes('permission');
}

function normalizeId(value) {
  return String(value || '').trim();
}

function uniqueIds(values) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeId(value))
        .filter(Boolean)
    )
  );
}

export function getPatientDocumentId(patient) {
  return normalizeId(patient?.id || patient?.docId || patient?.documentId || patient?.patientDocId || patient?.patientId);
}

export function getPatientVisibleId(patient) {
  return normalizeId(patient?.patientId || patient?.id);
}

export function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLocalTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function getLocalDateTime() {
  return `${getLocalDate()}T${getLocalTime()}`;
}

export function getPatientsCollectionRef() {
  return collection(db, 'patients');
}

export function getPatientRootDocRef(patientId = getActivePatientId('')) {
  return doc(db, 'patients', String(patientId));
}

export function getPatientCollectionRef(
  collectionName,
  patientId
) {
  return collection(db, 'patients', resolvePatientId(patientId), collectionName);
}

export function getPatientDocRef(
  collectionName,
  documentId,
  patientId
) {
  return doc(db, 'patients', resolvePatientId(patientId), collectionName, String(documentId));
}

function toSortableValue(value) {
  if (!value) return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return String(value);
}

export async function loadPatients() {
  const snapshot = await getDocs(getPatientsCollectionRef());
  const rows = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return rows.sort((a, b) => {
    const first = toSortableValue(a.updatedAt || a.createdAt || a.patientId || a.id);
    const second = toSortableValue(b.updatedAt || b.createdAt || b.patientId || b.id);
    return first < second ? 1 : -1;
  });
}

export async function loadPatientProfile(patientId = getActivePatientId('')) {
  const normalizedPatientId = normalizeId(patientId);
  if (!normalizedPatientId) return null;

  try {
    const directSnapshot = await getDoc(getPatientRootDocRef(normalizedPatientId));
    if (directSnapshot.exists()) {
      return {
        id: directSnapshot.id,
        ...directSnapshot.data(),
      };
    }
  } catch (err) {
    if (!isPermissionError(err)) {
      throw err;
    }
    // Continue to legacy lookups. Some older patient accounts store the visible
    // patientId in users.linkedPatientId while the actual Firestore document ID
    // is different. A direct read of patients/{visiblePatientId} may be denied
    // by rules because that document does not own the logged-in patient account.
  }

  const lookupFields = ['patientId', 'id', 'patientUid', 'patientUserId'];

  for (const field of lookupFields) {
    try {
      const patientQuery = query(
        getPatientsCollectionRef(),
        where(field, '==', normalizedPatientId),
        limit(1)
      );
      const snapshot = await getDocs(patientQuery);
      const match = snapshot.docs[0];

      if (match) {
        return {
          id: match.id,
          ...match.data(),
        };
      }
    } catch (err) {
      if (!isPermissionError(err)) {
        throw err;
      }
    }
  }

  return null;
}

export async function savePatientProfile(patientId, payload, { merge = true } = {}) {
  const documentId = String(patientId || payload?.id || payload?.patientId || createClientId('patient')).trim();
  const visiblePatientId = String(payload?.patientId || documentId).trim();

  await setDoc(
    getPatientRootDocRef(documentId),
    {
      ...payload,
      id: documentId,
      patientId: visiblePatientId,
      updatedAt: serverTimestamp(),
      createdAt: payload?.createdAt || serverTimestamp(),
    },
    { merge }
  );

  return documentId;
}

export async function deletePatientProfile(patientId) {
  await deleteDoc(getPatientRootDocRef(patientId));
}

async function resolvePatientDocumentIds(patientId) {
  const activePatientId = resolvePatientId(patientId);
  if (!activePatientId) return [];

  const ids = [activePatientId];

  try {
    const patient = await loadPatientProfile(activePatientId);
    if (patient) {
      ids.push(patient.id, patient.patientId, patient.documentId, patient.docId);
    }
  } catch (err) {
    if (!isPermissionError(err)) {
      throw err;
    }
  }

  return uniqueIds(ids);
}

export async function loadPatientRows(
  collectionName,
  {
    patientId,
    sortBy = 'createdAt',
    sortDirection = 'desc',
  } = {}
) {
  const patientDocumentIds = await resolvePatientDocumentIds(patientId);
  if (patientDocumentIds.length === 0) return [];

  const rows = [];
  const seen = new Set();
  let lastNonPermissionError = null;

  for (const patientDocumentId of patientDocumentIds) {
    try {
      const snapshot = await getDocs(getPatientCollectionRef(collectionName, patientDocumentId));

      snapshot.docs.forEach((item) => {
        const key = `${patientDocumentId}/${item.id}`;
        if (seen.has(key)) return;
        seen.add(key);

        rows.push({
          id: item.id,
          __patientDocumentId: patientDocumentId,
          ...item.data(),
        });
      });
    } catch (err) {
      if (!isPermissionError(err)) {
        lastNonPermissionError = err;
      }
    }
  }

  if (rows.length === 0 && lastNonPermissionError) {
    throw lastNonPermissionError;
  }

  if (!sortBy) return rows;

  return rows.sort((a, b) => {
    const first = toSortableValue(a[sortBy]);
    const second = toSortableValue(b[sortBy]);

    if (first === second) return 0;

    if (sortDirection === 'asc') {
      return first > second ? 1 : -1;
    }

    return first < second ? 1 : -1;
  });
}

export async function addPatientRecord(
  collectionName,
  payload,
  { patientId } = {}
) {
  const requestedPatientId = resolvePatientId(patientId);
  if (!requestedPatientId) {
    throw new Error('Please select a patient before saving this record.');
  }

  const patient = await loadPatientProfile(requestedPatientId).catch((err) => {
    if (isPermissionError(err)) return null;
    throw err;
  });
  const activePatientId = getPatientDocumentId(patient) || requestedPatientId;

  return addDoc(getPatientCollectionRef(collectionName, activePatientId), {
    ...payload,
    patientId: activePatientId,
    visiblePatientId: patient?.patientId || payload?.visiblePatientId || requestedPatientId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function savePatientRows(
  collectionName,
  rows,
  { patientId } = {}
) {
  const requestedPatientId = resolvePatientId(patientId);
  if (!requestedPatientId) {
    throw new Error('Please select a patient before saving this record.');
  }

  const patient = await loadPatientProfile(requestedPatientId).catch((err) => {
    if (isPermissionError(err)) return null;
    throw err;
  });
  const activePatientId = getPatientDocumentId(patient) || requestedPatientId;
  const visiblePatientId = patient?.patientId || requestedPatientId;

  const collectionRef = getPatientCollectionRef(collectionName, activePatientId);
  const snapshot = await getDocs(collectionRef);
  const batch = writeBatch(db);

  snapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  rows.forEach((row) => {
    const id = String(row.id || createClientId());
    const rowRef = doc(collectionRef, id);

    batch.set(rowRef, {
      ...row,
      id,
      patientId: activePatientId,
      visiblePatientId,
      createdAt: row.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function clearPatientCollection(
  collectionName,
  { patientId } = {}
) {
  const activePatientId = resolvePatientId(patientId);
  if (!activePatientId) return [];

  let snapshot;
  try {
    snapshot = await getDocs(getPatientCollectionRef(collectionName, activePatientId));
  } catch (err) {
    if (isPermissionError(err)) {
      return [];
    }
    throw err;
  }
  const batch = writeBatch(db);

  snapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  await batch.commit();
}

export async function loadPatientDocument(
  collectionName,
  documentId,
  { patientId } = {}
) {
  const snapshot = await getDoc(
    getPatientDocRef(collectionName, documentId, resolvePatientId(patientId))
  );

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function savePatientDocument(
  collectionName,
  documentId,
  payload,
  { patientId } = {}
) {
  const activePatientId = resolvePatientId(patientId);

  await setDoc(
    getPatientDocRef(collectionName, documentId, activePatientId),
    {
      ...payload,
      id: String(documentId),
      patientId: activePatientId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deletePatientDocument(
  collectionName,
  documentId,
  { patientId } = {}
) {
  await deleteDoc(getPatientDocRef(collectionName, documentId, resolvePatientId(patientId)));
}
