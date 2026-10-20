import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: 'admin' | 'user';
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPhoto: (photoURL: string) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  userRole: 'user',
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUserPhoto: async () => {},
  updateUserName: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check admin authorization
  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser || !currentUser.email) {
      setIsAdmin(false);
      return;
    }

    const email = currentUser.email.toLowerCase().trim();
    // Authorized administrator emails
    if (
      email === 'kavikavik999@gmail.com' ||
      email === 'mrdharanieditormrdharanieditor@gmail.com'
    ) {
      setIsAdmin(true);
      return;
    }

    try {
      // Verify with backend
      const resp = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setIsAdmin(Boolean(data.isAdmin));
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await checkAdminStatus(currentUser);

      if (currentUser) {
        // Sync user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Creator',
              photoURL: currentUser.photoURL || '',
              role:
                currentUser.email?.toLowerCase() === 'kavikavik999@gmail.com'
                  ? 'admin'
                  : 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('User profile sync notice:', err);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      await checkAdminStatus(result.user);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setAuthError(error.message || 'Failed to sign out');
    }
  };

  const updateUserPhoto = async (photoURL: string) => {
    if (!user) throw new Error('Must be signed in to update photo');
    try {
      await updateProfile(user, { photoURL });
      // Update in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { photoURL, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setUser({ ...user, photoURL } as User);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateUserName = async (displayName: string) => {
    if (!user) throw new Error('Must be signed in to update profile');
    try {
      await updateProfile(user, { displayName });
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { displayName, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setUser({ ...user, displayName } as User);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        userRole: isAdmin ? 'admin' : 'user',
        signInWithGoogle,
        signOut,
        updateUserPhoto,
        updateUserName,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
