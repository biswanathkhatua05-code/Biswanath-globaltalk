// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import { getFirestore, type Firestore } from 'firebase/firestore'; // Import Firestore

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
let firestore: Firestore; // Declare Firestore variable
let appCheckInstance: AppCheck | undefined;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase App: Initialized.");
} else {
  app = getApp(); // If already initialized, use that app
  console.log("Firebase App: Re-using existing instance.");
}

auth = getAuth(app);
console.log("Firebase Auth: Initialized.");

firestore = getFirestore(app); // Initialize Firestore
console.log("Firebase Firestore: Initialized.");

if (typeof window !== 'undefined') {
  console.log("Firebase App Check: Attempting to configure on client...");
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY;

  if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_V3_SITE_KEY_HERE' && recaptchaSiteKey.trim() !== '') {
    console.log("Firebase App Check: reCAPTCHA v3 site key IS PRESENT and seems valid in environment variables:", recaptchaSiteKey);
    
    // Set to true for local testing if needed, but for production it should be false.
    // Ensure you don't have a service worker that might interfere with App Check in dev.
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = false; 

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
    console.warn('Firebase App Check: Current value for NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY:', recaptchaSiteKey);
    console.warn(
      'Firebase App Check: If App Check is enforced in your Firebase project for Authentication, ' +
      'Firebase operations like signInAnonymously WILL FAIL with an "auth/firebase-app-check-token-is-invalid" error.'
    );
    console.warn(
        'Firebase App Check: Please ensure you have correctly set this key in your .env file and restarted your development server.'
    );
  }
} else {
  console.log("Firebase App Check: Not on client (e.g., during server-side rendering), skipping initialization for this context.");
}

export { app, auth, firestore, appCheckInstance as appCheck };
