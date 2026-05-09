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
  return patientId || getActivePatientId();
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

export function getPatientRootDocRef(patientId = getActivePatientId()) {
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

function patientFromSnapshot(snapshot) {
  const data = snapshot.data() || {};

  return {
    ...data,
    docId: snapshot.id,
    id: snapshot.id,
    patientId: data.patientId || data.id || snapshot.id,
  };
}

async function findPatientByField(fieldName, value) {
  const patientQuery = query(
    getPatientsCollectionRef(),
    where(fieldName, '==', value),
    limit(1)
  );

  const snapshot = await getDocs(patientQuery);
  const match = snapshot.docs[0];

  return match ? patientFromSnapshot(match) : null;
}

export async function loadPatients() {
  const snapshot = await getDocs(getPatientsCollectionRef());
  const rows = snapshot.docs.map(patientFromSnapshot);

  return rows.sort((a, b) => {
    const first = toSortableValue(a.updatedAt || a.createdAt || a.patientId || a.id);
    const second = toSortableValue(b.updatedAt || b.createdAt || b.patientId || b.id);
    return first < second ? 1 : -1;
  });
}

export async function loadPatientProfile(patientId = getActivePatientId('')) {
  const lookupId = String(patientId || '').trim();
  if (!lookupId) return null;

  const snapshot = await getDoc(getPatientRootDocRef(lookupId));
  if (snapshot.exists()) return patientFromSnapshot(snapshot);

  return (
    await findPatientByField('patientId', lookupId)
    || await findPatientByField('id', lookupId)
  );
}

export async function savePatientProfile(patientId, payload, { merge = true } = {}) {
  const docId = String(patientId || payload?.docId || payload?.id || payload?.patientId || createClientId('patient')).trim();
  const chartPatientId = String(payload?.patientId || payload?.id || docId).trim();

  await setDoc(
    getPatientRootDocRef(docId),
    {
      ...payload,
      docId,
      id: docId,
      patientId: chartPatientId,
      updatedAt: serverTimestamp(),
      createdAt: payload?.createdAt || serverTimestamp(),
    },
    { merge }
  );

  return docId;
}

export async function deletePatientProfile(patientId) {
  await deleteDoc(getPatientRootDocRef(patientId));
}

export async function loadPatientRows(
  collectionName,
  {
    patientId,
    sortBy = 'createdAt',
    sortDirection = 'desc',
  } = {}
) {
  const activePatientId = resolvePatientId(patientId);
  const snapshot = await getDocs(getPatientCollectionRef(collectionName, activePatientId));

  const rows = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

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
  const activePatientId = resolvePatientId(patientId);

  return addDoc(getPatientCollectionRef(collectionName, activePatientId), {
    ...payload,
    patientId: activePatientId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function savePatientRows(
  collectionName,
  rows,
  { patientId } = {}
) {
  const activePatientId = resolvePatientId(patientId);
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
  const snapshot = await getDocs(getPatientCollectionRef(collectionName, activePatientId));
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
