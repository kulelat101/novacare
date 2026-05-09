'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function getFirebaseResetParams() {
  if (typeof window === 'undefined') {
    return { mode: '', oobCode: '' };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    mode: params.get('mode') || '',
    oobCode: params.get('oobCode') || '',
  };
}

export default function FirebasePasswordResetPage() {
  const [checking, setChecking] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkResetLink() {
      setChecking(true);
      setError('');
      setMessage('');

      try {
        const params = getFirebaseResetParams();

        if (params.mode !== 'resetPassword' || !params.oobCode) {
          throw new Error('INVALID_RESET_LINK');
        }

        const email = await verifyPasswordResetCode(auth, params.oobCode);

        if (!mounted) return;
        setAccountEmail(email);
        setOobCode(params.oobCode);
      } catch (err) {
        if (!mounted) return;
        setError('This password reset link is invalid or already expired. Please request a new password reset email.');
      } finally {
        if (mounted) setChecking(false);
      }
    }

    checkResetLink();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!oobCode) {
      setError('This password reset link is invalid or already expired. Please request a new password reset email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('Password reset successfully. You can now log in using your new password.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err?.code === 'auth/weak-password') {
        setError('New password is too weak. Please use a stronger password.');
      } else if (err?.code === 'auth/expired-action-code') {
        setError('This password reset link has expired. Please request a new password reset email.');
      } else if (err?.code === 'auth/invalid-action-code') {
        setError('This password reset link is invalid or already used. Please request a new password reset email.');
      } else {
        setError('Unable to reset password. Please request a new password reset email and try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-800/90 via-cyan-600 to-slate-900 p-4">
      <div className="flex min-h-[calc(100vh-1rem)] items-center justify-center rounded-[2rem] bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <img
              src="/images/novacare-icon.png"
              alt="NovaCare Icon"
              className="mx-auto h-16 w-16 object-contain"
            />
            <h1 className="mt-5 text-3xl font-bold text-slate-900">Reset Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter a new password for your NovaCare account.
            </p>
          </div>

          {checking ? (
            <p className="mt-8 rounded-xl bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
              Checking reset link...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" autoComplete="off">
              {accountEmail && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={accountEmail}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                    placeholder=""
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  placeholder=""
                  required
                  disabled={Boolean(message)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  placeholder=""
                  required
                  disabled={Boolean(message)}
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </p>
              )}

              {!message && (
                <button
                  type="submit"
                  disabled={saving || Boolean(error && !oobCode)}
                  className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Reset Password'}
                </button>
              )}

              <Link
                href="/login"
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
