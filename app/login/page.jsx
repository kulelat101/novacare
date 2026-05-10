'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createLoginLog } from '@/lib/audit';
import { getDefaultRoute } from '@/lib/roles';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));

      if (!profileSnap.exists()) {
        await signOut(auth).catch(() => {});
        throw new Error('ACCOUNT_PROFILE_NOT_FOUND');
      }

      const profile = profileSnap.data();

      if (profile?.disabled || profile?.deletedAt) {
        await signOut(auth).catch(() => {});
        throw new Error('ACCOUNT_DISABLED');
      }

      await createLoginLog(credential.user, profile);

      if (profile?.mustChangePassword) {
        router.replace('/change-password');
        return;
      }

      router.replace(getDefaultRoute(profile?.role));
    } catch (err) {
      if (err?.message === 'ACCOUNT_PROFILE_NOT_FOUND') {
        setError('This account is no longer linked to a NovaCare user profile. Please contact hospital staff.');
      } else if (err?.message === 'ACCOUNT_DISABLED') {
        setError('This account has been disabled. Please contact hospital staff.');
      } else {
        setError('Unable to login. Check your Firebase account credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setResetError('');
    setResetMessage('');
    setResetLoading(true);

    try {
      const targetEmail = normalizeEmail(resetEmail || email);

      if (!targetEmail) {
        throw new Error('Please enter your email address.');
      }

      await sendPasswordResetEmail(auth, targetEmail, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: false,
      });
      setResetMessage(
        'Password reset email sent. Open the link in the email, set a new password, then log in again.'
      );
    } catch (err) {
      if (err?.message === 'Please enter your email address.') {
        setResetError(err.message);
      } else if (err?.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else {
        setResetError('Unable to send password help email. Please check the email address and try again.');
      }
    } finally {
      setResetLoading(false);
    }
  }

  function openForgotPassword() {
    setResetEmail(normalizeEmail(email));
    setResetError('');
    setResetMessage('');
    setShowForgotPassword(true);
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Need users?{' '}
              <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the account email address. NovaCare will email a secure password reset link to that account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="mt-5 space-y-4" autoComplete="off">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="off"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  placeholder=""
                  required
                />
              </div>

              {resetError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resetError}
                </p>
              )}

              {resetMessage && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {resetMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetLoading ? 'Sending...' : 'Send Password Reset Email'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>    

  );
}
