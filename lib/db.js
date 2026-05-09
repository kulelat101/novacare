'use client';

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export async function saveRecord(collectionName, payload, user) {
  return addDoc(collection(db, collectionName), {
    ...payload,
    recordedBy: user?.email || 'unknown',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchRecent(collectionName, max = 25, sortField = 'createdAt') {
  const q = query(
    collection(db, collectionName),
    orderBy(sortField, 'desc'),
    limit(max),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
