'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ROLES } from '@/lib/roles';
import {
  clearStoredActivePatientId,
  getStoredActivePatientId,
  loadPatientProfile,
  loadPatients,
  savePatientProfile,
  setStoredActivePatientId,
} from '@/lib/patientFirestore';
import { useAuth } from './AuthProvider';

const PatientContext = createContext(null);

function getPatientDocId(patient) {
  return patient?.docId || patient?.id || patient?.patientId || '';
}

export function formatPatientName(patient) {
  if (!patient) return 'No patient selected';

  if (patient.fullName) return patient.fullName;

  const firstName = patient.firstName || patient.First_Name || '';
  const middleName = patient.middleName || '';
  const lastName = patient.lastName || patient.Last_Name || '';

  const fullName = [firstName, middleName, lastName]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');

  if (fullName) return fullName;

  return patient.name || patient.patientName || patient.patientId || patient.id || 'Unnamed Patient';
}

export function getPatientRoomWard(patient) {
  if (!patient) return '—';

  const room = patient.roomNo || patient.roomNumber || patient.room || '';
  const ward = patient.ward || patient.unit || 'Medical Ward';

  if (room && ward) return `${room} / ${ward}`;
  return room || ward || '—';
}

export function getPatientDiagnosis(patient) {
  if (!patient) return '—';
  return patient.primaryDiagnosis || patient.admittingDx || patient.finalDiagnosis || '—';
}

function getLinkedPatientId(profile) {
  return profile?.linkedPatientId || profile?.patientId || '';
}

