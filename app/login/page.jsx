'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createLoginLog } from '@/lib/audit';
import { getDefaultRoute } from '@/lib/roles';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('nurse@novacare.demo');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : { role: 'nurse', fullName: 'Demo Nurse' };
      await createLoginLog(credential.user, profile.role, profile.fullName);
      router.replace(getDefaultRoute(profile.role));
    } catch (err) {
      setError('Unable to login. Check your Firebase account credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-700 via-cyan-600 to-slate-900 p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-cyan-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-cyan-700">N</div>
            <h1 className="text-4xl font-black leading-tight">NovaCare HIS</h1>
            <p className="mt-4 max-w-md text-cyan-50">A BSN210 nursing informatics demo system for registration, monitoring, orders, diagnostics, billing, and discharge workflows.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 text-sm text-cyan-50 ring-1 ring-white/20">
            This is an academic demonstration. Authentication and records are powered by Firebase for temporary testing and presentation only.
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Secure Demo Access</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Use Firebase email/password accounts for nurse, doctor, or patient roles.</p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <button disabled={loading} className="btn-primary mt-6 w-full py-3" type="submit">
              {loading ? 'Signing in...' : 'Login'}
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              Need demo users? <Link className="font-semibold text-cyan-700" href="/signup">Create account</Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
