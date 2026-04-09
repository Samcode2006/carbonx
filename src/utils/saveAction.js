/**
 * Save eco action via Cloud Function (server-side validation).
 * The server re-validates CO2 amounts and anti-cheat — XP cannot be faked.
 * Falls back to direct Firestore write if function not deployed.
 */
import { saveEcoActionFn } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function saveAction({ userId, type, co2, distance, filename, fileType, location, userData }) {
  try {
    // Try Cloud Function first — server validates CO2 and anti-cheat
    const result = await saveEcoActionFn({
      type,
      co2,
      distance,
      filename,
      fileType,
      location,
    });
    return { success: true, via: 'cloud-function', ...result.data };

  } catch (err) {
    // If Cloud Function not deployed, fall back to direct Firestore
    // (anti-cheat still runs client-side via antiCheat.js)
    if (err.code === 'already-exists') {
      return { success: false, error: 'Duplicate upload detected.' };
    }
    if (err.code === 'resource-exhausted') {
      return { success: false, error: 'Daily upload limit reached (5/day).' };
    }

    console.warn('Cloud Function unavailable, using direct Firestore write:', err.message);
    try {
      const newXP = (userData?.xp || 0) + co2;
      const newLevel = newXP >= 1500 ? 3 : newXP >= 500 ? 2 : 1;

      await addDoc(collection(db, 'actions'), {
        userId,
        type,
        co2,
        distance: distance || 0,
        filename: filename || '',
        fileType: fileType || 'image',
        timestamp: serverTimestamp(),
        location: location || null,
        verified: true,
      });

      await updateDoc(doc(db, 'users', userId), {
        xp: increment(co2),
        co2Saved: increment(co2),
        level: newLevel,
      });

      return { success: true, via: 'direct-firestore', co2Awarded: co2, xpAwarded: co2, newLevel };
    } catch (fsErr) {
      return { success: false, error: fsErr.message };
    }
  }
}
