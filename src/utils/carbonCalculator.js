// CO2 savings in grams
export const CO2_RATES = {
  cycling: 120,    // 120g per km
  bus: 80,         // 80g per km
  recycling: 200,  // 200g fixed
};

export function calculateCO2(type, distance = 0) {
  if (type === 'recycling') return CO2_RATES.recycling;
  return Math.round(CO2_RATES[type] * distance);
}

export function formatCO2(grams) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams}g`;
}

export function getCO2Description(type, distance, co2) {
  if (type === 'recycling') return `Recycling → ${formatCO2(co2)} CO₂ saved`;
  return `${distance} km ${type} → ${formatCO2(co2)} CO₂ saved`;
}
