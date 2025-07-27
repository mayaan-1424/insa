import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyApoEIo4LLJ0HjWpMSaDNjO5qQzrnyKA4Q",
  authDomain: "instaadgen-3e55d.firebaseapp.com",
  projectId: "instaadgen-3e55d",
  storageBucket: "instaadgen-3e55d.appspot.com",
  messagingSenderId: "697559770190",
  appId: "1:697559770190:web:694abd200080c61743cf1f",
  measurementId: "G-FH8HNWQG9J"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore only once
let db;
try {
  // Try to get existing Firestore instance first
  db = getFirestore(app);
} catch (error) {
  // If no instance exists, initialize with custom settings
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
}

// Initialize and export Firebase services
export const auth = getAuth(app);
export { db };
export const storage = getStorage(app);

export default app;