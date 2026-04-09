/**
 * DEMO SEED SCRIPT
 * Run this once to preload demo users and actions in Firestore.
 * Accessible from the app at /seed (dev only) or call seedDemoData() directly.
 */

import { db } from '../firebase';
import {
  doc, setDoc, collection, addDoc, getDocs,
  query, where, Timestamp, writeBatch
} from 'firebase/firestore';

const DEMO_USERS = [
  { uid: 'demo_user_001', name: 'Arjun Sharma',   email: 'arjun@campus.edu',   xp: 2340, co2Saved: 2340, level: 3, department: 'CS' },
  { uid: 'demo_user_002', name: 'Priya Patel',    email: 'priya@campus.edu',   xp: 1820, co2Saved: 1820, level: 3, department: 'Engineering' },
  { uid: 'demo_user_003', name: 'Rohan Mehta',    email: 'rohan@campus.edu',   xp: 1450, co2Saved: 1450, level: 2, department: 'CS' },
  { uid: 'demo_user_004', name: 'Sneha Reddy',    email: 'sneha@campus.edu',   xp: 1200, co2Saved: 1200, level: 2, department: 'Business' },
  { uid: 'demo_user_005', name: 'Karan Singh',    email: 'karan@campus.edu',   xp: 980,  co2Saved: 980,  level: 2, department: 'Science' },
  { uid: 'demo_user_006', name: 'Ananya Iyer',    email: 'ananya@campus.edu',  xp: 750,  co2Saved: 750,  level: 2, department: 'Arts' },
  { uid: 'demo_user_007', name: 'Dev Kapoor',     email: 'dev@campus.edu',     xp: 620,  co2Saved: 620,  level: 2, department: 'Engineering' },
  { uid: 'demo_user_008', name: 'Meera Nair',     email: 'meera@campus.edu',   xp: 480,  co2Saved: 480,  level: 1, department: 'CS' },
  { uid: 'demo_user_009', name: 'Vikram Joshi',   email: 'vikram@campus.edu',  xp: 360,  co2Saved: 360,  level: 1, department: 'Science' },
  { uid: 'demo_user_010', name: 'Tanvi Gupta',    email: 'tanvi@campus.edu',   xp: 200,  co2Saved: 200,  level: 1, department: 'Business' },
];

const DEMO_ACTIONS = [
  { userId: 'demo_user_001', type: 'cycling',   co2: 480, distance: 4, filename: 'cycle_morning.jpg',    daysAgo: 0 },
  { userId: 'demo_user_001', type: 'recycling', co2: 200, distance: 0, filename: 'recycle_bin.jpg',      daysAgo: 1 },
  { userId: 'demo_user_001', type: 'bus',       co2: 320, distance: 4, filename: 'bus_route_4km.jpg',    daysAgo: 2 },
  { userId: 'demo_user_002', type: 'cycling',   co2: 600, distance: 5, filename: 'cycle_campus.jpg',     daysAgo: 0 },
  { userId: 'demo_user_002', type: 'recycling', co2: 200, distance: 0, filename: 'recycle_paper.jpg',    daysAgo: 1 },
  { userId: 'demo_user_003', type: 'bus',       co2: 240, distance: 3, filename: 'bus_commute.jpg',      daysAgo: 0 },
  { userId: 'demo_user_003', type: 'cycling',   co2: 360, distance: 3, filename: 'bike_ride.jpg',        daysAgo: 3 },
  { userId: 'demo_user_004', type: 'recycling', co2: 200, distance: 0, filename: 'recycling_day.jpg',    daysAgo: 1 },
  { userId: 'demo_user_004', type: 'cycling',   co2: 240, distance: 2, filename: 'cycle_library.jpg',   daysAgo: 4 },
  { userId: 'demo_user_005', type: 'bus',       co2: 160, distance: 2, filename: 'taking_bus.jpg',       daysAgo: 0 },
  { userId: 'demo_user_006', type: 'cycling',   co2: 120, distance: 1, filename: 'quick_cycle.jpg',      daysAgo: 2 },
  { userId: 'demo_user_007', type: 'recycling', co2: 200, distance: 0, filename: 'recycle_bottles.jpg', daysAgo: 1 },
];

function daysAgoTimestamp(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Timestamp.fromDate(d);
}

export async function seedDemoData() {
  const results = { users: 0, actions: 0, skipped: 0 };

  try {
    // Seed users
    const batch = writeBatch(db);
    for (const user of DEMO_USERS) {
      const ref = doc(db, 'users', user.uid);
      batch.set(ref, {
        name: user.name,
        email: user.email,
        xp: user.xp,
        co2Saved: user.co2Saved,
        level: user.level,
        department: user.department,
        isDemo: true,
        createdAt: Timestamp.now(),
      }, { merge: true });
      results.users++;
    }
    await batch.commit();

    // Seed actions (check for duplicates by filename)
    for (const action of DEMO_ACTIONS) {
      const q = query(
        collection(db, 'actions'),
        where('userId', '==', action.userId),
        where('filename', '==', action.filename)
      );
      const existing = await getDocs(q);
      if (!existing.empty) { results.skipped++; continue; }

      await addDoc(collection(db, 'actions'), {
        userId: action.userId,
        type: action.type,
        co2: action.co2,
        distance: action.distance,
        filename: action.filename,
        timestamp: daysAgoTimestamp(action.daysAgo),
        location: { lat: 12.9716 + Math.random() * 0.01, lng: 77.5946 + Math.random() * 0.01 },
        verified: true,
        isDemo: true,
      });
      results.actions++;
    }

    return { success: true, ...results };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
