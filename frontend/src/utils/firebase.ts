import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  Auth,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderAPIKeyForTERAEOC2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tera-emergency.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tera-emergency',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tera-emergency.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcdef123456'
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export { onAuthStateChanged, signOut };
export type { FirebaseUser };

export const signOutFirebase = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signout warning:', e);
  }
};


export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && 
    import.meta.env.VITE_FIREBASE_API_KEY !== 'AIzaSyDemoPlaceholderAPIKeyForTERAEOC2026'
  );
};

export const initRecaptchaVerifier = (elementId: string): RecaptchaVerifier => {
  // Clear any pre-existing instance if needed
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {}
  }

  const verifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired. User must solve again.');
    }
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

export const sendPhoneOtp = async (
  phoneNumber: string, 
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  if (!phoneNumber.startsWith('+')) {
    throw new Error('Please include international country code (e.g., +91 for India, +1 for US).');
  }
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const verifyPhoneOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<string> => {
  const userCredential = await confirmationResult.confirm(otpCode);
  const idToken = await userCredential.user.getIdToken(true);
  return idToken;
};
