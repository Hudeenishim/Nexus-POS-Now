// Import React and necessary hooks for context and state management
import React, { createContext, useContext, useEffect, useState } from 'react';
// Import Firebase Authentication functions and types
import { onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
// Import Firestore functions for document operations
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Import initialized Firebase auth and db instances
import { auth, db } from '../firebase';
// Import the User type definition
import { User } from '../types';
// Import Firestore error handling utility
import { handleFirestoreError, OperationType } from '../lib/utils';

// Define the shape of the authentication context
interface AuthContextType {
  // The current authenticated user or null
  user: User | null;
  // Loading state for initial auth check
  loading: boolean;
  // State to track if a sign-in process is in progress
  isSigningIn: boolean;
  // Function to sign in with Google
  signIn: () => Promise<void>;
  // Function to sign in with email and password
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  // Function to sign up with email and password
  signUp: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  // Function to sign out
  signOut: () => Promise<void>;
  // Function to update the user's role
  updateUserRole: (role: 'admin' | 'manager' | 'cashier') => Promise<void>;
}

// Create the authentication context with an undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component to wrap the application and provide auth state
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State to store the current user data
  const [user, setUser] = useState<User | null>(null);
  // State to track if the initial auth check is loading
  const [loading, setLoading] = useState(true);
  // State to track if a sign-in operation is active
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Effect to listen for authentication state changes
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If a user is authenticated in Firebase
      if (firebaseUser) {
        try {
          // Attempt to fetch the user's profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          // If the profile exists, update the local user state
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // If no profile exists, create a new user object
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              username: firebaseUser.displayName || 'user_' + firebaseUser.uid.slice(0, 5),
              email: firebaseUser.email || '',
              createdAt: new Date().toISOString(),
            };
            try {
              // Save the new user profile to Firestore
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              // Update the local user state
              setUser(newUser);
            } catch (err) {
              // Log error if creating the user document fails
              console.error('Error creating user in onAuthStateChanged:', err);
            }
          }
        } catch (error) {
          // Log error if fetching the user document fails
          console.error('Error fetching user in onAuthStateChanged:', error);
        }
      } else {
        // If no user is authenticated, clear the local user state
        setUser(null);
      }
      // Set loading to false once the initial check is complete
      setLoading(false);
    });

    // Cleanup function to unsubscribe from the listener on unmount
    return () => unsubscribe();
  }, []);

  // Function to handle Google sign-in
  const signIn = async () => {
    // Prevent multiple concurrent sign-in attempts
    if (isSigningIn) return;
    // Set sign-in state to true
    setIsSigningIn(true);
    try {
      // Initialize Google auth provider
      const provider = new GoogleAuthProvider();
      // Open sign-in popup
      const result = await signInWithPopup(auth, provider);
      // Get the authenticated Firebase user
      const firebaseUser = result.user;
      
      // Check if the user already has a profile in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      // If no profile exists, create one
      if (!userDoc.exists()) {
        const newUser: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          username: firebaseUser.displayName || 'user_' + firebaseUser.uid.slice(0, 5),
          email: firebaseUser.email || '',
          createdAt: new Date().toISOString(),
        };
        try {
          // Save the new user profile to Firestore
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          // Update the local user state
          setUser(newUser);
        } catch (error) {
          // Log and handle Firestore error during profile creation
          console.error('Firestore error during Google sign in:', error);
          handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`, auth);
        }
      }
    } catch (error: any) {
      // Log errors except for user-cancelled popups
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Sign in error:', error);
      }
      // Re-throw the error for the caller to handle
      throw error;
    } finally {
      // Reset sign-in state
      setIsSigningIn(false);
    }
  };

  // Function to handle email and password sign-in
  const signInWithEmail = async (email: string, pass: string) => {
    // Prevent multiple concurrent sign-in attempts
    if (isSigningIn) return;
    // Set sign-in state to true
    setIsSigningIn(true);
    try {
      // Sign in with Firebase email/password auth
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      // Log sign-in error
      console.error('Email sign in error:', error);
      // Re-throw the error
      throw error;
    } finally {
      // Reset sign-in state
      setIsSigningIn(false);
    }
  };

  // Function to handle email and password sign-up
  const signUp = async (email: string, pass: string, name: string, phone: string) => {
    // Prevent multiple concurrent sign-in/up attempts
    if (isSigningIn) return;
    // Set sign-in state to true
    setIsSigningIn(true);
    try {
      // Log sign-up start
      console.log('Starting sign up for:', email);
      // Create a new user in Firebase Auth
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
      // Log successful Auth creation
      console.log('Firebase user created:', firebaseUser.uid);
      
      // Prepare the new user profile object
      const newUser: User = {
        uid: firebaseUser.uid,
        name,
        username: name,
        email,
        phoneNumber: phone,
        createdAt: new Date().toISOString(),
      };
      
      // Log Firestore document creation attempt
      console.log('Attempting to create user document in Firestore:', newUser);
      try {
        // Save the new user profile to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        // Log successful Firestore creation
        console.log('User document created successfully');
      } catch (error) {
        // Log and handle Firestore error during profile creation
        console.error('Firestore setDoc error during sign up:', error);
        handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`, auth);
      }
      // Update the local user state
      setUser(newUser);
    } catch (error) {
      // Log sign-up error
      console.error('Sign up error:', error);
      // Re-throw the error
      throw error;
    } finally {
      // Reset sign-in state
      setIsSigningIn(false);
    }
  };

  // Function to update the user's role in Firestore
  const updateUserRole = async (role: 'admin' | 'manager' | 'cashier') => {
    // If no user is authenticated, return
    if (!user) return;
    try {
      // Update the user's role in Firestore using merge to preserve other fields
      await setDoc(doc(db, 'users', user.uid), { ...user, role }, { merge: true });
      // Update the local user state with the new role
      setUser(prev => prev ? { ...prev, role } : null);
    } catch (error) {
      // Handle Firestore error during role update
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`, auth);
    }
  };

  // Render the context provider with the auth state and functions
  return (
    <AuthContext.Provider value={{ user, loading, isSigningIn, signIn, signInWithEmail, signUp, signOut: () => auth.signOut(), updateUserRole }}>
      {/* Render children within the provider */}
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily access the authentication context
export function useAuth() {
  // Get the context value
  const context = useContext(AuthContext);
  // Throw error if the hook is used outside of an AuthProvider
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  // Return the context value
  return context;
}
