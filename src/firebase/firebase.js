import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp({
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey || "AIzaSyDummyKeyForBuildAndVercelPreview",
  authDomain: firebaseConfig.authDomain || "veriflash-f7655.firebaseapp.com",
  projectId: firebaseConfig.projectId || "veriflash-f7655",
  messagingSenderId: firebaseConfig.messagingSenderId || "331097483156",
  appId: firebaseConfig.appId || "1:331097483156:web:3096ccebe3869daa3c9181"
});
export const db = getFirestore(app);
export const auth = getAuth(app);

// Centralized exports for all Firestore operations
export {
  collection,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
