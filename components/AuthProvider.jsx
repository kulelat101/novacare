'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setProfile(null);
      return null;
    }

    const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userProfile = userSnap.exists() ? userSnap.data() : null;
    setProfile(userProfile);
    return userProfile;
  }, []);

  const refreshProfile = useCallback(async () => loadProfile(auth.currentUser), [loadProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        await loadProfile(firebaseUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const value = useMemo(
    () => ({ user, profile, loading, refreshProfile }),
    [user, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
