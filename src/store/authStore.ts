import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logToBackend } from '../lib/logger';
import { API_BASE_URL } from '../config';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string;
  role: 'user' | 'admin' | 'superadmin';
  v_coins: number;
  city?: string;
  phone?: string;
  onboarded?: boolean;
  interests?: string[];
  age?: number;
  address?: string;
  v_coins_rewarded?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isInitializing: boolean;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  loginWithGoogle: (email?: string) => Promise<UserProfile>;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  registerWithEmail: (email: string, password: string, fullName: string) => Promise<UserProfile>;
  loginAdmin: (email: string, password: string, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      isInitializing: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      loginAdmin: async (email, password, role) => {
        set({ isLoading: true });
        
        // Superadmin bypass
        if (role === 'superadmin' && password === 'vhop1234') {
          const superUser: UserProfile = {
            id: 'super-admin-root',
            full_name: 'Super Admin',
            username: 'superadmin',
            email: email || 'superadmin@vhop.in',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
            role: 'superadmin',
            v_coins: 99999,
            city: 'Mumbai',
            onboarded: true
          };
          set({ user: superUser, session: { uid: superUser.id }, isLoading: false });
          logToBackend('admin_login_success', { role });
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Login failed');
          }

          const profile = await response.json();
          if (profile.role !== role) {
            throw new Error(`Unauthorized. This account is registered as a ${profile.role}.`);
          }

          set({ user: profile, session: { uid: profile.id }, isLoading: false });
          logToBackend('admin_login_success', profile);
        } catch (error: any) {
          set({ isLoading: false });
          logToBackend('admin_login_error', null, { error: error.message });
          throw error;
        }
      },

      loginWithEmail: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Login failed');
          }

          const profile = await response.json();
          set({ user: profile, session: { uid: profile.id }, isLoading: false });
          logToBackend('login_email_success', profile);
          return profile;
        } catch (error: any) {
          set({ isLoading: false });
          logToBackend('login_email_error', null, { error: error.message });
          throw error;
        }
      },

      registerWithEmail: async (email, password, fullName) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Registration failed');
          }

          const profile = await response.json();
          set({ user: profile, session: { uid: profile.id }, isLoading: false });
          logToBackend('signup_email_success', profile);
          return profile;
        } catch (error: any) {
          set({ isLoading: false });
          logToBackend('signup_email_error', null, { error: error.message });
          throw error;
        }
      },

      loginWithGoogle: async (email) => {
        set({ isLoading: true });
        try {
          const googleEmail = email || `google_${Math.random().toString(36).substring(2, 7)}@gmail.com`;
          const googleName = googleEmail.split('@')[0].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Google User';
          
          const profileData = {
            email: googleEmail,
            full_name: googleName,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleEmail}`,
            id: `g_${Math.random().toString(36).substring(2, 15)}`
          };

          const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Google login failed');
          }

          const profile = await response.json();
          set({ user: profile, session: { uid: profile.id }, isLoading: false });
          logToBackend('google_login_success', profile);
          return profile;
        } catch (error: any) {
          set({ isLoading: false });
          logToBackend('google_login_error', null, { error: error.message });
          throw error;
        }
      },

      logout: async () => {
        const currentUser = useAuthStore.getState().user;
        logToBackend('logout', currentUser);
        set({ user: null, session: null });
      },

      initialize: async () => {
        set({ isInitializing: true });
        try {
          const { user } = useAuthStore.getState();
          if (user) {
            set({ user, session: { uid: user.id } });
          }
        } finally {
          set({ isInitializing: false, isLoading: false });
        }
      },
    }),
    {
      name: 'vhop-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
