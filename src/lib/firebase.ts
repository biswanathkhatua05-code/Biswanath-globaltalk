// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

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
let firestore: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If already initialized, use that app
}

auth = getAuth(app);
firestore = getFirestore(app);

// WebRTC STUN/TURN server configuration
const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

const iceServers = [
  // Default STUN servers from Google
  { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
];

// If TURN server credentials are provided from environment variables, add them to the list.
if (turnUrl && turnUsername && turnPassword) {
  iceServers.push({
    urls: turnUrl,
    username: turnUsername,
    credential: turnPassword,
  });
  console.log("TURN server configuration loaded for WebRTC.");
} else {
  console.warn("TURN server credentials not found in environment variables. WebRTC calls may fail on restrictive networks.");
}

export const servers = {
  iceServers,
  iceCandidatePoolSize: 10,
};


export { app, auth, firestore };
