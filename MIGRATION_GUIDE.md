# Firebase to Supabase Migration Guide

## ✅ Completed Migrations

The following files have been successfully migrated from Firebase to Supabase:

1. **src/contexts/AuthContext.jsx** - ✅ Updated to use Supabase Auth
2. **src/pages/Ledger.jsx** - ✅ Updated to use Supabase database
3. **src/pages/Dashboard.jsx** - ✅ Updated to use Supabase database  
4. **src/pages/Leaderboard.jsx** - ✅ Updated to use Supabase database
5. **src/supabaseClient.js** - ✅ Already configured
6. **.env.local** - ✅ Updated with Supabase environment variables

## 🔄 Files Still Requiring Migration

The following files still have Firebase imports and need to be updated:

### High Priority (Critical for app functionality)
1. **src/utils/saveAction.js** - Used for saving eco-actions
2. **src/pages/Rewards.jsx** - Rewards system functionality

### Medium Priority (Additional features)
3. **src/utils/aiVerification.js** - AI verification system
4. **src/utils/seedDemo.js** - Demo data seeding
5. **src/pages/Seed.jsx** - References Firebase in error messages

## 🚨 Missing Firebase Configuration

The error you're seeing occurs because these files are trying to import from `../firebase` but this file doesn't exist in your project. You have two options:

### Option 1: Complete Migration (Recommended)
Update the remaining files to use Supabase instead of Firebase.

### Option 2: Create Temporary Firebase Config
If you need Firebase for some features, create `src/firebase.js` with your Firebase configuration.

## 🔧 Quick Fix for Current Error

To immediately resolve the import error, you can either:

1. **Comment out the problematic imports** in the files that aren't critical
2. **Create a temporary firebase.js file** with stub functions
3. **Complete the migration** for the remaining files

## 📋 Next Steps

### Immediate Fix (Choose one):

#### Option A: Create Stub Firebase File
```javascript
// src/firebase.js - Temporary stub file
export const db = null;
export const saveEcoActionFn = null;
export const verifyEcoActionFn = null;

console.warn('Firebase functions are stubbed. Please complete Supabase migration.');
```

#### Option B: Update Remaining Files
Follow the patterns established in the migrated files to update:
- `src/utils/saveAction.js`
- `src/pages/Rewards.jsx`
- `src/utils/aiVerification.js`

### Long-term Solution:
1. Complete migration of all remaining files
2. Remove Firebase dependency from package.json
3. Update any remaining Firebase references
4. Test all functionality with Supabase

## 🔍 Migration Patterns

### Firebase → Supabase Patterns Used:

#### Authentication:
```javascript
// Firebase
import { onAuthStateChanged } from 'firebase/auth';

// Supabase  
import { supabase } from '../supabaseClient';
supabase.auth.onAuthStateChange()
```

#### Database Queries:
```javascript
// Firebase
import { collection, query, where, orderBy } from 'firebase/firestore';

// Supabase
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .order('column', { ascending: false });
```

#### Real-time Subscriptions:
```javascript
// Firebase
onSnapshot(query, callback);

// Supabase
supabase
  .channel('channel_name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, callback)
  .subscribe();
```

## 🎯 Recommended Action

For immediate functionality, I recommend creating the stub firebase.js file, then systematically migrating the remaining files to Supabase following the established patterns.