import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../firebase';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phone?: string;
  photoURL: string | null;
  churchId?: string;
  churchName?: string;
  generationCohort?: string;
  role: 'Attendee' | 'Church Leader' | 'Admin' | 'Speaker';
  onboarded: boolean;
  createdAt: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Initial profile creation
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: currentUser.email === 'Khwezi@khemo.co.za' ? 'Admin' : 'Attendee',
              onboarded: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, 'get', `users/${currentUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time profile updates
  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        }
      }, (error) => {
        handleFirestoreError(error, 'get', `users/${user.uid}`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
