// 1. Remove all Firebase imports and bring in your Supabase client
import { supabase } from '../supabaseClient';

const DAILY_LIMIT = 5;

export async function checkDuplicateUpload(userId, filename) {
  try {
    // Get the start of today to check the daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Query your new Supabase 'ledger_entries' table
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('id, image_url, created_at')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString()); // Only get actions from today

    if (error) {
      console.error("Error checking anti-cheat:", error.message);
      return false; // Fail open or closed depending on your preference
    }

    // Check 1: Has the user exceeded the daily limit?
    if (data && data.length >= DAILY_LIMIT) {
      console.warn("User has hit the daily upload limit.");
      return { isBlocked: true, reason: "Daily limit reached." };
    }

    // Check 2: Did they upload this exact file already today? 
    // (Assuming you save the filename or URL in the database)
    const isDuplicateFile = data.some(entry => entry.image_url && entry.image_url.includes(filename));

    if (isDuplicateFile) {
      console.warn("Duplicate image detected.");
      return { isBlocked: true, reason: "You have already uploaded this proof." };
    }

    // If they pass the checks, allow the upload
    return { isBlocked: false };

  } catch (err) {
    console.error("Anti-cheat system error:", err);
    return { isBlocked: false };
  }
}

// Export with the expected name for Upload.jsx
export async function runAntiCheatChecks(userId, filename) {
  const result = await checkDuplicateUpload(userId, filename);

  if (result.isBlocked) {
    return {
      allowed: false,
      reason: result.reason
    };
  }

  return {
    allowed: true
  };
}