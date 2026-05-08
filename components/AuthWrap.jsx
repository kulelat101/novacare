'use client';

import { AuthProvider } from './AuthProvider';

export default function AuthWrap({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
