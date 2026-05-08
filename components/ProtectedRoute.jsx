'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { canAccess, getDefaultRoute } from '@/lib/roles';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const role = profile?.role;
    if (role && !canAccess(role, pathname)) {
      router.replace(getDefaultRoute(role));
    }
  }, [loading, user, profile, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
          <p className="text-sm text-slate-600">Loading NovaCare HIS...</p>
        </div>
      </div>
    );
  }

  return children;
}
