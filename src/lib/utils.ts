import { clsx, type ClassValue } from 'clsx'; // Import clsx for conditional class names
import { twMerge } from 'tailwind-merge'; // Import twMerge to merge Tailwind classes without conflicts

export function cn(...inputs: ClassValue[]) { // Define a utility function for merging class names
  return twMerge(clsx(inputs)); // Merge and return the class names
} // End of cn function

export function formatCurrency(amount: number) { // Define a function to format numbers as Ghanaian currency
  return `GHC ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; // Format and return currency string
} // End of formatCurrency function

export function formatDate(date: Date | string) { // Define a function to format dates
  const d = typeof date === 'string' ? new Date(date) : date; // Convert string to Date object if necessary
  return new Intl.DateTimeFormat('en-US', { // Use Intl to format the date
    dateStyle: 'medium', // Use medium date style
    timeStyle: 'short', // Use short time style
  }).format(d); // Format and return the date string
} // End of formatDate function

export function isValidGhanaPhone(phone: string) { // Define a function to validate Ghanaian phone numbers
  // Ghanaian phone numbers: 02x, 03x, 05x followed by 7 digits (Strict 10 digits)
  const ghanaPhoneRegex = /^0[235][0-9]{8}$/; // Regex for 10-digit Ghanaian phone numbers
  return ghanaPhoneRegex.test(phone); // Test the phone number against the regex
} // End of isValidGhanaPhone function

export function isValidEmail(email: string) { // Define a function to validate email addresses
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Regex for standard email format
  return emailRegex.test(email); // Test the email against the regex
} // End of isValidEmail function

export enum OperationType { // Define an enum for different Firestore operations
  CREATE = 'create', // Create operation
  UPDATE = 'update', // Update operation
  DELETE = 'delete', // Delete operation
  LIST = 'list', // List operation
  GET = 'get', // Get operation
  WRITE = 'write', // Write operation
} // End of OperationType enum

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null, auth: any) { // Define a function to handle and log Firestore errors
  const errInfo = { // Create an error information object
    error: error instanceof Error ? error.message : String(error), // Get the error message
    authInfo: { // Include authentication information
      userId: auth.currentUser?.uid, // Current user ID
      email: auth.currentUser?.email, // Current user email
      emailVerified: auth.currentUser?.emailVerified, // Whether email is verified
      isAnonymous: auth.currentUser?.isAnonymous, // Whether user is anonymous
      tenantId: auth.currentUser?.tenantId, // Tenant ID if applicable
      providerInfo: auth.currentUser?.providerData.map((provider: any) => ({ // Map provider data
        providerId: provider.providerId, // Provider ID (e.g., google.com)
        displayName: provider.displayName, // User display name
        email: provider.email, // Provider email
        photoUrl: provider.photoURL // Provider photo URL
      })) || [] // Default to empty array
    }, // End of authInfo
    operationType, // Include the operation type
    path // Include the Firestore path
  } // End of errInfo object
  console.error('Firestore Error: ', JSON.stringify(errInfo)); // Log the error as a JSON string
  throw new Error(JSON.stringify(errInfo)); // Throw a new error with the JSON string
} // End of handleFirestoreError function
