/**
 * AI Verification - Client-side fallback
 * TODO: Implement Gemini AI verification via Supabase Edge Function
 */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clientFallback(filename, actionType) {
  const name = (filename || '').toLowerCase();
  if (name.includes('cycle') || name.includes('bike') || name.includes('bicycle'))
    return { verified: true, type: 'cycling', confidence: 0.8, reason: 'Filename match' };
  if (name.includes('bus') || name.includes('transit'))
    return { verified: true, type: 'bus', confidence: 0.8, reason: 'Filename match' };
  if (name.includes('recycle') || name.includes('recycl') || name.includes('waste'))
    return { verified: true, type: 'recycling', confidence: 0.8, reason: 'Filename match' };
  return { verified: true, type: actionType, confidence: 0.6, reason: 'Verified by selected type' };
}

export async function verifyAction(file, actionType) {
  // Simulate minimum analysis delay for UX
  await new Promise(r => setTimeout(r, 1500));

  try {
    // For now, use client-side fallback
    // In production, this would call Gemini AI via Supabase Edge Function
    console.log('AI Verification using client fallback for:', actionType);
    return clientFallback(file?.name || '', actionType);

  } catch (err) {
    console.warn('Verification failed, using fallback:', err.message);
    return clientFallback(file?.name || '', actionType);
  }
}
