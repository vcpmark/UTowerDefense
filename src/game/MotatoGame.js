/**
 * Motato-Style Game
 * Top-down wave survival with auto-attacking weapons
 */

import { Engine } from '../core/Engine.js';
import { WebGLRenderer } from '../renderer/WebGLRenderer.js';
import { TextureLoader } from '../renderer/TextureLoader.js';
import { EntityManager } from '../ecs/Entity.js';
import { ComponentType, Transform, Circle, Health, Velocity, Player, Enemy, Bullet, Weapon, Lifetime, Effects, PulseEffect } from '../ecs/Components.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { GameState } from './GameState.js';
import { getWeapon, calculateWeaponDamage, calculateAttackSpeed, rollCritical, getCritMultiplier } from './WeaponData.js';

export class MotatoGame {
  constructor(canvas, diagnosticCallback = null) {
    this.canvas = canvas;
    this.diagnostic = diagnosticCallback || ((msg) => console.log(msg));

    this.diagnostic('Initializing WebGL renderer...');
    this.renderer = new WebGLRenderer(canvas);
    this.diagnostic('WebGL renderer created');

    this.diagnostic('Creating texture loader...');
    this.textureLoader = new TextureLoader(this.renderer.gl);
    this.diagnostic('Texture loader created');

    this.diagnostic('Creating game engine...');
    this.engine = new Engine(canvas);
    this.diagnostic('Game engine created');

    this.diagnostic('Creating entity manager...');
    this.entityManager = new EntityManager();
    this.diagnostic('Entity manager created');

    this.diagnostic('Creating game state...');
    this.gameState = new GameState();
    this.diagnostic('Game state created');

    // Game bounds
    this.bounds = {
      minX: 50,
      maxX: canvas.width - 50,
      minY: 50,
      maxY: canvas.height - 50
    };

    // Input state
    this.keys = {};
    this.moveDir = { x: 0, y: 0 };

    // Player entity reference
    this.playerEntity = null;

    // Wave state
    this.waveActive = false;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;

    // Textures
    this.textures = {};
  }

  async init() {
    try {
      // Load textures
      this.diagnostic('Loading game assets...');
      await this.loadAssets();
      this.diagnostic('Assets loaded successfully');

      // Add systems
      this.diagnostic('Creating physics system...');
      this.physicsSystem = new PhysicsSystem(this.entityManager);
      this.diagnostic('Physics system created');

      this.diagnostic('Creating render system...');
      this.renderSystem = new RenderSystem(this.renderer, this.entityManager);
      this.diagnostic('Render system created');

      this.diagnostic('Registering game systems...');
      this.engine.addSystem(this.physicsSystem, 'update');
      this.engine.addSystem(this, 'update'); // Add game logic
      this.engine.addSystem(this.renderSystem, 'render');
      this.diagnostic('Systems registered with engine');

      // Create player
      this.diagnostic('Creating player entity...');
      this.createPlayer();
      this.diagnostic('Player entity created');

      // Set up input
      this.diagnostic('Setting up input handlers...');
      this.setupInput();
      this.diagnostic('Input handlers configured');

      // Start engine
      this.diagnostic('Starting game engine...');
      this.engine.start();
      this.diagnostic('✅ Game engine running - initialization complete!');
    } catch (error) {
      this.diagnostic(`❌ CRITICAL ERROR during init: ${error.message}`, true);
      this.diagnostic(`   Stack trace: ${error.stack}`, true);
      throw error; // Re-throw to be caught by HTML error handler
    }
  }

