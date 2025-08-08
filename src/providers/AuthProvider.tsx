// providers/AuthProvider.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { createContext, useContext } from 'react';

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
