export const LEVELS = [
  { level: 1, min: 0,    max: 500,  label: 'Eco Rookie',   color: '#A3E635' },
  { level: 2, min: 500,  max: 1500, label: 'Green Warrior', color: '#60A5FA' },
  { level: 3, min: 1500, max: Infinity, label: 'Carbon Hero', color: '#FB7185' },
];

export function getLevel(xp) {
  return LEVELS.find(l => xp >= l.min && xp < l.max) || LEVELS[LEVELS.length - 1];
}

export function getLevelProgress(xp) {
  const lvl = getLevel(xp);
  if (lvl.max === Infinity) return 100;
  const range = lvl.max - lvl.min;
  const progress = xp - lvl.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function getXPToNextLevel(xp) {
  const lvl = getLevel(xp);
  if (lvl.max === Infinity) return 0;
  return lvl.max - xp;
}

export function getLevelBadge(level) {
  const badges = { 1: '🌱', 2: '🌿', 3: '🏆' };
  return badges[level] || '🌱';
}
