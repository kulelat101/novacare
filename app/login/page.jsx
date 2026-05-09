'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createLoginLog } from '@/lib/audit';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : { role: 'nurse', fullName: 'Nurse' };
      await createLoginLog(credential.user, profile.role, profile.fullName);
      router.replace('/patients/select');
    } catch (err) {
      setError('Unable to login. Check your Firebase account credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-800/90 via-cyan-600 to-slate-900 p-4">
      <div className="min-h-[calc(100vh-1rem)] overflow-hidden rounded-[2rem] bg-white lg:grid lg:grid-cols-2">
        
        {/* Branding section */}
        <section className="flex flex-col items-center justify-center bg-cyan-600 px-6 py-12 text-center text-white lg:min-h-[calc(100vh-1rem)] lg:px-10">
          <img
            src="/images/novacare-logo.png"
            alt="NovaCare Logo"
            className="h-48 w-auto object-contain sm:h-56 lg:h-72 xl:h-80"
          />

          <p className="mt-6 text-2xl font-bold tracking-wide text-white sm:text-3xl lg:mt-8 lg:text-3xl">
            Where Care Meets Innovation
          </p>
        </section>

        {/* Login form section */}
        <section className="flex items-center justify-center bg-white px-6 py-12 lg:min-h-[calc(100vh-1rem)] lg:px-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-slate-900">
              Sign in
            </h1>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" autoComplete="off">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  placeholder=""
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  placeholder=""
                  required
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Need users?{" "}
              <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Create account
              </Link>
            </p>
          </div>
        </section>

      </div>
    </main>    

  );
}
