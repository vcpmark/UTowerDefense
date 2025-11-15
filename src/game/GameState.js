/**
 * Game State
 * Manages game state, waves, resources, and Motato-style mechanics
 */

export class GameState {
  constructor() {
    this.money = 120;
    this.lives = 20;
    this.wave = 0;
    this.enemiesRemaining = 0;
    this.kills = 0;
    this.totalEarned = 0;
    this.towersBuilt = 0;
    this.gameOver = false;
    this.difficulty = 'Normal';
    this.speedMultiplier = 1;

    // Motato-inspired mechanics
    this.hype = 0;
    this.hypeMax = 120;
    this.hypeActive = false;
    this.hypeActiveTimer = 0;
    this.hypeDuration = 8;

    this.momentum = 0;
    this.momentumMax = 100;
    this.momentumActive = false;
    this.momentumActiveTimer = 0;
    this.momentumDuration = 5.5;
    this.momentumCombo = 0;
    this.momentumLastKillTime = 0;
    this.momentumChainGrace = 0.8; // Grace period to continue chain

    this.crowdRequest = null;
    this.crowdStreak = 0;

    // Wave events
    this.activeEvent = null;
    this.eventModifiers = {
      enemyHpMult: 1,
      enemySpeedMult: 1,
      enemyRewardMult: 1,
      towerDamageMult: 1,
      towerRateMult: 1,
      towerRangeBonus: 0,
      killBonus: 0,
      hypeGainBonus: 0
    };

    // Effects
    this.lightning = [];
    this.pulses = [];

    // Balance parameters
    this.balance = {
      hpLinearSlope: 0.020846,
      hpPeriodicEvery: 10,
      hpPeriodicStep: 0.140854,
      countSlope: 0.061848,
      bossEvery: 8,
      bossLeakLives: 3,
      rewardSlope: 0.013,
      clearBase: 8,
      clearPer: 3,
      armorPerWave: 0.8,
      armorTank: 10,
      armorBoss: 20
    };
  }

  addMoney(amount) {
    this.money += amount;
    this.totalEarned += amount;
  }

  spendMoney(amount) {
    if (this.money >= amount) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.lives -= amount;
    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
    }
  }

  addKill() {
    this.kills++;

    // Update momentum chain
    const now = performance.now() / 1000;
    if (now - this.momentumLastKillTime <= this.momentumChainGrace) {
      this.momentumCombo++;
      this.momentum = Math.min(this.momentumMax, this.momentum + 5 + this.momentumCombo);
    } else {
      this.momentumCombo = 1;
      this.momentum = Math.min(this.momentumMax, this.momentum + 5);
    }
    this.momentumLastKillTime = now;

    // Activate momentum frenzy
    if (this.momentum >= this.momentumMax && !this.momentumActive) {
      this.momentumActive = true;
      this.momentumActiveTimer = this.momentumDuration;
    }

    // Update hype
    const hypeGain = 2 + this.eventModifiers.hypeGainBonus;
    this.hype = Math.min(this.hypeMax, this.hype + hypeGain);
  }

  activateHype() {
    if (this.hype >= this.hypeMax) {
      this.hypeActive = true;
      this.hypeActiveTimer = this.hypeDuration;
      this.hype = 0;
      return true;
    }
    return false;
  }

  update(dt) {
    // Update hype burst
    if (this.hypeActive) {
      this.hypeActiveTimer -= dt * this.speedMultiplier;
      if (this.hypeActiveTimer <= 0) {
        this.hypeActive = false;
        this.hypeActiveTimer = 0;
      }
    }

    // Update momentum frenzy
    if (this.momentumActive) {
      this.momentumActiveTimer -= dt * this.speedMultiplier;
      if (this.momentumActiveTimer <= 0) {
        this.momentumActive = false;
        this.momentumActiveTimer = 0;
        this.momentum = 0;
        this.momentumCombo = 0;
      }
    } else if (this.momentum > 0) {
      // Decay momentum
      this.momentum = Math.max(0, this.momentum - 12 * dt);
    }

    // Update effects
    this.updateEffects(dt);
  }

  updateEffects(dt) {
    // Update lightning effects
    this.lightning = this.lightning.filter(effect => {
      effect.elapsed += dt * this.speedMultiplier;
      return effect.elapsed < effect.duration;
    });

    // Update pulse effects
    this.pulses = this.pulses.filter(pulse => {
      pulse.ttl -= dt * this.speedMultiplier;
      if (pulse.ttl > 0) {
        pulse.r = pulse.max * (1 - pulse.ttl / pulse.life);
        return true;
      }
      return false;
    });
  }

  addLightningEffect(points, color = '#fde68a', duration = 0.15) {
    this.lightning.push({
      points,
      color,
      duration,
      elapsed: 0
    });
  }

  addPulseEffect(x, y, maxRadius, color = '#c084fc', duration = 0.7) {
    this.pulses.push({
      x,
      y,
      r: 0,
      max: maxRadius,
      ttl: duration,
      life: duration,
      color
    });
  }

  getTowerModifiers() {
    const mods = {
      damageMult: this.eventModifiers.towerDamageMult,
      rateMult: this.eventModifiers.towerRateMult,
      rangeBonus: this.eventModifiers.towerRangeBonus
    };

    // Apply hype boost
    if (this.hypeActive) {
      mods.damageMult *= 1.35;
      mods.rateMult *= 0.75;
      mods.rangeBonus += 25;
    }

    // Apply momentum frenzy
    if (this.momentumActive) {
      mods.damageMult *= 1.25;
      mods.rateMult *= 0.8;
    }

    return mods;
  }

  getEnemyModifiers() {
    return {
      hpMult: this.eventModifiers.enemyHpMult,
      speedMult: this.eventModifiers.enemySpeedMult,
      rewardMult: this.eventModifiers.enemyRewardMult
    };
  }

  calculateWaveEnemyCount(wave) {
    return Math.max(8, Math.floor(12 + wave * this.balance.countSlope));
  }

  calculateEnemyHealth(wave, isBoss = false, isTank = false) {
    let hp = 50 + wave * this.balance.hpLinearSlope * 50;

    // Periodic scaling
    const periodicBonus = Math.floor(wave / this.balance.hpPeriodicEvery);
    hp *= Math.pow(1 + this.balance.hpPeriodicStep, periodicBonus);

    if (isBoss) hp *= 3.5;
    if (isTank) hp *= 2;

    return Math.floor(hp * this.eventModifiers.enemyHpMult);
  }

  calculateEnemyArmor(wave, isBoss = false, isTank = false) {
    let armor = Math.floor(wave * this.balance.armorPerWave);
    if (isTank) armor += this.balance.armorTank;
    if (isBoss) armor += this.balance.armorBoss;
    return armor;
  }

  calculateEnemyReward(wave) {
    const base = 8 + wave * this.balance.rewardSlope;
    const bonus = this.eventModifiers.killBonus;
    return Math.floor((base + bonus) * this.eventModifiers.enemyRewardMult);
  }

  reset() {
    this.money = 120;
    this.lives = 20;
    this.wave = 0;
    this.enemiesRemaining = 0;
    this.kills = 0;
    this.totalEarned = 0;
    this.towersBuilt = 0;
    this.gameOver = false;
    this.hype = 0;
    this.hypeActive = false;
    this.momentum = 0;
    this.momentumActive = false;
    this.momentumCombo = 0;
    this.crowdStreak = 0;
    this.lightning = [];
    this.pulses = [];
  }
}
