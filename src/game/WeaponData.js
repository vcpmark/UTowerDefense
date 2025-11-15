/**
 * Weapon Data Definitions
 * Based on Motato weapon system
 */

export const WeaponDefinitions = {
  // TIER 1 - Common Weapons
  'stick': {
    name: 'Stick',
    tier: 1,
    weaponType: 'melee',
    attackType: 'ranged',
    damage: 5,
    rate: 1.42,
    range: 100,
    projectileSpeed: 250,
    pierce: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 100, ranged: 0, elemental: 0 },
    color: '#8b7355'
  },

  'rock': {
    name: 'Rock',
    tier: 1,
    weaponType: 'ranged',
    attackType: 'ranged',
    damage: 5,
    rate: 1.67,
    range: 200,
    projectileSpeed: 200,
    pierce: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 100, elemental: 0 },
    color: '#78716c'
  },

  'ghost_flint': {
    name: 'Ghost Flint',
    tier: 1,
    weaponType: 'ranged',
    attackType: 'ranged',
    damage: 3,
    rate: 0.94,
    range: 200,
    projectileSpeed: 300,
    pierce: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 100, elemental: 0 },
    color: '#c7d2fe'
  },

  'torch': {
    name: 'Torch',
    tier: 1,
    weaponType: 'elemental',
    attackType: 'ranged',
    damage: 4,
    rate: 1.42,
    range: 125,
    projectileSpeed: 200,
    pierce: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 0, elemental: 100 },
    color: '#fb923c'
  },

  // TIER 2 - Uncommon Weapons
  'wrench': {
    name: 'Wrench',
    tier: 2,
    weaponType: 'melee',
    attackType: 'ranged',
    damage: 10,
    rate: 1.67,
    range: 125,
    projectileSpeed: 300,
    pierce: 0,
    critChance: 0,
    critDamage: 0.5,
    knockback: 5,
    lifesteal: 0,
    scaling: { melee: 100, ranged: 0, elemental: 0 },
    color: '#94a3b8'
  },

  'shuriken': {
    name: 'Shuriken',
    tier: 2,
    weaponType: 'ranged',
    attackType: 'ranged',
    damage: 8,
    rate: 0.71,
    range: 250,
    projectileSpeed: 450,
    pierce: 1,
    critChance: 5,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 100, elemental: 0 },
    color: '#94a3b8'
  },

  'double_barrel_shotgun': {
    name: 'Double Barrel Shotgun',
    tier: 2,
    weaponType: 'ranged',
    attackType: 'ranged',
    damage: 15,
    rate: 2.5,
    range: 150,
    projectileSpeed: 350,
    pierce: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 10,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 100, elemental: 0 },
    color: '#78350f'
  },

  'wand': {
    name: 'Wand',
    tier: 2,
    weaponType: 'elemental',
    attackType: 'ranged',
    damage: 10,
    rate: 1.25,
    range: 200,
    projectileSpeed: 300,
    pierce: 2,
    critChance: 0,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 0, elemental: 100 },
    color: '#8b5cf6'
  },

  // TIER 3 - Rare Weapons
  'plasma_sledgehammer': {
    name: 'Plasma Sledgehammer',
    tier: 3,
    weaponType: 'melee',
    attackType: 'ranged',
    damage: 30,
    rate: 2.5,
    range: 175,
    projectileSpeed: 250,
    pierce: 0,
    critChance: 0,
    critDamage: 1.0,
    knockback: 20,
    lifesteal: 0,
    scaling: { melee: 100, ranged: 0, elemental: 25 },
    color: '#06b6d4'
  },

  'crossbow': {
    name: 'Crossbow',
    tier: 3,
    weaponType: 'ranged',
    attackType: 'ranged',
    damage: 30,
    rate: 2.0,
    range: 350,
    projectileSpeed: 500,
    pierce: 3,
    critChance: 10,
    critDamage: 1.0,
    knockback: 5,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 100, elemental: 0 },
    color: '#92400e'
  },

  'lightning_shiv': {
    name: 'Lightning Shiv',
    tier: 3,
    weaponType: 'elemental',
    attackType: 'ranged',
    damage: 20,
    rate: 0.5,
    range: 225,
    projectileSpeed: 600,
    pierce: 4,
    critChance: 5,
    critDamage: 0,
    knockback: 0,
    lifesteal: 0,
    scaling: { melee: 25, ranged: 25, elemental: 100 },
    color: '#fde047'
  },

  // TIER 4 - Legendary Weapons
  'excalibur': {
    name: 'Excalibur',
    tier: 4,
    weaponType: 'melee',
    attackType: 'ranged',
    damage: 50,
    rate: 1.67,
    range: 225,
    projectileSpeed: 400,
    pierce: 1,
    critChance: 15,
    critDamage: 1.5,
    knockback: 10,
    lifesteal: 5,
    scaling: { melee: 100, ranged: 50, elemental: 0 },
    color: '#fbbf24'
  },

  'minigun': {
    name: 'Minigun',
    tier: 2,
    weaponType: 'ranged',
    attackType: 'ranged',
    damage: 5,
    rate: 0.15,
    range: 250,
    projectileSpeed: 500,
    pierce: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 1,
    lifesteal: 0,
    scaling: { melee: 0, ranged: 100, elemental: 0 },
    color: '#374151'
  }
};

/**
 * Get a weapon definition by key
 */
export function getWeapon(key) {
  return WeaponDefinitions[key] ? { ...WeaponDefinitions[key] } : null;
}

/**
 * Get all weapons of a specific tier
 */
export function getWeaponsByTier(tier) {
  return Object.entries(WeaponDefinitions)
    .filter(([_, weapon]) => weapon.tier === tier)
    .map(([key, weapon]) => ({ key, ...weapon }));
}

/**
 * Get all weapons of a specific type
 */
export function getWeaponsByType(type) {
  return Object.entries(WeaponDefinitions)
    .filter(([_, weapon]) => weapon.weaponType === type)
    .map(([key, weapon]) => ({ key, ...weapon }));
}

/**
 * Calculate final weapon damage with player stats
 */
export function calculateWeaponDamage(weaponDef, playerStats) {
  let damage = weaponDef.damage;

  // Apply type-specific scaling
  const meleeDamageBonus = (weaponDef.scaling.melee / 100) * playerStats.meleeDamage;
  const rangedDamageBonus = (weaponDef.scaling.ranged / 100) * playerStats.rangedDamage;
  const elementalDamageBonus = (weaponDef.scaling.elemental / 100) * playerStats.elementalDamage;

  damage += meleeDamageBonus + rangedDamageBonus + elementalDamageBonus;

  // Apply global damage multiplier
  damage *= (1 + playerStats.damage / 100);

  return Math.max(1, Math.floor(damage));
}

/**
 * Calculate final weapon attack speed
 */
export function calculateAttackSpeed(baseRate, playerStats) {
  return baseRate / playerStats.attackSpeed;
}

/**
 * Calculate critical hit
 */
export function rollCritical(weaponCritChance, playerCritChance) {
  const totalCritChance = Math.min(100, weaponCritChance + playerCritChance);
  return Math.random() * 100 < totalCritChance;
}

/**
 * Calculate critical damage multiplier
 */
export function getCritMultiplier(weaponCritDamage, playerCritDamage) {
  return 1 + weaponCritDamage + playerCritDamage;
}
