'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ROLES } from '@/lib/roles';

const ALLOWED_SIGNUP_ROLES = [ROLES.DOCTOR, ROLES.NURSE];

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const selectedRole = String(role || '').trim().toLowerCase();
    if (!ALLOWED_SIGNUP_ROLES.includes(selectedRole)) {
      setError('Please select Doctor or Nurse. Patient accounts must be created from Patient Registration.');
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
      await updateProfile(credential.user, { displayName: fullName });
      await setDoc(doc(db, 'users', credential.user.uid), {
        fullName,
        email: normalizeEmail(email),
        role: selectedRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.replace('/login');
    } catch (err) {
      setError(err.message || 'Unable to create user.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-lg p-6 sm:p-8" autoComplete="off">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">NovaCare</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Create an account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create staff accounts only. Patient portal accounts are created from Patient Registration.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value=""></option>
              <option value={ROLES.DOCTOR}>Doctor</option>
              <option value={ROLES.NURSE}>Nurse</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button disabled={loading} className="btn-primary mt-6 w-full py-3" type="submit">
          {loading ? 'Creating...' : 'Create account'}
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-semibold text-cyan-700" href="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
