import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDoYZaN0-v6o9Ru8ItsLKctQXXh9uvCSdI",
  authDomain: "vhop-61275.firebaseapp.com",
  projectId: "vhop-61275",
  storageBucket: "vhop-61275.firebasestorage.app",
  messagingSenderId: "152629456675",
  appId: "1:152629456675:web:8ce885b537d72356eda696",
  measurementId: "G-LRNZ0KHJKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const googleProvider = new GoogleAuthProvider();

export { RecaptchaVerifier, signInWithPhoneNumber };
