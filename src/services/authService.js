import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/firebase.js';

const EMAIL_CONFIRM_KEY = 'veriflash_email_for_signin';

export async function sendMagicLink(email) {
  // Use localhost origin for local testing; otherwise use production hosted URL
  const origin =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? window.location.origin
      : 'https://veriflash-f7655.web.app';

  const actionCodeSettings = {
    // Redirect back to /login to complete sign-in
    url: `${origin}/login`,
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem(EMAIL_CONFIRM_KEY, email);
}

export async function completeMagicLinkSignIn() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem(EMAIL_CONFIRM_KEY);
    if (!email) {
      email = window.prompt('Please enter your email for confirmation:');
    }

    if (email) {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      localStorage.removeItem(EMAIL_CONFIRM_KEY);
      return result.user;
    }
  }
  return null;
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function logout() {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
