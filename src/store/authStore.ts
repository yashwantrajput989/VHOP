import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, googleProvider, db, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logToBackend } from '../lib/logger';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

let confirmationResult: any = null;

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
}

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isInitializing: boolean;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  loginWithGoogle: () => Promise<UserProfile | void>;
  loginAdmin: (role: 'admin' | 'superadmin', password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string, fullName?: string) => Promise<void>;
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
      
      loginAdmin: async (role, password) => {
        set({ isLoading: true });
        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (password === 'vhop1234') {
          set({
            user: {
              id: `mock-${role}-123`,
              full_name: role === 'admin' ? 'Admin User' : 'Super Admin',
              username: role,
              email: `${role}@vhop.in`,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`,
              role: role,
              v_coins: 9999,
              city: 'Mumbai',
            },
            isLoading: false,
            session: { user: { id: `mock-${role}-123` } }
          });
          logToBackend('admin_login_success', { role });
        } else {
          set({ isLoading: false });
          logToBackend('admin_login_failed', { role });
          throw new Error('Invalid password');
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          // If firebase is not configured with actual keys, use dummy login
          if (auth.app.options.apiKey === 'dummy_api_key') {
             await new Promise(resolve => setTimeout(resolve, 1000));
             set({ 
                user: {
                  id: 'mock-google-123',
                  full_name: 'Google User',
                  username: 'googleuser',
                  email: 'demo@google.com',
                  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
                  role: 'user',
                  v_coins: 1000,
                  city: 'Mumbai',
                },
                isLoading: false,
                session: { user: { id: 'mock-google-123' } }
              });
            return;
          }

          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;
          
          // Check if profile exists with a timeout/resiliency
          let profile: UserProfile;
          try {
            const userDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
            if (userDoc.exists()) {
              profile = userDoc.data() as UserProfile;
            } else {
              // Create new profile
              profile = {
                id: firebaseUser.uid,
                full_name: firebaseUser.displayName || 'Google User',
                username: firebaseUser.email?.split('@')[0] || `user${firebaseUser.uid.substring(0,5)}`,
                email: firebaseUser.email || '',
                avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                role: 'user',
                v_coins: 500,
                city: 'Mumbai',
                phone: ''
              };
              try {
                await setDoc(doc(db, 'profiles', firebaseUser.uid), profile);
              } catch (e) {
                console.warn('Failed to save profile to Firestore, continuing with local profile:', e);
              }
            }
          } catch (e) {
            console.warn('Firestore unreachable, using auth data for profile:', e);
            // Fallback profile if Firestore is offline
            profile = {
              id: firebaseUser.uid,
              full_name: firebaseUser.displayName || 'User',
              username: firebaseUser.email?.split('@')[0] || 'user',
              email: firebaseUser.email || '',
              avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              role: 'user',
              v_coins: 500,
              city: 'Mumbai',
            };
          }
          
          set({ user: profile, session: firebaseUser, isLoading: false });
          logToBackend('google_login_success', profile);
          return profile;
        } catch (error: any) {
          console.error('Error logging in with Google:', error);
          logToBackend('google_login_error', null, { error: error.message });
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithPhone: async (phone: string) => {
        set({ isLoading: true });
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
            });
          }
          const appVerifier = window.recaptchaVerifier;
          confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
          set({ isLoading: false });
        } catch (error) {
          console.error('Error in phone auth', error);
          set({ isLoading: false });
          throw error;
        }
      },

      verifyOTP: async (phone: string, token: string, fullName?: string) => {
        set({ isLoading: true });
        try {
          if (!confirmationResult) throw new Error("No confirmation result");
          const result = await confirmationResult.confirm(token);
          const firebaseUser = result.user;
          
           let profile: UserProfile;
          try {
            const userDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
            if (userDoc.exists()) {
              profile = userDoc.data() as UserProfile;
            } else {
              // Create new profile
              profile = {
                id: firebaseUser.uid,
                full_name: fullName || firebaseUser.displayName || 'Phone User',
                username: `user${firebaseUser.uid.substring(0,5)}`,
                email: firebaseUser.email || '',
                avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                role: 'user',
                v_coins: 500,
                city: 'Mumbai',
                phone: phone
              };
              try {
                await setDoc(doc(db, 'profiles', firebaseUser.uid), profile);
              } catch (e) {
                console.warn('Failed to save phone profile to Firestore:', e);
              }
            }
          } catch (e) {
            console.warn('Firestore offline during OTP verification, using fallback profile:', e);
            profile = {
              id: firebaseUser.uid,
              full_name: fullName || 'Phone User',
              username: `user${firebaseUser.uid.substring(0,5)}`,
              email: '',
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              role: 'user',
              v_coins: 500,
              city: 'Mumbai',
              phone: phone
            };
          }
          
          set({ user: profile, session: firebaseUser, isLoading: false });
          logToBackend('phone_login_success', profile);
        } catch (error: any) {
          console.error("Error verifying OTP", error);
          logToBackend('phone_login_error', null, { error: error.message });
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const currentUser = useAuthStore.getState().user;
        if (auth.app.options.apiKey !== 'dummy_api_key') {
          await signOut(auth);
        }
        logToBackend('logout', currentUser);
        set({ user: null, session: null });
      },

       initialize: async () => {
        if (auth.app.options.apiKey === 'dummy_api_key') {
          await new Promise(resolve => setTimeout(resolve, 1500));
          set({ isInitializing: false, isLoading: false });
          return;
        }

        set({ isInitializing: true });

        // Safety timeout to prevent stuck loading screen
        const safetyTimeout = setTimeout(() => {
          const { isInitializing } = useAuthStore.getState();
          if (isInitializing) {
            console.warn("Auth initialization timed out, clearing loading state.");
            set({ isInitializing: false, isLoading: false });
          }
        }, 5000);
        
        onAuthStateChanged(auth, async (firebaseUser: User | null) => {
          clearTimeout(safetyTimeout);
          try {
            if (firebaseUser) {
               try {
                 const userDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
                 if (userDoc.exists()) {
                   set({ user: userDoc.data() as UserProfile, session: firebaseUser });
                 } else {
                   // Create minimal profile if not exists
                   const profile: UserProfile = {
                      id: firebaseUser.uid,
                      full_name: firebaseUser.displayName || 'User',
                      username: firebaseUser.email?.split('@')[0] || 'user',
                      email: firebaseUser.email || '',
                      avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                      role: 'user',
                      v_coins: 500,
                      city: 'Mumbai'
                   };
                   set({ user: profile, session: firebaseUser });
                 }
               } catch (firestoreError) {
                 console.warn('Firestore error during initialization, using auth fallback:', firestoreError);
                 set({ 
                   user: {
                      id: firebaseUser.uid,
                      full_name: firebaseUser.displayName || 'User',
                      username: firebaseUser.email?.split('@')[0] || 'user',
                      email: firebaseUser.email || '',
                      avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                      role: 'user',
                      v_coins: 500,
                      city: 'Mumbai'
                   },
                   session: firebaseUser 
                 });
               }
            } else {
              set({ user: null, session: null });
            }
          } finally {
            set({ isInitializing: false, isLoading: false });
          }
        });
      },
    }),
    {
      name: 'vhop-auth',
      partialize: (state) => ({ user: state.user }), // Only persist user profile
    }
  )
);
