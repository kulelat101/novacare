'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { auth, db } from '@/lib/firebase';
import { getDefaultRoute } from '@/lib/roles';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!user?.email || !auth.currentUser) {
      setError('Please log in again before changing your password.');
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

    if (currentPassword === newPassword) {
      setError('New password must be different from the current temporary password.');
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      await updateDoc(doc(db, 'users', user.uid), {
        mustChangePassword: false,
        passwordChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await refreshProfile();
      setMessage('Password changed successfully. Redirecting...');
      router.replace(getDefaultRoute(profile?.role));
    } catch (err) {
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        setError('Current password is incorrect.');
      } else if (err?.code === 'auth/weak-password') {
        setError('New password is too weak. Please use a stronger password.');
      } else if (err?.code === 'auth/requires-recent-login') {
        setError('Please log out, log in again, then change your password.');
      } else {
        setError('Unable to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.replace('/login');
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-cyan-800/90 via-cyan-600 to-slate-900 p-4">
        <div className="flex min-h-[calc(100vh-1rem)] items-center justify-center rounded-[2rem] bg-white px-6 py-12">
          <div className="w-full max-w-md">
            <div className="text-center">
              <img
                src="/images/novacare-icon.png"
                alt="NovaCare Icon"
                className="mx-auto h-16 w-16 object-contain"
              />
              <h1 className="mt-5 text-3xl font-bold text-slate-900">Change Password</h1>
              <p className="mt-2 text-sm text-slate-500">
                {profile?.mustChangePassword
                  ? 'For security, please replace the temporary password before continuing.'
                  : 'Update your account password below.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" autoComplete="off">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Current Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  placeholder=""
                  required
                />
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Change Password'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Logout Instead
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
