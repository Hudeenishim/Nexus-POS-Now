// Import initializeApp from firebase/app to set up the Firebase application
import { initializeApp } from 'firebase/app';
// Import authentication functions and providers from firebase/auth for user management
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
// Import Firestore functions from firebase/firestore for database operations
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, getDocs, getDocFromServer } from 'firebase/firestore';
// Import the Firebase configuration from the applet config file
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the Firebase application with the provided configuration
const app = initializeApp(firebaseConfig);
// Initialize and export the Firestore database instance using the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
// Initialize and export the Firebase Auth instance
export const auth = getAuth(app);

// Export all imported Firebase functions for use throughout the application
export {
  // Google authentication provider
  GoogleAuthProvider,
  // Sign in using a popup window
  signInWithPopup,
  // Sign in using email and password
  signInWithEmailAndPassword,
  // Create a new user with email and password
  createUserWithEmailAndPassword,
  // Sign out the current user
  signOut,
  // Listen for changes in authentication state
  onAuthStateChanged,
  // Reference a specific document in Firestore
  doc,
  // Fetch a single document from Firestore
  getDoc,
  // Set the data of a document in Firestore
  setDoc,
  // Reference a collection in Firestore
  collection,
  // Add a new document to a collection in Firestore
  addDoc,
  // Update fields of an existing document in Firestore
  updateDoc,
  // Delete a document from Firestore
  deleteDoc,
  // Create a query to filter and sort Firestore documents
  query,
  // Filter query results based on field values
  where,
  // Sort query results based on a field
  orderBy,
  // Limit the number of documents returned by a query
  limit,
  // Listen for real-time updates to a document or query
  onSnapshot,
  // Fetch all documents matching a query
  getDocs,
  // Fetch a document directly from the server, bypassing the local cache
  getDocFromServer
};
