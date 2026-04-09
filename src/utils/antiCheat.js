import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const DAILY_LIMIT = 5;

export async function checkDuplicateUpload(userId, filename) {
  try {
    const q = query(
      collection(db, 'actions'),
      where('userId', '==', userId),
      where('filename', '==', filename)
    );
    const snap = await getDocs(q);
    return !snap.empty; // true = duplicate found
  } catch {
    return false;
  }
}

export async function getDailyUploadCount(userId) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'actions'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(startOfDay))
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}

export async function runAntiCheatChecks(userId, filename) {
  const [isDuplicate, dailyCount] = await Promise.all([
    checkDuplicateUpload(userId, filename),
    getDailyUploadCount(userId),
  ]);

  if (isDuplicate) {
    return { allowed: false, reason: 'Duplicate upload detected — this file has already been submitted.' };
  }

  if (dailyCount >= DAILY_LIMIT) {
    return { 
      allowed: false, 
      reason: `Daily limit reached (${DAILY_LIMIT} uploads/day). XP penalty applied. Come back tomorrow!`,
      penalty: true
    };
  }

  return { allowed: true, dailyCount };
}
