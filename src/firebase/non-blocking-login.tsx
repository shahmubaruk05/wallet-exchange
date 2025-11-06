
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

type ErrorCallback = (error: FirebaseError) => void;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onError?: ErrorCallback): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      // User created successfully, now create their document in Firestore.
      const user = userCredential.user;
      const db = getFirestore(authInstance.app);
      const userDocRef = doc(db, "users", user.uid);
      
      // Set initial user data. This is a non-blocking operation.
      setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        role: 'user', // Default role
        walletBalance: 0, // Default balance
        createdAt: new Date().toISOString(),
      });
    })
    .catch((error: FirebaseError) => {
        if (onError) {
            onError(error);
        } else {
            console.error("Signup error:", error);
        }
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate password reset email (non-blocking). */
export function initiatePasswordReset(authInstance: Auth, email: string): void {
    sendPasswordResetEmail(authInstance, email);
}
