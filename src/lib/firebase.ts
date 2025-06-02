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
let appCheck: AppCheck | undefined;
// let firestore: Firestore;
// let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If already initialized, use that app
}

auth = getAuth(app);

// Initialize App Check
if (typeof window !== 'undefined') { // Ensure App Check is initialized only on the client
  if (process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY),
      // Optional: set to true if you want to refresh tokens automatically
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    console.warn(
      'Firebase App Check: NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY is not set. ' +
      'App Check will not be initialized. If App Check is enforced in your Firebase project, ' +
      'authentication and other Firebase services might fail.'
    );
  }
}

// firestore = getFirestore(app); // Uncomment if you plan to use Firestore
// storage = getStorage(app); // Uncomment if you plan to use Firebase Storage

export { app, auth, appCheck /*, firestore, storage */ };