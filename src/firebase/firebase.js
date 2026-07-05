import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuildAndVercelPreview",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "veriflash-f7655.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "veriflash-f7655",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "331097483156",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:331097483156:web:3096ccebe3869daa3c9181",
};

export const app = initializeApp(firebaseConfig);
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
