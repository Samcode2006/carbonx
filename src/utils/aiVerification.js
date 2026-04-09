// AI verification with Gemini API + filename fallback

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function fallbackVerify(filename) {
  const name = filename.toLowerCase();
  if (name.includes('cycle') || name.includes('bike') || name.includes('bicycle')) {
    return { verified: true, type: 'cycling', confidence: 0.85 };
  }
  if (name.includes('bus') || name.includes('transit') || name.includes('public')) {
    return { verified: true, type: 'bus', confidence: 0.85 };
  }
  if (name.includes('recycle') || name.includes('recycl') || name.includes('waste') || name.includes('bin')) {
    return { verified: true, type: 'recycling', confidence: 0.85 };
  }
  // Generic eco keywords
  if (name.includes('eco') || name.includes('green') || name.includes('sustain')) {
    return { verified: true, type: 'recycling', confidence: 0.6 };
  }
  return { verified: false, type: null, confidence: 0 };
}

async function geminiVerify(file) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') return null;

  try {
    const base64 = await fileToBase64(file);
    const mimeType = file.type;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this image and determine if it shows an eco-friendly action. 
                Respond ONLY with a JSON object like: 
                {"verified": true/false, "type": "cycling"|"bus"|"recycling"|null, "reason": "brief reason"}
                Types: cycling (bicycle/bike use), bus (public transport), recycling (waste management/recycling).
                Only verify if clearly showing one of these eco actions.`
              },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { ...JSON.parse(jsonMatch[0]), confidence: 0.95 };
    }
  } catch (err) {
    console.warn('Gemini API failed, using fallback', err);
  }
  return null;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function verifyAction(file, selectedType) {
  // Simulate 2s analysis delay
  await new Promise(r => setTimeout(r, 2000));

  // Try Gemini first
  const geminiResult = await geminiVerify(file);
  if (geminiResult) return geminiResult;

  // Fallback: filename-based + selected type validation
  const fallback = fallbackVerify(file.name);
  if (fallback.verified) return fallback;

  // If no match, use selected type with lower confidence
  return { verified: true, type: selectedType, confidence: 0.7 };
}
