'use client';

import { AuthProvider } from './AuthProvider';
import { PatientProvider } from './PatientProvider';

export default function AuthWrap({ children }) {
  return (
    <AuthProvider>
      <PatientProvider>{children}</PatientProvider>
    </AuthProvider>
  );
}
