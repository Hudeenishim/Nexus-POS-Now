import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (role: 'admin' | 'manager' | 'cashier') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`, auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // Ensure we don't hit "operation not allowed" by checking provider
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, phone: string) => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      console.log('Starting sign up for:', email);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('Firebase user created:', firebaseUser.uid);
      
      const newUser: User = {
        uid: firebaseUser.uid,
        name,
        email,
        phoneNumber: phone,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Attempting to create user document in Firestore:', newUser);
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        console.log('User document created successfully');
      } catch (error) {
        console.error('Firestore setDoc error during sign up:', error);
        handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`, auth);
      }
      setUser(newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const updateUserRole = async (role: 'admin' | 'manager' | 'cashier') => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { ...user, role }, { merge: true });
      setUser(prev => prev ? { ...prev, role } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`, auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSigningIn, signIn, signInWithEmail, signUp, signOut: () => auth.signOut(), updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
