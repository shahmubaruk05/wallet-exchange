
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  CollectionReference,
  DocumentReference,
  SetOptions,
  Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}

/**
 * Initiates a Firestore transaction.
 * Does NOT await the transaction internally.
 */
export function runTransactionNonBlocking(firestore: Firestore, updateFunction: (transaction: any) => Promise<any>) {
    runTransaction(firestore, updateFunction).catch(error => {
        // Generic error handling for transactions.
        // For permission errors within a transaction, they are often caught by the individual
        // operations' error handlers if they are non-blocking. If the transaction itself
        // fails due to permissions (e.g., contention or initial read failures), this will catch it.
        // A more specific error might require inspecting the error object.
        console.error("Transaction failed:", error);
         errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: 'transaction', // Path is not specific to one doc in a transaction
                operation: 'write',
                requestResourceData: { details: 'Transaction failed, see console for details.' }
            })
        );
    });
}
