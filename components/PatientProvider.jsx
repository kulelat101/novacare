'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

export function PatientProvider({ children }) {
  const { user } = useAuth();
  const [activePatientId, setActivePatientId] = useState('');
  const [activePatient, setActivePatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientError, setPatientError] = useState('');

  const refreshPatients = useCallback(async () => {
    if (!user) {
      setPatients([]);
      setActivePatient(null);
      setActivePatientId('');
      setLoadingPatients(false);
      return [];
    }

    setLoadingPatients(true);
    setPatientError('');

    try {
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
  }, [user]);

  const refreshActivePatient = useCallback(async (patientId = activePatientId) => {
    if (!user || !patientId) {
      setActivePatient(null);
      return null;
    }

    try {
      const profile = await loadPatientProfile(patientId);
      setActivePatient(profile);
      return profile;
    } catch (err) {
      console.error(err);
      setPatientError('Failed to load active patient details.');
      setActivePatient(null);
      return null;
    }
  }, [activePatientId, user]);

  const selectPatient = useCallback(async (patientOrId) => {
    const patientId = typeof patientOrId === 'string'
      ? patientOrId
      : patientOrId?.patientId || patientOrId?.id;

    if (!patientId) return null;

    setStoredActivePatientId(patientId);
    setActivePatientId(patientId);

    const existingPatient = typeof patientOrId === 'object' ? patientOrId : null;
    if (existingPatient) {
      setActivePatient(existingPatient);
      return existingPatient;
    }

    return refreshActivePatient(patientId);
  }, [refreshActivePatient]);

  const clearActivePatient = useCallback(() => {
    clearStoredActivePatientId();
    setActivePatientId('');
    setActivePatient(null);
  }, []);

  const createPatient = useCallback(async (patientPayload, { makeActive = true } = {}) => {
    const id = await savePatientProfile(patientPayload.patientId, patientPayload);
    const rows = await refreshPatients();
    const created = rows.find((patient) => patient.id === id || patient.patientId === id) || {
      ...patientPayload,
      id,
      patientId: id,
    };

    if (makeActive) {
      await selectPatient(created);
    }

    return created;
  }, [refreshPatients, selectPatient]);

  useEffect(() => {
    let mounted = true;

    async function hydratePatientContext() {
      if (!user) {
        clearActivePatient();
        setPatients([]);
        setLoadingPatients(false);
        return;
      }

      const storedPatientId = getStoredActivePatientId();
      setActivePatientId(storedPatientId);
      refreshPatients();

      if (!storedPatientId) {
        setActivePatient(null);
        return;
      }

      const profile = await loadPatientProfile(storedPatientId).catch((err) => {
        console.error(err);
        setPatientError('Failed to load active patient details.');
        return null;
      });

      if (mounted) {
        setActivePatient(profile);
      }
    }

    hydratePatientContext();

    return () => {
      mounted = false;
    };
  }, [user, clearActivePatient, refreshPatients]);

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
