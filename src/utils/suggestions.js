import { getLevel, getXPToNextLevel } from './xpSystem';

export function generateSuggestions(userData, recentActions = []) {
  const suggestions = [];
  const { xp = 0, co2Saved = 0 } = userData;
  const level = getLevel(xp);
  const xpToNext = getXPToNextLevel(xp);

  // Level-up suggestions
  if (xpToNext > 0) {
    if (xpToNext <= 500) {
      suggestions.push(`🚴 You're only ${xpToNext} XP away from Level ${level.level + 1}! Try cycling today.`);
    }
    if (xpToNext <= 200) {
      suggestions.push(`⚡ So close! One bus ride (80 XP) or recycling action (200 XP) will level you up!`);
    }
  }

  // CO2 milestone suggestions
  if (co2Saved < 1000) {
    suggestions.push(`🌱 Save ${1000 - co2Saved}g more CO₂ to hit your first 1kg milestone!`);
  } else if (co2Saved < 5000) {
    suggestions.push(`🌿 You've saved ${(co2Saved/1000).toFixed(1)}kg CO₂! Aim for 5kg — try cycling 5km.`);
  }

  // Action-based suggestions
  const actionTypes = recentActions.map(a => a.type);
  if (!actionTypes.includes('cycling')) {
    suggestions.push(`🚲 Try cycling! 2km cycling saves 240g CO₂ and earns 240 XP.`);
  }
  if (!actionTypes.includes('bus')) {
    suggestions.push(`🚌 Take the bus twice this week → save ~320g CO₂ and boost your rank!`);
  }
  if (!actionTypes.includes('recycling')) {
    suggestions.push(`♻️ A recycling action gives you an instant 200 XP — do it today!`);
  }

  // General tips
  const generalTips = [
    '🌍 Share your green actions to inspire others on the leaderboard!',
    '☀️ Morning cycling sessions give you the best CO₂ savings of the day.',
    '🏆 Top 3 on the leaderboard get special campus rewards this month!',
    '💡 Consistency beats intensity — log one action daily for max XP.',
  ];

  suggestions.push(generalTips[Math.floor(Math.random() * generalTips.length)]);

  return suggestions.slice(0, 4);
}
