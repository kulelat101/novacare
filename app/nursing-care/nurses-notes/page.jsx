'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import {
  addPatientRecord,
  clearPatientCollection,
  deletePatientDocument,
  getLocalDate,
  getLocalTime,
  loadPatientRows,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'nursesNotes';

const emptyForm = {
  date: '',
  time: '',
  shift: 'AM (6-2)',
  assessment: '',
  diagnosis: '',
  interventions: '',
  evaluation: '',
  nurse: '',
};

function createFreshForm() {
  return {
    ...emptyForm,
    date: getLocalDate(),
    time: getLocalTime(),
  };
}

export default function NursesNotesPage() {
  const [form, setForm] = useState(createFreshForm());
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const savedNotes = await loadPatientRows(COLLECTION_NAME, {
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      setNotes(savedNotes);
    } catch (err) {
      console.error(err);
      setError("Failed to load nurse's notes from Firestore.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearForm = () => {
    setForm(createFreshForm());
    setMessage('');
    setError('');
  };

  const saveNote = async () => {
    if (!form.assessment && !form.diagnosis && !form.interventions && !form.evaluation) {
      setError('Please enter at least one note detail before saving.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await addPatientRecord(COLLECTION_NAME, form);
      setMessage("Nurse's note saved to Firestore.");
      setForm(createFreshForm());
      await loadNotes();
    } catch (err) {
      console.error(err);
      setError("Failed to save nurse's note.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (id) => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await deletePatientDocument(COLLECTION_NAME, id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setMessage("Nurse's note deleted.");
    } catch (err) {
      console.error(err);
      setError("Failed to delete nurse's note.");
    } finally {
      setIsSaving(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all nurse's notes for this patient?")) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await clearPatientCollection(COLLECTION_NAME);
      setNotes([]);
      setMessage("All nurse's notes cleared.");
    } catch (err) {
      console.error(err);
      setError("Failed to clear nurse's notes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Nurse's Notes" subtitle="Restricted nursing documentation">
      <div className="pb-36">
        <PageIntro
          title="APIE Nurse's Notes"
          description="Document structured nursing notes and interventions."
        />

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">New Note Entry</h2>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Shift</label>
                <select
                  value={form.shift}
                  onChange={(e) => handleChange('shift', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                >
                  <option>AM (6-2)</option>
                  <option>PM (2-10)</option>
                  <option>NIGHT (10-6)</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  A — Assessment (Subjective & Objective)
                </label>
                <textarea
                  rows={4}
                  value={form.assessment}
                  onChange={(e) => handleChange('assessment', e.target.value)}
                  placeholder=""
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  P — Problem / Nursing Diagnosis
                </label>
                <textarea
                  rows={3}
                  value={form.diagnosis}
                  onChange={(e) => handleChange('diagnosis', e.target.value)}
                  placeholder=""
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  I — Interventions
                </label>
                <textarea
                  rows={4}
                  value={form.interventions}
                  onChange={(e) => handleChange('interventions', e.target.value)}
                  placeholder=""
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">E — Evaluation</label>
                <textarea
                  rows={3}
                  value={form.evaluation}
                  onChange={(e) => handleChange('evaluation', e.target.value)}
                  placeholder=""
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Nurse's Signature / Initials
                </label>
                <input
                  type="text"
                  value={form.nurse}
                  onChange={(e) => handleChange('nurse', e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Saved Notes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isLoading ? 'Loading from Firestore...' : 'Newest notes appear first.'}
                </p>
              </div>

              <button
                type="button"
                onClick={clearAll}
                disabled={isLoading || isSaving || notes.length === 0}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear All
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <div className="mb-2 text-5xl">📋</div>
                <p className="font-medium text-slate-700">No notes saved yet.</p>
                <p className="mt-1 text-sm text-slate-500">Fill in the form above and save an entry.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {note.date} {note.time}
                      </span>

                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {note.shift}
                      </span>

                      {note.nurse && <span className="text-sm text-slate-500">by {note.nurse}</span>}

                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        disabled={isSaving}
                        className="ml-auto rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Assessment</p>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.assessment || '—'}</p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Problem / Diagnosis</p>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.diagnosis || '—'}</p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Interventions</p>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.interventions || '—'}</p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Evaluation</p>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.evaluation || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>


        <div className="fixed bottom-6 left-4 right-4 z-40 lg:left-72 lg:right-0">
          <div className="action-shell">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-slate-800">Nurse's Notes</p>
                <p className="text-xs text-slate-500">Patient-scoped documentation saved in Firestore.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear Form
                </button>

                <button
                  type="button"
                  onClick={saveNote}
                  disabled={isSaving}
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
