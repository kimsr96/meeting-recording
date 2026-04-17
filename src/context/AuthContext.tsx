import React, { createContext, useContext } from 'react';
import { UserProfile } from '../types';

const GUEST_USER = {
  uid: 'guest-user',
  email: 'guest@fb-insight.com',
  displayName: '게스트',
  photoURL: '',
} as any;

const GUEST_PROFILE: UserProfile = {
  uid: 'guest-user',
  email: 'guest@fb-insight.com',
  displayName: '게스트',
  photoURL: '',
  role: 'staff',
  createdAt: null as any,
};

interface AuthContextType {
  user: typeof GUEST_USER;
  profile: UserProfile;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: GUEST_USER, profile: GUEST_PROFILE, loading: false });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: GUEST_USER, profile: GUEST_PROFILE, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
