'use client';

import { useState } from 'react';
import { saveRecord } from '@/lib/db';
import { useAuth } from './AuthProvider';

export default function RecordForm({ collectionName, fields }) {
  const { user } = useAuth();
  const initialValues = fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {});
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  function updateValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await saveRecord(collectionName, values, user);
      setStatus('Saved successfully.');
      setValues(initialValues);
    } catch (error) {
      setStatus('Unable to save. Please check Firebase configuration and Firestore rules.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label className="label">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea className="input min-h-28" value={values[field.name]} onChange={(e) => updateValue(field.name, e.target.value)} required={field.required} />
            ) : field.type === 'select' ? (
              <select className="input" value={values[field.name]} onChange={(e) => updateValue(field.name, e.target.value)} required={field.required}>
                <option value="">Select</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input className="input" type={field.type || 'text'} value={values[field.name]} onChange={(e) => updateValue(field.name, e.target.value)} required={field.required} />
            )}
          </div>
        ))}
      </div>

      {status && <p className="mt-4 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-800">{status}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => setValues(initialValues)}>Clear</button>
        <button className="btn-primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save Record'}</button>
      </div>
    </form>
  );
}
