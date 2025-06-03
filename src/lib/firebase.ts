// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
// Import other Firebase services as needed, e.g., Firestore, Storage
// import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let auth: Auth;
let appCheckInstance: AppCheck | undefined;
// let firestore: Firestore;
// let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase App: Initialized.");
} else {
  app = getApp(); // If already initialized, use that app
  console.log("Firebase App: Re-using existing instance.");
}

auth = getAuth(app);
console.log("Firebase Auth: Initialized.");

// Initialize App Check - THIS IS CRUCIAL
if (typeof window !== 'undefined') { // Ensure App Check is initialized only on the client
  console.log("Firebase App Check: Attempting to configure on client...");
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY;

  if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_V3_SITE_KEY_HERE' && recaptchaSiteKey.trim() !== '') {
    console.log("Firebase App Check: reCAPTCHA v3 site key IS PRESENT in environment variables.");
    
    // Explicitly ensure debug token is not interfering if it was set previously
    if ((window as any).FIREBASE_APPCHECK_DEBUG_TOKEN === true) {
        console.warn("Firebase App Check: FIREBASE_APPCHECK_DEBUG_TOKEN was set to true. Unsetting it to use reCAPTCHA provider.");
        delete (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN;
    } else {
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = false; // Also ensures it's not true
    }

    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("Firebase App Check: Successfully initialized with reCAPTCHA V3 provider.");
    } catch (error) {
      console.error("Firebase App Check: Initialization FAILED with reCAPTCHA V3 provider.", error);
    }
  } else {
    console.warn(
      'Firebase App Check: SKIPPING INITIALIZATION. NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY is missing, is still the placeholder "YOUR_RECAPTCHA_V3_SITE_KEY_HERE", or is an empty string.'
    );
    console.warn('Firebase App Check: Current value for NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY (should not be undefined or placeholder):', recaptchaSiteKey);
    console.warn(
      'Firebase App Check: If App Check is enforced in your Firebase project, ' +
      'authentication and other Firebase services WILL LIKELY FAIL with an "auth/firebase-app-check-token-is-invalid" error.'
    );
  }
} else {
  console.log("Firebase App Check: Not on client, skipping initialization.");
}

// firestore = getFirestore(app); // Uncomment if you plan to use Firestore
// storage = getStorage(app); // Uncomment if you plan to use Firebase Storage

export { app, auth, appCheckInstance as appCheck /*, firestore, storage */ };