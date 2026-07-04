import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, functions, auth } from '../firebase/firebase.js';
import { httpsCallable } from 'firebase/functions';
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

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        let finalCurrentUser = user;
        const devSessionStr = localStorage.getItem('dev_user');
        if (user.isAnonymous && devSessionStr) {
          try {
            const devSession = JSON.parse(devSessionStr);
            if (devSession.currentUser.uid === user.uid) {
              finalCurrentUser = {
                uid: user.uid,
                email: devSession.currentUser.email,
                displayName: devSession.currentUser.displayName,
                isAnonymous: true
              };
            }
          } catch (e) {
            console.error("Failed to parse dev session:", e);
          }
        }
        setCurrentUser(finalCurrentUser);

        const userRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          const isSuperAdminEmail = finalCurrentUser.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL;
          if (!docSnap.exists() || (isSuperAdminEmail && (docSnap.data()?.role !== 'super_admin' || docSnap.data()?.status !== 'active'))) {
            try {
              const bootstrapFn = httpsCallable(functions, 'bootstrapSuperAdmin');
              await bootstrapFn();
            } catch (err) {
              console.error("Super Admin Bootstrap failed:", err);
              if (!docSnap.exists()) {
                const newProfile = {
                  name: user.displayName || user.email.split('@')[0],
                  email: user.email,
                  role: isSuperAdminEmail ? 'super_admin' : 'pending',
                  organizationId: null,
                  organizationName: null,
                  organizationRole: null,
                  status: isSuperAdminEmail ? 'active' : 'pending',
                  createdAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                };
                await setDoc(userRef, newProfile);
              }
            }
          } else {
            setUserProfile(docSnap.data());
            setLoading(false);
          }
        }, (error) => {
          console.error("User profile load error:", error);
          setLoading(false);
        });
      } else {
        // Session Priority Check: Restore local development session if no Firebase user session exists
        const devSession = localStorage.getItem('dev_user');
        if (devSession) {
          try {
            const { currentUser: devUser, userProfile: devProfile } = JSON.parse(devSession);
            setCurrentUser(devUser);
            setUserProfile(devProfile);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse dev user from localStorage:', e);
          }
        }

        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const login = async (email) => {
    await sendMagicLink(email);
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('dev_user');
    setCurrentUser(null);
    setUserProfile(null);
    await authLogout();
    setLoading(false);
  };

  // Expose local development login ONLY in DEV environment
  const loginAsDeveloper = async (roleType) => {
    if (!import.meta.env.DEV) return;

    try {
      setLoading(true);
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
      const docSnap = await getDoc(userRef);

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

      const currentUserObj = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.name,
      };

      localStorage.setItem('dev_user', JSON.stringify({
        currentUser: currentUserObj,
        userProfile: profileData
      }));

      setCurrentUser(currentUserObj);
      setUserProfile(profileData);
      setLoading(false);
      return profileData;
    } catch (err) {
      console.error(err);
      setLoading(false);
      throw err;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
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
