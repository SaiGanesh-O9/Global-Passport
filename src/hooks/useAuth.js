import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth, doc, getDoc, setDoc, serverTimestamp } from '../firebase/firebase.js';
import { signInAnonymously } from 'firebase/auth';
import {
  subscribeToAuthChanges,
  sendMagicLink,
  logout as authLogout,
} from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthChanges(async (user) => {
      if (user) {
        setCurrentUser(user);

        try {
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);

          if (!docSnap.exists()) {
            const isSuperAdminEmail = user.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL;
            const newProfile = {
              name: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
              email: user.email || `anonymous-${user.uid.substring(0, 5)}@localhost`,
              role: isSuperAdminEmail ? 'super_admin' : 'student',
              organizationId: null,
              organizationName: null,
              organizationRole: null,
              status: 'active',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.error("User profile load error:", error);
        } finally {
          setAuthReady(true);
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setAuthReady(true);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async (email) => {
    await sendMagicLink(email);
  };

  const logout = async () => {
    setLoading(true);
    setAuthReady(false);
    setCurrentUser(null);
    setUserProfile(null);
    await authLogout();
    setAuthReady(true);
    setLoading(false);
  };

  // Expose local development login ONLY in DEV environment
  const loginAsDeveloper = async (roleType) => {
    if (!import.meta.env.DEV) return;

    try {
      setLoading(true);
      setAuthReady(false);
      const cred = await signInAnonymously(auth);
      const authUid = cred.user.uid;

      const devProfiles = {
        user: {
          uid: authUid,
          name: 'Development User',
          email: `dev-user-${authUid.substring(0, 5)}@localhost`,
          role: 'student',
          status: 'active',
        },
        organization: {
          uid: authUid,
          name: 'Demo Organization',
          email: `dev-org-${authUid.substring(0, 5)}@localhost`,
          role: 'organization',
          status: 'active',
          organizationId: 'org-northbridge',
          organizationName: 'Northbridge University',
          organizationRole: 'Verifier',
        },
        super_admin: {
          uid: authUid,
          name: 'Development Super Admin',
          email: 'saiganeshkrovvidi.092005@gmail.com',
          role: 'super_admin',
          status: 'active',
        }
      };

      const profile = devProfiles[roleType];
      if (!profile) throw new Error('Invalid developer role type selected');

      const userRef = doc(db, 'users', profile.uid);
      const profileData = {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        organizationId: profile.organizationId || null,
        organizationName: profile.organizationName || null,
        organizationRole: profile.organizationRole || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await setDoc(userRef, profileData);
      
      // Update state synchronously before clearing loading to prevent flash of undefined role
      setCurrentUser(cred.user);
      setUserProfile(profileData);
      setAuthReady(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setAuthReady(true);
      setLoading(false);
      throw err;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authReady,
    login,
    logout,
    loginAsDeveloper: import.meta.env.DEV ? loginAsDeveloper : undefined,
    isAuthenticated: currentUser !== null,
    role: userProfile ? userProfile.role : null,
    organizationRole: userProfile ? userProfile.organizationRole : null,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