  async loadAssets() {
    const assetsToLoad = [
      { key: 'player', path: 'assets/sprites/player/potato.png' },
      { key: 'playerLegs', path: 'assets/sprites/player/legs.png' },
      { key: 'enemy', path: 'assets/sprites/enemies/1.png' },
      { key: 'bullet', path: 'assets/sprites/bullets/frame0000.png' }
    ];

    this.diagnostic(`Loading ${assetsToLoad.length} assets in parallel...`);
    this.diagnostic(`Texture loader status: ${this.textureLoader ? 'initialized' : 'NOT initialized'}`);
    this.diagnostic(`WebGL context status: ${this.renderer.gl ? 'available' : 'NOT available'}`);

    // Load all assets in parallel for better performance
    const loadPromises = assetsToLoad.map(async (asset, index) => {
      try {
        this.diagnostic(`[${index + 1}/${assetsToLoad.length}] Starting load: ${asset.key} from ${asset.path}...`);
        const startTime = performance.now();
        const texture = await this.textureLoader.loadTexture(asset.path);
        const loadTime = (performance.now() - startTime).toFixed(2);
        this.diagnostic(`✓ Loaded ${asset.key} in ${loadTime}ms`);
        return { key: asset.key, texture, success: true, error: null };
      } catch (error) {
        this.diagnostic(`❌ Failed to load ${asset.key}: ${error.message}`, true);
        this.diagnostic(`   Error stack: ${error.stack}`, true);
        return { key: asset.key, texture: null, success: false, error: error.message };
      }
    });

    this.diagnostic(`Waiting for all ${assetsToLoad.length} assets to complete...`);

    // Wait for all assets to load (or fail)
    const results = await Promise.all(loadPromises);

    this.diagnostic(`All promises resolved. Processing results...`);

    // Store the results
    for (const result of results) {
      this.textures[result.key] = result.texture;
      if (!result.success) {
        this.diagnostic(`⚠ Asset ${result.key} failed: ${result.error}`, true);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    this.diagnostic(`Asset loading complete: ${successCount} succeeded, ${failureCount} failed`);

    if (failureCount > 0) {
      this.diagnostic(`⚠ Warning: ${failureCount} assets failed to load. Game may have visual issues.`);
    }
  }

  createPlayer() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.playerEntity = this.entityManager.createEntity();
    const playerStats = Player(200, 100, 100);

    // Set initial stats
    playerStats.stats.maxHP = 100;
    playerStats.stats.rangedDamage = 5;
    playerStats.stats.attackSpeed = 1.2;

    this.playerEntity
      .addComponent(ComponentType.TRANSFORM, Transform(centerX, centerY))
      .addComponent(ComponentType.VELOCITY, Velocity(0, 0, 200))
      .addComponent(ComponentType.HEALTH, Health(playerStats.stats.maxHP, playerStats.stats.maxHP))
      .addComponent(ComponentType.CIRCLE, Circle(16, '#fbbf24', true))
      .addComponent(ComponentType.PLAYER, playerStats)
      .addTag('player');

    // Add starter weapons
    this.addWeaponToPlayer('stick', 12, -6);
    this.addWeaponToPlayer('stick', 12, 6);
  }

  addWeaponToPlayer(weaponKey, offsetX, offsetY) {
    const weaponDef = getWeapon(weaponKey);
    if (!weaponDef) {
      console.warn(`Unknown weapon: ${weaponKey}`);
      return null;
    }

    const weaponEntity = this.entityManager.createEntity();
    const weaponComp = Weapon(
      weaponDef.name,
      weaponDef.weaponType,
      weaponDef.damage,
      weaponDef.rate,
      weaponDef.range,
      weaponDef.projectileSpeed,
      weaponDef.pierce
    );

    // Copy additional properties from definition
    weaponComp.tier = weaponDef.tier;
    weaponComp.critChance = weaponDef.critChance;
    weaponComp.critDamage = weaponDef.critDamage;
    weaponComp.knockback = weaponDef.knockback;
    weaponComp.lifesteal = weaponDef.lifesteal;
    weaponComp.scaling = weaponDef.scaling;
    weaponComp.offsetX = offsetX;
    weaponComp.offsetY = offsetY;

    weaponEntity
      .addComponent(ComponentType.TRANSFORM, Transform(0, 0, 0, 0.8))
      .addComponent(ComponentType.WEAPON, weaponComp)
      .addComponent(ComponentType.CIRCLE, Circle(6, weaponDef.color, true))
      .addTag('weapon');

    const player = this.playerEntity.getComponent(ComponentType.PLAYER);
    player.weaponEntities.push(weaponEntity);

    return weaponEntity;
  }

  setupInput() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(dt) {
    // Update entity manager
    this.entityManager.update();

    // Update game state
    this.gameState.update(dt);

    // Update player stats and regeneration
    this.updatePlayerStats(dt);

    // Update player movement
    this.updatePlayerMovement(dt);

    // Update weapons
    this.updateWeapons(dt);

    // Update enemies
    this.updateEnemies(dt);

    // Update bullets
    this.updateBullets(dt);

    // Update lifetime entities (effects, temporary objects)
    this.updateLifetimeEntities(dt);

    // Check collisions
    this.checkCollisions();

    // Update wave spawning
    if (this.waveActive) {
      this.updateWaveSpawning(dt);
    }

    // Check wave completion
    const enemies = this.entityManager.getEntitiesWithTag('enemy');
    if (this.waveActive && enemies.length === 0 && this.waveTimer <= 0) {
      this.onWaveComplete();
    }
  }

  updatePlayerStats(dt) {
    if (!this.playerEntity) return;

    const player = this.playerEntity.getComponent(ComponentType.PLAYER);
    const health = this.playerEntity.getComponent(ComponentType.HEALTH);

    // Update max HP from stats
    health.max = player.stats.maxHP;

    // Apply HP regeneration
    if (player.stats.hpRegen > 0) {
      health.current = Math.min(health.max, health.current + player.stats.hpRegen * dt);
    }

    // Update armor from stats
    health.armor = player.stats.armor;
  }

  updateLifetimeEntities(dt) {
    const entities = this.entityManager.entities;
    for (const entity of entities) {
      const lifetime = entity.getComponent(ComponentType.LIFETIME);
      if (lifetime) {
        lifetime.elapsed += dt * this.gameState.speedMultiplier;
        if (lifetime.elapsed >= lifetime.duration) {
          this.entityManager.removeEntity(entity);
        }
      }
    }
  }

  updatePlayerMovement(dt) {
    if (!this.playerEntity) return;

    const velocity = this.playerEntity.getComponent(ComponentType.VELOCITY);
    const player = this.playerEntity.getComponent(ComponentType.PLAYER);
    const transform = this.playerEntity.getComponent(ComponentType.TRANSFORM);

    // Calculate movement direction from input
    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Normalize diagonal movement
    const mag = Math.sqrt(moveX * moveX + moveY * moveY);
    if (mag > 0) {
      moveX /= mag;
      moveY /= mag;
    }

    // Apply speed
    const speed = player.speed * player.stats.speed;
    velocity.vx = moveX * speed;
    velocity.vy = moveY * speed;

    // Keep player in bounds
    transform.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, transform.x));
    transform.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, transform.y));
  }

  updateWeapons(dt) {
    if (!this.playerEntity) return;

    const player = this.playerEntity.getComponent(ComponentType.PLAYER);
    const playerTransform = this.playerEntity.getComponent(ComponentType.TRANSFORM);
    const enemies = this.entityManager.getEntitiesWithTag('enemy');

    // Update weapon entities
    for (const weaponEntity of player.weaponEntities) {
      const weapon = weaponEntity.getComponent(ComponentType.WEAPON);
      const weaponTransform = weaponEntity.getComponent(ComponentType.TRANSFORM);

      // Position weapon relative to player
      const angle = weapon.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      weaponTransform.x = playerTransform.x + weapon.offsetX * cos - weapon.offsetY * sin;
      weaponTransform.y = playerTransform.y + weapon.offsetX * sin + weapon.offsetY * cos;
      weaponTransform.rotation = weapon.rotation;

      // Apply attack speed to cooldown
      const attackSpeedMult = player.stats.attackSpeed;
      weapon.cooldown -= dt * this.gameState.speedMultiplier * attackSpeedMult;

      // Calculate effective range with player range bonus
      const effectiveRange = weapon.range + player.stats.range;
      const effectiveAimRange = effectiveRange * 1.2;

      const target = this.findNearestEnemy(weaponTransform, effectiveAimRange, enemies);

      if (target) {
        const targetTransform = target.getComponent(ComponentType.TRANSFORM);
        const dx = targetTransform.x - weaponTransform.x;
        const dy = targetTransform.y - weaponTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Rotate weapon to aim at target
        weapon.rotation = Math.atan2(dy, dx);
        weapon.target = target;

        // Fire if in range and cooldown ready
        if (weapon.cooldown <= 0 && dist <= effectiveRange) {
          this.fireWeapon(weaponTransform, weapon, target, player);
          weapon.cooldown = weapon.rate;
        }
      } else {
        // Reset to default rotation
        weapon.rotation = 0;
        weapon.target = null;
      }
    }
  }

  findNearestEnemy(transform, range, enemies) {
    let nearest = null;
    let minDistSq = range * range;

    for (const enemy of enemies) {
      const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);
      const dx = enemyTransform.x - transform.x;
      const dy = enemyTransform.y - transform.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = enemy;
      }
    }

    return nearest;
  }

  fireWeapon(weaponTransform, weapon, target, player) {
    const targetTransform = target.getComponent(ComponentType.TRANSFORM);

    // Calculate direction
    const dx = targetTransform.x - weaponTransform.x;
    const dy = targetTransform.y - weaponTransform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Calculate base damage with scaling
    let finalDamage = weapon.damage;

    // Apply stat-based scaling
    const stats = player.stats;
    const meleeDamageBonus = (weapon.scaling.melee / 100) * stats.meleeDamage;
    const rangedDamageBonus = (weapon.scaling.ranged / 100) * stats.rangedDamage;
    const elementalDamageBonus = (weapon.scaling.elemental / 100) * stats.elementalDamage;

    finalDamage += meleeDamageBonus + rangedDamageBonus + elementalDamageBonus;

    // Apply global damage multiplier
    finalDamage *= (1 + stats.damage / 100);

    // Check for critical hit
    const isCrit = rollCritical(weapon.critChance, stats.critChance);
    if (isCrit) {
      const critMult = getCritMultiplier(weapon.critDamage, stats.critDamage);
      finalDamage *= critMult;
    }

    // Calculate final pierce
    const finalPierce = weapon.pierce + stats.pierce;

    // Determine bullet color based on weapon type and crit
    let bulletColor = '#facc15';
    if (isCrit) {
      bulletColor = '#ff6b6b';
    } else if (weapon.weaponType === 'elemental') {
      bulletColor = '#8b5cf6';
    } else if (weapon.weaponType === 'melee') {
      bulletColor = '#94a3b8';
    }

    // Create bullet
    const bullet = this.entityManager.createEntity();
    bullet
      .addComponent(ComponentType.TRANSFORM, Transform(weaponTransform.x, weaponTransform.y))
      .addComponent(ComponentType.VELOCITY, Velocity(dirX * weapon.projectileSpeed, dirY * weapon.projectileSpeed))
      .addComponent(ComponentType.BULLET, Bullet(finalDamage, weapon.projectileSpeed, finalPierce, target))
      .addComponent(ComponentType.CIRCLE, Circle(isCrit ? 6 : 4, bulletColor, true))
      .addComponent(ComponentType.LIFETIME, Lifetime(3)) // Bullets last 3 seconds max
      .addTag('bullet');

    // Add lifesteal property
    const bulletComp = bullet.getComponent(ComponentType.BULLET);
    bulletComp.lifesteal = weapon.lifesteal + stats.lifesteal;
    bulletComp.isCrit = isCrit;

    // Add muzzle flash effect
    this.createMuzzleFlash(weaponTransform.x, weaponTransform.y, isCrit ? '#ff6b6b' : '#fef08a');
  }

  createMuzzleFlash(x, y, color = '#fef08a') {
    const flash = this.entityManager.createEntity();
    flash
      .addComponent(ComponentType.TRANSFORM, Transform(x, y))
      .addComponent(ComponentType.CIRCLE, Circle(8, color, true))
      .addComponent(ComponentType.LIFETIME, Lifetime(0.1))
      .addTag('effect');
  }

  updateEnemies(dt) {
    if (!this.playerEntity) return;

    const playerTransform = this.playerEntity.getComponent(ComponentType.TRANSFORM);
    const enemies = this.entityManager.getEntitiesWithTag('enemy');

    for (const enemy of enemies) {
      const enemyComp = enemy.getComponent(ComponentType.ENEMY);
      const transform = enemy.getComponent(ComponentType.TRANSFORM);
      const velocity = enemy.getComponent(ComponentType.VELOCITY);
      const health = enemy.getComponent(ComponentType.HEALTH);

      // Move towards player
      const dx = playerTransform.x - transform.x;
      const dy = playerTransform.y - transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 20) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        const speed = enemyComp.speed * enemyComp.slowFactor * this.gameState.speedMultiplier;
        velocity.vx = dirX * speed;
        velocity.vy = dirY * speed;
      } else {
        velocity.vx = 0;
        velocity.vy = 0;

        // Damage player
        const playerHealth = this.playerEntity.getComponent(ComponentType.HEALTH);
        const damagePerSecond = 5 + this.gameState.wave * 0.5;
        playerHealth.current -= damagePerSecond * dt;
        if (playerHealth.current <= 0) {
          this.gameState.gameOver = true;
        }
      }

      // Update slow effect
      if (enemyComp.slowed) {
        const now = performance.now() / 1000;
        if (now >= enemyComp.slowEndTime) {
          enemyComp.slowed = false;
          enemyComp.slowFactor = 1;
        }
      }

      // Visual flash when hit recently
      const circle = enemy.getComponent(ComponentType.CIRCLE);
      if (circle) {
        const timeSinceHit = (performance.now() / 1000) - health.lastDamageTime;
        if (timeSinceHit < 0.1) {
          circle.color = '#f0abfc'; // Bright flash
        } else {
          circle.color = '#8b5cf6'; // Normal color
        }
      }
    }
  }

  updateBullets(dt) {
    const bullets = this.entityManager.getEntitiesWithTag('bullet');

    for (const bullet of bullets) {
      const transform = bullet.getComponent(ComponentType.TRANSFORM);

      // Remove if out of bounds
      if (transform.x < -50 || transform.x > this.canvas.width + 50 ||
          transform.y < -50 || transform.y > this.canvas.height + 50) {
        this.entityManager.removeEntity(bullet);
      }
    }
  }

  checkCollisions() {
    const bullets = this.entityManager.getEntitiesWithTag('bullet');
    const enemies = this.entityManager.getEntitiesWithTag('enemy');

    for (const bullet of bullets) {
      const bulletComp = bullet.getComponent(ComponentType.BULLET);
      const bulletTransform = bullet.getComponent(ComponentType.TRANSFORM);
      const bulletCircle = bullet.getComponent(ComponentType.CIRCLE);

      for (const enemy of enemies) {
        if (bulletComp.hitEnemies.has(enemy.id)) continue;

        const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);
        const enemyCircle = enemy.getComponent(ComponentType.CIRCLE);

        const dx = enemyTransform.x - bulletTransform.x;
        const dy = enemyTransform.y - bulletTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const collisionDist = bulletCircle.radius + enemyCircle.radius;

        if (dist < collisionDist) {
          this.onBulletHitEnemy(bullet, enemy);
          break;
        }
      }
    }
  }

  onBulletHitEnemy(bullet, enemy) {
    const bulletComp = bullet.getComponent(ComponentType.BULLET);
    const health = enemy.getComponent(ComponentType.HEALTH);
    const enemyComp = enemy.getComponent(ComponentType.ENEMY);
    const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);

    bulletComp.hitEnemies.add(enemy.id);

    // Apply damage with armor reduction
    const armorReduction = health.armor / (health.armor + 100);
    const actualDamage = Math.max(1, bulletComp.damage * (1 - armorReduction));
    health.current -= actualDamage;
    health.lastDamageTime = performance.now() / 1000;

    // Apply lifesteal
    if (bulletComp.lifesteal > 0 && this.playerEntity) {
      const roll = Math.random() * 100;
      if (roll < bulletComp.lifesteal) {
        const playerHealth = this.playerEntity.getComponent(ComponentType.HEALTH);
        playerHealth.current = Math.min(playerHealth.max, playerHealth.current + 1);
      }
    }

    // Create hit effect
    this.createHitEffect(enemyTransform.x, enemyTransform.y, bulletComp.isCrit);

    // Apply slow
    if (bulletComp.slow) {
      enemyComp.slowed = true;
      enemyComp.slowFactor = bulletComp.slow.factor;
      enemyComp.slowEndTime = (performance.now() / 1000) + bulletComp.slow.duration;
    }

    // Check if enemy died
    if (health.current <= 0) {
      this.onEnemyKilled(enemy);
    }

    // Remove bullet if it can't pierce more
    bulletComp.pierceCount++;
    if (bulletComp.pierceCount > bulletComp.pierce) {
      this.entityManager.removeEntity(bullet);
    }
  }

  createHitEffect(x, y, isCrit = false) {
    const hit = this.entityManager.createEntity();
    hit
      .addComponent(ComponentType.TRANSFORM, Transform(x, y))
      .addComponent(ComponentType.CIRCLE, Circle(isCrit ? 14 : 10, isCrit ? '#ff6b6b' : '#ef4444', false, isCrit ? 4 : 3))
      .addComponent(ComponentType.LIFETIME, Lifetime(isCrit ? 0.3 : 0.2))
      .addTag('effect');
  }

  onEnemyKilled(enemy) {
    const enemyComp = enemy.getComponent(ComponentType.ENEMY);
    const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);

    // Create death effect
    this.createDeathEffect(enemyTransform.x, enemyTransform.y);

    // Add money and XP
    this.gameState.addMoney(enemyComp.reward);
    this.gameState.addKill();

    // Add XP to player
    if (this.playerEntity) {
      const player = this.playerEntity.getComponent(ComponentType.PLAYER);
      player.xp += 10;

      // Level up check
      const xpNeeded = player.level * 100;
      if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.level++;
        this.onPlayerLevelUp();
      }
    }

    this.entityManager.removeEntity(enemy);
  }

  createDeathEffect(x, y) {
    // Create expanding ring effect
    for (let i = 0; i < 3; i++) {
      const ring = this.entityManager.createEntity();
      const delay = i * 0.05;
      ring
        .addComponent(ComponentType.TRANSFORM, Transform(x, y))
        .addComponent(ComponentType.CIRCLE, Circle(5 + i * 5, '#8b5cf6', false, 2))
        .addComponent(ComponentType.LIFETIME, Lifetime(0.3 + delay, delay))
        .addTag('effect');
    }
  }

  onPlayerLevelUp() {
    if (!this.playerEntity) return;

    const player = this.playerEntity.getComponent(ComponentType.PLAYER);
    const health = this.playerEntity.getComponent(ComponentType.HEALTH);

    // Increase max HP
    health.max += 10;
    health.current = Math.min(health.current + 20, health.max);

    // Increase stats slightly
    player.stats.damage *= 1.05;
  }

  startWave() {
    console.log('[GAME] startWave() called. waveActive:', this.waveActive, 'gameOver:', this.gameState.gameOver);
    if (this.waveActive || this.gameState.gameOver) {
      console.log('[GAME] Cannot start wave - already active or game over');
      return;
    }

    console.log('[GAME] Starting wave', this.gameState.wave + 1);
    this.waveActive = true;
    this.gameState.wave++;
    this.waveTimer = 20 + this.gameState.wave * 5; // Wave duration
    this.spawnTimer = 0;
    console.log('[GAME] Wave started successfully. Timer:', this.waveTimer);
  }

  updateWaveSpawning(dt) {
    this.waveTimer -= dt * this.gameState.speedMultiplier;
    this.spawnTimer -= dt * this.gameState.speedMultiplier;

    if (this.spawnTimer <= 0 && this.waveTimer > 0) {
      this.spawnEnemy();
      this.spawnTimer = this.spawnInterval / (1 + this.gameState.wave * 0.1);
    }
  }

  spawnEnemy() {
    // Spawn at random edge position
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // Top
        x = Math.random() * this.canvas.width;
        y = -20;
        break;
      case 1: // Right
        x = this.canvas.width + 20;
        y = Math.random() * this.canvas.height;
        break;
      case 2: // Bottom
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + 20;
        break;
      case 3: // Left
        x = -20;
        y = Math.random() * this.canvas.height;
        break;
    }

    const wave = this.gameState.wave;
    const hp = this.gameState.calculateEnemyHealth(wave);
    const armor = this.gameState.calculateEnemyArmor(wave);
    const speed = 50 * (1 + wave * 0.05);
    const reward = this.gameState.calculateEnemyReward(wave);

    const enemy = this.entityManager.createEntity();
    enemy
      .addComponent(ComponentType.TRANSFORM, Transform(x, y))
      .addComponent(ComponentType.VELOCITY, Velocity(0, 0))
      .addComponent(ComponentType.ENEMY, Enemy('normal', speed, reward))
      .addComponent(ComponentType.HEALTH, Health(hp, hp, armor))
      .addComponent(ComponentType.CIRCLE, Circle(12, '#8b5cf6', true))
      .addTag('enemy');

    this.gameState.enemiesRemaining++;
  }

  onWaveComplete() {
    this.waveActive = false;

    // Award bonus
    const bonus = 50 + this.gameState.wave * 10;
    this.gameState.addMoney(bonus);
  }

  destroy() {
    this.engine.destroy();
    this.renderer.destroy();
    this.textureLoader.clear();
  }
}
