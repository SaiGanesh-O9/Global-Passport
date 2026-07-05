import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth, doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from '../firebase/firebase.js';
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
            const emailLower = (user.email || '').toLowerCase();
            const isOrg = emailLower.startsWith('org') || emailLower.includes('org@') || emailLower.endsWith('.edu') || emailLower.endsWith('.org');
            const role = isSuperAdminEmail ? 'super_admin' : isOrg ? 'organization' : 'student';

            let orgId = null;
            let orgName = null;
            let orgRole = null;

            if (role === 'organization') {
              orgRole = 'Verifier';
              const emailDomain = emailLower.split('@')[1] || 'localhost';
              const domainPrefix = emailDomain.split('.')[0] || 'sandbox';

              try {
                const orgProfilesSnap = await getDocs(collection(db, 'organizationProfiles'));
                let matchedOrg = null;
                orgProfilesSnap.forEach(d => {
                  const data = d.data();
                  if (data.contactEmail && data.contactEmail.toLowerCase().endsWith(emailDomain)) {
                    matchedOrg = { id: d.id, ...data };
                  }
                });

                if (matchedOrg) {
                  orgId = matchedOrg.id;
                  orgName = matchedOrg.name;
                } else if (import.meta.env.DEV) {
                  orgId = `org-${domainPrefix}-${Math.random().toString(36).substring(2, 7)}`;
                  orgName = `${domainPrefix.charAt(0).toUpperCase() + domainPrefix.slice(1)} University`;

                  await setDoc(doc(db, 'organizations', orgId), {
                    organizationId: orgId,
                    name: orgName,
                    type: 'University',
                    status: 'Active',
                    verificationStatus: 'Verified',
                    website: `www.${emailDomain}`,
                    officialEmailDomain: emailDomain,
                    createdAt: new Date().toISOString()
                  });

                  await setDoc(doc(db, 'organizationProfiles', orgId), {
                    id: orgId,
                    name: orgName,
                    description: 'Dynamically generated sandbox organization profile.',
                    category: 'University',
                    logo: null,
                    contactEmail: user.email,
                    website: `www.${emailDomain}`,
                    address: '100 Sandbox Campus Way',
                    status: 'Active',
                    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Passport']
                  });
                }
              } catch (orgErr) {
                console.error("Dynamic org profile query failed:", orgErr.message);
              }
            }

            const newProfile = {
              name: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
              email: user.email || `anonymous-${user.uid.substring(0, 5)}@localhost`,
              role: role,
              organizationId: orgId,
              organizationName: orgName,
              organizationRole: orgRole,
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
    return await sendMagicLink(email);
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

  // Expose local development login for testing and preview scopes
  const loginAsDeveloper = async (roleType) => {
    try {
      setLoading(true);
      setAuthReady(false);
      
      let authUid = `dev-mock-uid-${Date.now()}`;
      const stableEmail = roleType === 'super_admin' ? 'saiganeshkrovvidi.092005@gmail.com' :
                         roleType === 'organization' ? 'org@localhost' : 'student@localhost';
      let mockUser = {
        uid: authUid,
        email: stableEmail,
        displayName: `Dev ${roleType.toUpperCase()}`
      };

      try {
        const cred = await signInAnonymously(auth);
        authUid = cred.user.uid;
        mockUser = {
          ...cred.user,
          email: stableEmail,
        };
      } catch (authErr) {
        console.warn("Firebase Anonymous Auth failed, falling back to local mock auth:", authErr.message);
      }

      const devProfiles = {
        user: {
          uid: authUid,
          name: 'Development User',
          email: 'student@localhost',
          role: 'student',
          status: 'active',
        },
        organization: {
          uid: authUid,
          name: 'Demo Organization',
          email: 'org@localhost',
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

      try {
        const userRef = doc(db, 'users', profile.uid);
        await setDoc(userRef, profileData);
      } catch (dbErr) {
        console.warn("Firestore user profile save failed, loading profile directly into local state memory:", dbErr.message);
      }
      
      // Update state synchronously before clearing loading to prevent flash of undefined role
      setCurrentUser(mockUser);
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
    loginAsDeveloper: loginAsDeveloper,
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
