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

export function isMissingIndexError(err) {
  const message = String(err?.message || '').toLowerCase();

  return (
    err?.code === 'failed-precondition' ||
    message.includes('requires an index') ||
    message.includes('create it here') ||
    message.includes('collection_group')
  );
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


function buildPatientRecordCandidateIds(patient, requestedPatientId) {
  return uniqueIds([
    requestedPatientId,
    patient?.id,
    patient?.docId,
    patient?.documentId,
    patient?.patientDocId,
    patient?.firestoreId,
    patient?.patientId,
    patient?.visiblePatientId,
    patient?.chartId,
    patient?.caseNo,
    patient?.patientUid,
    patient?.patientUserId,
    patient?.authUid,
    patient?.uid,
  ]);
}

function makeCollectionGroupDocKey(item) {
  return item?.ref?.path || item.id;
}

function mapRecordSnapshotDoc(item, patientDocumentId = '') {
  const data = item.data();

  return {
    ...data,
    id: item.id,
    docId: item.id,
    documentId: item.id,
    __patientDocumentId: patientDocumentId,
    __path: item?.ref?.path || '',
  };
}

export function getPatientDocumentId(patient) {
  // IMPORTANT: this must be the real Firestore document ID, not the visible
  // hospital Patient ID such as NC-2026-211914. Older records may have an
  // `id` field inside the document data, so prefer explicit Firestore aliases.
  return normalizeId(
    patient?.docId ||
    patient?.documentId ||
    patient?.patientDocId ||
    patient?.firestoreId ||
    patient?.id
  );
}

export function getPatientVisibleId(patient) {
  return normalizeId(
    patient?.patientId ||
    patient?.visiblePatientId ||
    patient?.chartId ||
    patient?.caseNo ||
    patient?.id
  );
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
  const rows = snapshot.docs.map((item) => {
    const data = item.data();

    return {
      ...data,
      // Keep `id` as the actual Firestore document ID. This prevents the
      // visible patientId stored inside document data from overriding the path
      // used for subcollections such as laboratoryResults.
      id: item.id,
      docId: item.id,
      documentId: item.id,
      visiblePatientId: data.visiblePatientId || data.patientId || data.id || item.id,
    };
  });

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
      const data = directSnapshot.data();

      return {
        ...data,
        id: directSnapshot.id,
        docId: directSnapshot.id,
        documentId: directSnapshot.id,
        visiblePatientId: data.visiblePatientId || data.patientId || data.id || directSnapshot.id,
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
        const data = match.data();

        return {
          ...data,
          id: match.id,
          docId: match.id,
          documentId: match.id,
          visiblePatientId: data.visiblePatientId || data.patientId || data.id || match.id,
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
      docId: documentId,
      documentId,
      patientId: visiblePatientId,
      visiblePatientId,
      updatedAt: serverTimestamp(),
      createdAt: payload?.createdAt || serverTimestamp(),
    },
    { merge }
  );

  return documentId;
}


export const PATIENT_RECORD_SUBCOLLECTIONS = [
  'billingItems',
  'dailyChecklists',
  'dischargeSummaries',
  'doctorOrders',
  'healthAssessments',
  'imagingReports',
  'imagingResults',
  'intakeOutput',
  'ivSheet',
  'laboratoryResults',
  'medicationRecords',
  'nursesNotes',
  'vitalSigns',
];

function isPatientRole(value) {
  return String(value || '').trim().toLowerCase() === 'patient';
}

function getPatientDeletionCandidateIds(patient, requestedPatientId) {
  return uniqueIds([
    requestedPatientId,
    getPatientDocumentId(patient),
    patient?.id,
    patient?.docId,
    patient?.documentId,
    patient?.patientDocId,
    patient?.firestoreId,
    patient?.patientId,
    patient?.visiblePatientId,
    patient?.chartId,
    patient?.caseNo,
  ]);
}

async function deleteCollectionDocuments(collectionRef) {
  const snapshot = await getDocs(collectionRef);
  let deletedCount = 0;
  let operationCount = 0;
  let batch = writeBatch(db);

  for (const item of snapshot.docs) {
    batch.delete(item.ref);
    operationCount += 1;
    deletedCount += 1;

    // Firestore batches are limited to 500 writes. Keep a little buffer.
    if (operationCount >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return deletedCount;
}

async function deleteLinkedPatientUserProfiles(patient) {
  const deletedUserIds = new Set();
  const candidatePatientIds = uniqueIds([
    getPatientDocumentId(patient),
    getPatientVisibleId(patient),
    patient?.id,
    patient?.docId,
    patient?.documentId,
    patient?.patientId,
    patient?.visiblePatientId,
    patient?.chartId,
    patient?.caseNo,
  ]);

  const linkedUserIds = uniqueIds([
    patient?.patientUid,
    patient?.patientUserId,
    patient?.authUid,
    patient?.uid,
  ]);

  for (const userId of linkedUserIds) {
    await deleteDoc(doc(db, 'users', userId));
    deletedUserIds.add(userId);
  }

  const emails = uniqueIds([
    patient?.emailAddress,
    patient?.email,
  ]).map((email) => email.toLowerCase());

  for (const email of emails) {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const snapshot = await getDocs(usersQuery);

    for (const item of snapshot.docs) {
      if (deletedUserIds.has(item.id)) continue;

      const data = item.data();
      const linkedIds = uniqueIds([
        data?.linkedPatientId,
        data?.patientId,
        data?.linkedPatientDocId,
        data?.patientDocId,
        data?.visiblePatientId,
      ]);
      const isLinkedToDeletedPatient = linkedIds.some((id) => candidatePatientIds.includes(id));

      if (isPatientRole(data?.role) && isLinkedToDeletedPatient) {
        await deleteDoc(item.ref);
        deletedUserIds.add(item.id);
      }
    }
  }

  return Array.from(deletedUserIds);
}

export async function deletePatientProfile(patientId, { deleteLinkedUserProfile = true } = {}) {
  const requestedPatientId = normalizeId(patientId);
  if (!requestedPatientId) {
    throw new Error('Patient ID is required before deleting a patient.');
  }

  const patient = await loadPatientProfile(requestedPatientId).catch((err) => {
    if (isPermissionError(err)) return null;
    throw err;
  });

  const patientDocumentIds = getPatientDeletionCandidateIds(patient, requestedPatientId);
  let deletedRecordCount = 0;

  for (const patientDocumentId of patientDocumentIds) {
    for (const subcollectionName of PATIENT_RECORD_SUBCOLLECTIONS) {
      deletedRecordCount += await deleteCollectionDocuments(
        getPatientCollectionRef(subcollectionName, patientDocumentId)
      );
    }
  }

  const deletedUserProfileIds = deleteLinkedUserProfile && patient
    ? await deleteLinkedPatientUserProfiles(patient)
    : [];

  for (const patientDocumentId of patientDocumentIds) {
    await deleteDoc(getPatientRootDocRef(patientDocumentId));
  }

  return {
    deletedPatientDocumentIds: patientDocumentIds,
    deletedRecordCount,
    deletedUserProfileIds,
  };
}


async function resolvePatientDocumentIds(patientId) {
  const requestedPatientId = resolvePatientId(patientId);
  if (!requestedPatientId) {
    return {
      patientDocumentIds: [],
      candidateRecordIds: [],
    };
  }

  const ids = [requestedPatientId];
  let patient = null;

  try {
    patient = await loadPatientProfile(requestedPatientId);
    if (patient) {
      ids.push(
        patient.docId,
        patient.documentId,
        patient.patientDocId,
        patient.firestoreId,
        patient.id,
        patient.patientId,
        patient.visiblePatientId,
        patient.chartId,
        patient.caseNo
      );
    }
  } catch (err) {
    if (!isPermissionError(err)) {
      throw err;
    }
  }

  return {
    patientDocumentIds: uniqueIds(ids),
    candidateRecordIds: buildPatientRecordCandidateIds(patient, requestedPatientId),
  };
}

async function loadRowsFromDirectPatientPaths(collectionName, patientDocumentIds) {
  const rows = [];
  const seen = new Set();
  let permissionDeniedCount = 0;
  let successfulReadCount = 0;
  let lastNonPermissionError = null;

  for (const patientDocumentId of patientDocumentIds) {
    try {
      const snapshot = await getDocs(getPatientCollectionRef(collectionName, patientDocumentId));
      successfulReadCount += 1;

      snapshot.docs.forEach((item) => {
        const key = makeCollectionGroupDocKey(item);
        if (seen.has(key)) return;
        seen.add(key);
        rows.push(mapRecordSnapshotDoc(item, patientDocumentId));
      });
    } catch (err) {
      if (isPermissionError(err)) {
        permissionDeniedCount += 1;
      } else {
        lastNonPermissionError = err;
      }
    }
  }

  return {
    rows,
    permissionDeniedCount,
    successfulReadCount,
    lastNonPermissionError,
  };
}

async function loadRowsFromCollectionGroup() {
  // Disabled on purpose.
  //
  // Earlier builds tried to use Firestore collectionGroup fallback queries such as:
  // collectionGroup(db, 'healthAssessments') where('caseNo', '==', ...)
  //
  // Those queries require manual collection-group indexes for every module/field
  // combination and show noisy Firebase "create index" errors in development.
  // The app now reads records directly from the resolved patient document paths
  // instead. This covers both the real Firestore document ID and legacy visible
  // Patient IDs because resolvePatientDocumentIds() already returns both.
  return {
    rows: [],
    permissionDeniedCount: 0,
    successfulReadCount: 0,
    lastNonPermissionError: null,
  };
}


export async function loadPatientRows(
  collectionName,
  {
    patientId,
    sortBy = 'createdAt',
    sortDirection = 'desc',
  } = {}
) {
  const { patientDocumentIds, candidateRecordIds } = await resolvePatientDocumentIds(patientId);
  if (patientDocumentIds.length === 0 && candidateRecordIds.length === 0) return [];

  const directResult = await loadRowsFromDirectPatientPaths(collectionName, patientDocumentIds);
  const rows = [...directResult.rows];

  // Do not run collectionGroup fallback queries by default. They are what caused
  // the Firebase errors like:
  // "The query requires a COLLECTION_GROUP_ASC index ... field caseNo."
  //
  // Direct patient-path reads are safer, faster, and do not require indexes:
  // patients/{patientDocId}/{collectionName}
  // patients/{visiblePatientId}/{collectionName}
  const shouldTryCollectionGroupFallback = false;

  if (shouldTryCollectionGroupFallback && rows.length === 0) {
    const collectionGroupResult = await loadRowsFromCollectionGroup(collectionName, candidateRecordIds);
    const seen = new Set(rows.map((item) => item.__path || `${item.__patientDocumentId}/${item.id}`));

    collectionGroupResult.rows.forEach((item) => {
      const key = item.__path || `${item.__patientDocumentId}/${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    });
  }

  // If we successfully read at least one candidate patient path, an empty result
  // simply means there are no records in those patient subcollections yet.
  if (rows.length === 0 && directResult.successfulReadCount > 0) {
    return [];
  }

  if (rows.length === 0 && directResult.lastNonPermissionError) {
    if (isMissingIndexError(directResult.lastNonPermissionError)) {
      return [];
    }

    throw directResult.lastNonPermissionError;
  }

  if (
    rows.length === 0 &&
    directResult.permissionDeniedCount > 0 &&
    directResult.successfulReadCount === 0
  ) {
    const err = new Error(
      'Firestore rules blocked access to this patient record collection. Allow staff accounts and linked patient accounts to read patient subcollections.'
    );
    err.code = 'permission-denied';
    throw err;
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

  const data = snapshot.data();

  return {
    ...data,
    id: snapshot.id,
    docId: snapshot.id,
    documentId: snapshot.id,
  };
}

export async function savePatientDocument(
  collectionName,
  documentId,
  payload,
  { patientId } = {}
) {
  const requestedPatientId = resolvePatientId(patientId);
  const patient = await loadPatientProfile(requestedPatientId).catch((err) => {
    if (isPermissionError(err)) return null;
    throw err;
  });
  const activePatientId = getPatientDocumentId(patient) || requestedPatientId;
  const visiblePatientId = patient?.patientId || patient?.visiblePatientId || requestedPatientId;

  await setDoc(
    getPatientDocRef(collectionName, documentId, activePatientId),
    {
      ...payload,
      id: String(documentId),
      patientId: activePatientId,
      visiblePatientId,
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
  const requestedPatientId = resolvePatientId(patientId);
  const patient = await loadPatientProfile(requestedPatientId).catch((err) => {
    if (isPermissionError(err)) return null;
    throw err;
  });
  const activePatientId = getPatientDocumentId(patient) || requestedPatientId;

  await deleteDoc(getPatientDocRef(collectionName, documentId, activePatientId));
}
