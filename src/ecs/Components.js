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
    weapons: [],
    items: [],
    stats: {
      damage: 1,
      attackSpeed: 1,
      critChance: 0,
      critDamage: 1.5,
      armor: 0,
      dodge: 0,
      lifesteal: 0,
      speed: 1,
      luck: 1,
      harvesting: 1,
      engineering: 0
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
