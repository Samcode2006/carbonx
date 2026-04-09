import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDr3X93_Wwim_u-93lRLCUJjGxmxBScXFo",
  authDomain: "timber-by.firebaseapp.com",
  databaseURL: "https://timber-by-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timber-by",
  storageBucket: "timber-by.firebasestorage.app",
  messagingSenderId: "205819620991",
  appId: "1:205819620991:web:550bc86f2ef41109db194a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Uncomment this line to test with local emulator:
// connectFunctionsEmulator(functions, 'localhost', 5001);

// Cloud Function callables
export const verifyEcoActionFn    = httpsCallable(functions, 'verifyEcoAction');
export const saveEcoActionFn      = httpsCallable(functions, 'saveEcoAction');
export const getLeaderboardFn     = httpsCallable(functions, 'getLeaderboard');
export const generateSuggestionsFn = httpsCallable(functions, 'generateAISuggestions');

export default app;
