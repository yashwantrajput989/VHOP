import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logToBackend } from '../lib/logger';
import { API_BASE_URL } from '../config';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string;
  role: 'user' | 'admin' | 'superadmin' | 'subadmin';
  v_coins: number;
  city?: string;
  phone?: string;
  onboarded?: boolean;
  interests?: string[];
  age?: number;
  address?: string;
  v_coins_rewarded?: boolean;
  gender?: string;
  referred_by?: string;
  referral_rewarded?: boolean;
  parent_admin_id?: string;
  streak_count?: number;
  streak_updated_at?: string;
  last_action_date?: string;
  nights_out?: number;
  referred_count?: number;
  aadhaar_verified?: boolean;
  vip_tier?: string;
  music_dna_edm?: number;
  music_dna_bollywood?: number;
  music_dna_live?: number;
  birthday?: string;
}

const sanitizeUser = (user: any): UserProfile | null => {
  if (!user) return null;
  
  let interests: string[] = [];
  if (Array.isArray(user.interests)) {
    interests = user.interests;
  } else if (typeof user.interests === 'string') {
    try {
      const parsed = JSON.parse(user.interests);
      if (Array.isArray(parsed)) {
        interests = parsed;
      } else {
        interests = [user.interests];
      }
    } catch (e) {
      interests = user.interests.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  
  return {
    ...user,
    interests,
    onboarded: user.onboarded === 1 || user.onboarded === true || user.onboarded === 'true',
    v_coins_rewarded: user.v_coins_rewarded === 1 || user.v_coins_rewarded === true || user.v_coins_rewarded === 'true',
    referral_rewarded: user.referral_rewarded === 1 || user.referral_rewarded === true || user.referral_rewarded === 'true',
    aadhaar_verified: user.aadhaar_verified === 1 || user.aadhaar_verified === true || user.aadhaar_verified === 'true',
  };
};

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
      setUser: (user) => set({ user: sanitizeUser(user) }),
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
          set({ user: sanitizeUser(superUser), session: { uid: superUser.id }, isLoading: false });
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
          const authorized = (role === 'admin' && (profile.role === 'admin' || profile.role === 'subadmin')) || (profile.role === role);
          if (!authorized) {
            throw new Error(`Unauthorized. This account is registered as a ${profile.role}.`);
          }

          set({ user: sanitizeUser(profile), session: { uid: profile.id }, isLoading: false });
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
          const referredBy = localStorage.getItem('referred_by_code');
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, referred_by_code: referredBy || undefined })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Login failed');
          }

          const profile = await response.json();
          localStorage.removeItem('referred_by_code');
          set({ user: sanitizeUser(profile), session: { uid: profile.id }, isLoading: false });
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
          const referredBy = localStorage.getItem('referred_by_code');
          const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName, referred_by_code: referredBy || undefined })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Registration failed');
          }

          const profile = await response.json();
          localStorage.removeItem('referred_by_code');
          set({ user: sanitizeUser(profile), session: { uid: profile.id }, isLoading: false });
          logToBackend('signup_email_success', profile);
          return profile;
        } catch (error: any) {
          set({ isLoading: false });
          logToBackend('signup_email_error', null, { error: error.message });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;

          if (!firebaseUser.email) {
            throw new Error('Google Sign-in did not return an email.');
          }

          const referredBy = localStorage.getItem('referred_by_code');
          
          const profileData = {
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || 'Google User',
            avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
            id: firebaseUser.uid,
            referred_by_code: referredBy || undefined
          };

          const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Google login sync failed');
          }

          const profile = await response.json();
          localStorage.removeItem('referred_by_code');
          set({ user: sanitizeUser(profile), session: { uid: profile.id }, isLoading: false });
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
            set({ user: sanitizeUser(user), session: { uid: user.id } });
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
