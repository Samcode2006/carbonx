/**
 * Save eco action via Supabase database.
 * Server-side validation handled by RLS policies and triggers.
 */
import { supabase } from '../supabaseClient';

export async function saveAction({ userId, type, co2, distance, filename, fileType, location, userData }) {
  try {
    // Calculate XP (1:1 ratio with CO2 grams for now)
    const xpEarned = Math.round(co2);

    // Determine verification method
    let verificationMethod = 'Manual';
    if (filename) {
      verificationMethod = 'AI Image';
    }

    // Create ledger entry
    const { data: ledgerData, error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert([{
        user_id: userId,
        action_type: type,
        co2_saved: co2 / 1000, // Convert grams to kg for database
        xp_earned: xpEarned,
        verification_method: verificationMethod,
        image_url: filename ? `eco-proofs/${userId}/${filename}` : null,
        metadata: {
          distance_km: distance || null,
          location: location || null,
          file_type: fileType || null,
        }
      }])
      .select()
      .single();

    if (ledgerError) {
      console.error('Error saving action:', ledgerError);

      // Handle specific error cases
      if (ledgerError.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Duplicate action detected.' };
      }

      return { success: false, error: ledgerError.message };
    }

    // The database trigger will automatically update user totals
    // So we don't need to manually update the users table

    // Calculate new level based on updated XP
    const newTotalXP = (userData?.xp || 0) + xpEarned;
    const newLevel = Math.floor(newTotalXP / 100) + 1;

    return {
      success: true,
      via: 'supabase-database',
      co2Awarded: co2,
      xpAwarded: xpEarned,
      newLevel,
      ledgerEntryId: ledgerData.id
    };

  } catch (error) {
    console.error('Unexpected error saving action:', error);
    return { success: false, error: error.message };
  }
}