export function PatientProvider({ children }) {
  const { user, profile, loading } = useAuth();
  const [activePatientId, setActivePatientId] = useState('');
  const [activePatient, setActivePatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientError, setPatientError] = useState('');

  const isPatientUser = profile?.role === ROLES.PATIENT;
  const linkedPatientId = getLinkedPatientId(profile);

  const refreshPatients = useCallback(async () => {
    if (!user || loading) {
      setPatients([]);
      setActivePatient(null);
      setActivePatientId('');
      setLoadingPatients(false);
      return [];
    }

    setLoadingPatients(true);
    setPatientError('');

    try {
      if (isPatientUser) {
        if (!linkedPatientId) {
          clearStoredActivePatientId();
          setPatients([]);
          setActivePatient(null);
          setActivePatientId('');
          setPatientError('No patient chart is linked to this account yet.');
          return [];
        }

        const profileRow = await loadPatientProfile(linkedPatientId);
        const patientRows = profileRow ? [profileRow] : [];
        const resolvedPatientId = getPatientDocId(profileRow) || linkedPatientId;

        setStoredActivePatientId(resolvedPatientId);
        setActivePatientId(resolvedPatientId);
        setActivePatient(profileRow);
        setPatients(patientRows);

        if (!profileRow) {
          setPatientError('The linked patient chart could not be found.');
        }

        return patientRows;
      }

      const rows = await loadPatients();
      setPatients(rows);
      return rows;
    } catch (err) {
      console.error(err);
      setPatientError('Failed to load patient list.');
      return [];
    } finally {
      setLoadingPatients(false);
    }
  }, [user, loading, isPatientUser, linkedPatientId]);

  const refreshActivePatient = useCallback(async (patientId = activePatientId) => {
    if (!user || loading || !patientId) {
      setActivePatient(null);
      return null;
    }

    const isLinkedPatientLookup = patientId === linkedPatientId
      || patientId === activePatient?.patientId
      || patientId === getPatientDocId(activePatient);

    if (isPatientUser && !isLinkedPatientLookup) {
      setPatientError('This patient account is not allowed to open another chart.');
      return null;
    }

    try {
      const profileRow = await loadPatientProfile(patientId);
      const resolvedPatientId = getPatientDocId(profileRow) || patientId;

      if (resolvedPatientId !== patientId) {
        setStoredActivePatientId(resolvedPatientId);
        setActivePatientId(resolvedPatientId);
      }

      setActivePatient(profileRow);
      return profileRow;
    } catch (err) {
      console.error(err);
      setPatientError('Failed to load active patient details.');
      setActivePatient(null);
      return null;
    }
  }, [activePatientId, user, loading, isPatientUser, linkedPatientId, activePatient]);

  const selectPatient = useCallback(async (patientOrId) => {
    const patientId = typeof patientOrId === 'string'
      ? patientOrId
      : getPatientDocId(patientOrId);

    if (!patientId) return null;

    const isLinkedPatientSelection = patientId === linkedPatientId
      || patientId === activePatient?.patientId
      || patientId === getPatientDocId(activePatient);

    if (isPatientUser && !isLinkedPatientSelection) {
      setPatientError('This patient account is not allowed to select another chart.');
      return null;
    }

    setStoredActivePatientId(patientId);
    setActivePatientId(patientId);

    const existingPatient = typeof patientOrId === 'object' ? patientOrId : null;
    if (existingPatient) {
      setActivePatient(existingPatient);
      return existingPatient;
    }

    return refreshActivePatient(patientId);
  }, [refreshActivePatient, isPatientUser, linkedPatientId, activePatient]);

  const clearActivePatient = useCallback(() => {
    clearStoredActivePatientId();
    setActivePatientId('');
    setActivePatient(null);
  }, []);

  const createPatient = useCallback(async (patientPayload, { makeActive = true } = {}) => {
    const id = await savePatientProfile(patientPayload.patientId, patientPayload);
    const rows = await refreshPatients();
    const created = rows.find((patient) => patient.docId === id || patient.id === id || patient.patientId === id) || {
      ...patientPayload,
      docId: id,
      id,
      patientId: patientPayload.patientId || id,
    };

    if (makeActive) {
      await selectPatient(created);
    }

    return created;
  }, [refreshPatients, selectPatient]);

  useEffect(() => {
    let mounted = true;

    async function hydratePatientContext() {
      if (loading) return;

      if (!user) {
        clearActivePatient();
        setPatients([]);
        setLoadingPatients(false);
        return;
      }

      if (isPatientUser) {
        if (!linkedPatientId) {
          clearActivePatient();
          setPatients([]);
          setPatientError('No patient chart is linked to this account yet.');
          setLoadingPatients(false);
          return;
        }

        setLoadingPatients(true);
        setPatientError('');
        setStoredActivePatientId(linkedPatientId);
        setActivePatientId(linkedPatientId);

        const profileRow = await loadPatientProfile(linkedPatientId).catch((err) => {
          console.error(err);
          setPatientError('Failed to load linked patient details.');
          return null;
        });

        if (mounted) {
          const resolvedPatientId = getPatientDocId(profileRow) || linkedPatientId;
          setStoredActivePatientId(resolvedPatientId);
          setActivePatientId(resolvedPatientId);
          setActivePatient(profileRow);
          setPatients(profileRow ? [profileRow] : []);
          setLoadingPatients(false);
        }

        return;
      }

      const storedPatientId = getStoredActivePatientId();
      setActivePatientId(storedPatientId);
      refreshPatients();

      if (!storedPatientId) {
        setActivePatient(null);
        return;
      }

      const profileRow = await loadPatientProfile(storedPatientId).catch((err) => {
        console.error(err);
        setPatientError('Failed to load active patient details.');
        return null;
      });

      if (mounted) {
        const resolvedPatientId = getPatientDocId(profileRow) || storedPatientId;
        if (resolvedPatientId !== storedPatientId) {
          setStoredActivePatientId(resolvedPatientId);
          setActivePatientId(resolvedPatientId);
        }
        setActivePatient(profileRow);
      }
    }

    hydratePatientContext();

    return () => {
      mounted = false;
    };
  }, [user, loading, profile, isPatientUser, linkedPatientId, clearActivePatient, refreshPatients]);

  const value = useMemo(() => ({
    activePatient,
    activePatientId,
    patients,
    loadingPatients,
    patientError,
    hasActivePatient: Boolean(activePatientId),
    refreshPatients,
    refreshActivePatient,
    selectPatient,
    clearActivePatient,
    createPatient,
  }), [
    activePatient,
    activePatientId,
    patients,
    loadingPatients,
    patientError,
    refreshPatients,
    refreshActivePatient,
    selectPatient,
    clearActivePatient,
    createPatient,
  ]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used within PatientProvider');
  return ctx;
}
