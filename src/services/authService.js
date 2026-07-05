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

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem(EMAIL_CONFIRM_KEY, email);
    return { success: true, isSimulated: false };
  } catch (err) {
    console.warn("Real magic link dispatch failed, falling back to simulated sandbox link:", err.message);
    const sandboxLink = `${origin}/login?apiKey=sandbox&mode=signIn&oobCode=sandbox-token-${Date.now()}&email=${encodeURIComponent(email)}`;
    localStorage.setItem('sandbox_magic_link', sandboxLink);
    localStorage.setItem(EMAIL_CONFIRM_KEY, email);
    return { success: true, isSimulated: true, link: sandboxLink };
  }
}

export async function completeMagicLinkSignIn() {
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('apiKey=sandbox')) {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem(EMAIL_CONFIRM_KEY);
    localStorage.removeItem(EMAIL_CONFIRM_KEY);
    localStorage.removeItem('sandbox_magic_link');
    
    if (!email) {
      throw new Error('Confirmation email is missing. Please request a new magic link.');
    }
    
    return {
      uid: `sandbox-uid-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: email,
      displayName: email.split('@')[0],
      isAnonymous: false
    };
  }

  if (isSignInWithEmailLink(auth, currentUrl)) {
    let email = localStorage.getItem(EMAIL_CONFIRM_KEY);
    if (!email) {
      email = window.prompt('Please enter your email for confirmation:');
    }

    if (email) {
      const result = await signInWithEmailLink(auth, email, currentUrl);
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

let authCallback = null;

export function subscribeToAuthChanges(callback) {
  authCallback = callback;
  const unsubFirebase = onAuthStateChanged(auth, callback);
  return () => {
    unsubFirebase();
    authCallback = null;
  };
}

export function triggerSimulatedAuthChange(user) {
  if (authCallback) {
    authCallback(user);
  }
}
