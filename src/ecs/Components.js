/**
 * Component Definitions
 * All component types used in the game
 */

// Component type constants
export const ComponentType = {
  TRANSFORM: 'transform',
  VELOCITY: 'velocity',
  SPRITE: 'sprite',
  CIRCLE: 'circle',
  HEALTH: 'health',
  TOWER: 'tower',
  ENEMY: 'enemy',
  BULLET: 'bullet',
  PLAYER: 'player',
  WEAPON: 'weapon',
  LIFETIME: 'lifetime',
  COLLISION: 'collision',
  AURA: 'aura',
  EFFECTS: 'effects'
};

// Transform component
export function Transform(x = 0, y = 0, rotation = 0, scale = 1) {
  return { x, y, rotation, scale };
}

// Velocity component
export function Velocity(vx = 0, vy = 0, maxSpeed = Infinity) {
  return { vx, vy, maxSpeed };
}

// Sprite rendering component
export function Sprite(emoji, color, size = 20) {
  return { emoji, color, size };
}

// Circle rendering component
export function Circle(radius, color, fill = true, lineWidth = 2) {
  return { radius, color, fill, lineWidth };
}

// Health component
export function Health(current, max, armor = 0) {
  return { current, max, armor, lastDamageTime: 0 };
}

// Tower component
export function Tower(type, range, damage, rate, pierce = 0) {
  return {
    type,
    range,
    damage,
    rate,
    pierce,
    level: 1,
    cost: 0,
    upgradeCost: 0,
    cooldown: 0,
    target: null,
    kills: 0,
    damageDealt: 0,
    bullet: null,
    chainTargets: 0,
    chainRange: 0,
    chainFalloff: 1
  };
}

// Enemy component
export function Enemy(type, speed, reward, pathProgress = 0) {
  return {
    type,
    speed,
    baseSpeed: speed,
    reward,
    pathProgress,
    slowed: false,
    slowFactor: 1,
    slowEndTime: 0,
    reachedEnd: false
  };
}

// Bullet/Projectile component
export function Bullet(damage, speed, pierce = 0, target = null) {
  return {
    damage,
    speed,
    pierce,
    pierceCount: 0,
    target,
    splashRadius: 0,
    splashFalloff: 1,
    slow: null,
    chain: false,
    chainTargets: 0,
    chainRange: 0,
    chainFalloff: 1,
    hitEnemies: new Set()
  };
}

// Player component (for Brotato-style gameplay)
export function Player(speed, health, maxHealth) {
  return {
    speed,
    health,
    maxHealth,
    xp: 0,
    level: 1,
    weaponSlots: 6,
    weapons: [],
    weaponEntities: [], // Weapon entity references
    items: [],
    stats: {
      // Damage stats
      damage: 0,              // % damage increase to all weapons
      meleeDamage: 0,         // Bonus damage for melee weapons
      rangedDamage: 0,        // Bonus damage for ranged weapons
      elementalDamage: 0,     // Bonus damage for elemental weapons
      critChance: 0,          // % chance to crit (0-100)
      critDamage: 1.5,        // Crit damage multiplier
      attackSpeed: 1,         // Attack speed multiplier

      // Defense stats
      maxHP: 100,
      armor: 0,               // Damage reduction
      dodge: 0,               // % chance to dodge (0-60)
      hpRegen: 0,             // HP regeneration per second
      lifesteal: 0,           // % chance to heal 1 HP on hit

      // Utility stats
      speed: 1,               // Movement speed multiplier
      range: 0,               // Range bonus for all weapons
      luck: 0,                // Affects drops and shop
      harvesting: 1,          // XP and materials multiplier
      engineering: 0,         // Structure/turret bonus

      // Secondary stats
      pierce: 0,              // Additional pierce for projectiles
      knockback: 0,           // Knockback force
      pickup: 0,              // Pickup range bonus
      bounce: 0              // Projectile bounce count
    }
  };
}

// Weapon component (attached weapons)
export function Weapon(name, weaponType, damage, rate, range, projectileSpeed, pierce = 0) {
  return {
    name,               // Weapon name (e.g., "Stick", "Ghost Flint")
    weaponType,         // 'melee', 'ranged', or 'elemental'
    attackType: 'ranged', // 'melee' or 'ranged' (how it fires)
    damage,             // Base damage
    rate,               // Attack rate (seconds between attacks)
    range,              // Attack range
    projectileSpeed,    // Speed of projectiles
    pierce,             // Pierce count
    cooldown: 0,        // Current cooldown
    target: null,       // Current target
    aimingRange: range * 1.2, // Detection range
    rotation: 0,        // Current rotation
    offsetX: 10,        // Offset from player X
    offsetY: 0,         // Offset from player Y
    tier: 1,            // Weapon tier (1-4)
    critChance: 0,      // Weapon-specific crit chance bonus
    critDamage: 0,      // Weapon-specific crit damage bonus
    lifesteal: 0,       // Weapon-specific lifesteal
    knockback: 0,       // Weapon knockback
    scaling: {          // Stat scaling percentages
      melee: 100,       // % of melee damage to apply
      ranged: 100,      // % of ranged damage to apply
      elemental: 0      // % of elemental damage to apply
    }
  };
}

// Lifetime component (for particles, effects)
export function Lifetime(duration, elapsed = 0) {
  return { duration, elapsed };
}

// Collision component
export function Collision(radius, layer = 0, mask = -1) {
  return { radius, layer, mask, colliding: [] };
}

// Aura component (for support towers)
export function Aura(range, damageMult = 1, rateMult = 1, rangeBonus = 0) {
  return { range, damageMult, rateMult, rangeBonus };
}

// Visual effects component
export function Effects(effects = []) {
  return { effects };
}

// Effect types
export function PulseEffect(maxRadius, duration, color) {
  return {
    type: 'pulse',
    radius: 0,
    maxRadius,
    duration,
    elapsed: 0,
    color
  };
}

export function LightningEffect(points, duration, color) {
  return {
    type: 'lightning',
    points,
    duration,
    elapsed: 0,
    color,
    width: 2
  };
}

export function TrailEffect(points, maxLength, color) {
  return {
    type: 'trail',
    points,
    maxLength,
    color,
    width: 2
  };
}
