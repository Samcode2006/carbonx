// Temporary Firebase stub file
// This file provides stub exports to prevent import errors during Supabase migration
// TODO: Complete migration of remaining files to Supabase and remove this file

console.warn('⚠️ Firebase stub file loaded. Please complete Supabase migration for full functionality.');

// Stub database export
export const db = {
    // Placeholder object to prevent errors
    collection: () => ({
        doc: () => ({
            set: () => Promise.resolve(),
            get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
            update: () => Promise.resolve(),
        }),
        add: () => Promise.resolve({ id: 'stub-id' }),
        where: () => ({ get: () => Promise.resolve({ docs: [] }) }),
    }),
};

// Stub auth export  
export const auth = {
    currentUser: null,
    onAuthStateChanged: () => () => { }, // Return unsubscribe function
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase auth not configured')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase auth not configured')),
    signOut: () => Promise.reject(new Error('Firebase auth not configured')),
};

// Stub cloud functions
export const saveEcoActionFn = () => {
    console.warn('saveEcoActionFn called but not implemented. Please migrate to Supabase.');
    return Promise.reject(new Error('Function not implemented - migrate to Supabase'));
};

export const verifyEcoActionFn = () => {
    console.warn('verifyEcoActionFn called but not implemented. Please migrate to Supabase.');
    return Promise.reject(new Error('Function not implemented - migrate to Supabase'));
};

// Note: This is a temporary solution.
// For full functionality, complete the migration to Supabase by:
// 1. Updating src/utils/saveAction.js to use Supabase
// 2. Updating src/pages/Rewards.jsx to use Supabase
// 3. Updating src/utils/aiVerification.js to use Supabase
// 4. Removing this file and Firebase dependency