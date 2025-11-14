/**
 * Brotato-Style Game
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

export class BrotatoGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer(canvas);
    this.textureLoader = new TextureLoader(this.renderer.gl);
    this.engine = new Engine(canvas);
    this.entityManager = new EntityManager();
    this.gameState = new GameState();

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
    // Load textures
    await this.loadAssets();

    // Add systems
    this.physicsSystem = new PhysicsSystem(this.entityManager);
    this.renderSystem = new RenderSystem(this.renderer, this.entityManager);

    this.engine.addSystem(this.physicsSystem, 'update');
    this.engine.addSystem(this, 'update'); // Add game logic
    this.engine.addSystem(this.renderSystem, 'render');

    // Create player
    this.createPlayer();

    // Set up input
    this.setupInput();

    // Start engine
    this.engine.start();
  }

  async loadAssets() {
    const assetsToLoad = [
      { key: 'player', path: 'assets/sprites/player/potato.png' },
      { key: 'playerLegs', path: 'assets/sprites/player/legs.png' },
      { key: 'enemy', path: 'assets/sprites/enemies/1.png' },
      { key: 'bullet', path: 'assets/sprites/bullets/frame0000.png' }
    ];

    for (const asset of assetsToLoad) {
      try {
        this.textures[asset.key] = await this.textureLoader.loadTexture(asset.path);
        console.log(`✓ Loaded ${asset.key}`);
      } catch (error) {
        console.warn(`✗ Failed to load ${asset.key} from ${asset.path}, using fallback`);
        this.textures[asset.key] = null; // Will use colored circles as fallback
      }
    }

    console.log('Asset loading complete!');
  }

  createPlayer() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.playerEntity = this.entityManager.createEntity();
    this.playerEntity
      .addComponent(ComponentType.TRANSFORM, Transform(centerX, centerY))
      .addComponent(ComponentType.VELOCITY, Velocity(0, 0, 200))
      .addComponent(ComponentType.HEALTH, Health(100, 100))
      .addComponent(ComponentType.CIRCLE, Circle(16, '#fbbf24', true))
      .addComponent(ComponentType.PLAYER, Player(200, 100, 100))
      .addTag('player');

    // Add starter weapons (two guns like in Unity version)
    this.addWeaponToPlayer('minigun', 15, 0.3, 250, 400, 0, 12, -6);
    this.addWeaponToPlayer('minigun', 15, 0.3, 250, 400, 0, 12, 6);
  }

  addWeaponToPlayer(type, damage, rate, range, projectileSpeed, pierce, offsetX, offsetY) {
    const weaponEntity = this.entityManager.createEntity();
    weaponEntity
      .addComponent(ComponentType.TRANSFORM, Transform(0, 0, 0, 0.8))
      .addComponent(ComponentType.WEAPON, Weapon(type, damage, rate, range, projectileSpeed, pierce))
      .addComponent(ComponentType.CIRCLE, Circle(6, '#94a3b8', true))
      .addTag('weapon');

    const weapon = weaponEntity.getComponent(ComponentType.WEAPON);
    weapon.offsetX = offsetX;
    weapon.offsetY = offsetY;

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

      // Find target and aim weapon
      weapon.cooldown -= dt * this.gameState.speedMultiplier * player.stats.attackSpeed;
      const target = this.findNearestEnemy(weaponTransform, weapon.aimingRange, enemies);

      if (target) {
        const targetTransform = target.getComponent(ComponentType.TRANSFORM);
        const dx = targetTransform.x - weaponTransform.x;
        const dy = targetTransform.y - weaponTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Rotate weapon to aim at target
        weapon.rotation = Math.atan2(dy, dx);
        weapon.target = target;

        // Fire if in range and cooldown ready
        if (weapon.cooldown <= 0 && dist <= weapon.range) {
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

  fireWeapon(weaponTransform, weapon, target, playerStats) {
    const targetTransform = target.getComponent(ComponentType.TRANSFORM);

    // Calculate direction
    const dx = targetTransform.x - weaponTransform.x;
    const dy = targetTransform.y - weaponTransform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Apply player damage stats
    const finalDamage = weapon.damage * playerStats.stats.damage;

    // Create bullet
    const bullet = this.entityManager.createEntity();
    bullet
      .addComponent(ComponentType.TRANSFORM, Transform(weaponTransform.x, weaponTransform.y))
      .addComponent(ComponentType.VELOCITY, Velocity(dirX * weapon.projectileSpeed, dirY * weapon.projectileSpeed))
      .addComponent(ComponentType.BULLET, Bullet(finalDamage, weapon.projectileSpeed, weapon.pierce, target))
      .addComponent(ComponentType.CIRCLE, Circle(4, '#facc15', true))
      .addComponent(ComponentType.LIFETIME, Lifetime(3)) // Bullets last 3 seconds max
      .addTag('bullet');

    // Add muzzle flash effect
    this.createMuzzleFlash(weaponTransform.x, weaponTransform.y);
  }

  createMuzzleFlash(x, y) {
    const flash = this.entityManager.createEntity();
    flash
      .addComponent(ComponentType.TRANSFORM, Transform(x, y))
      .addComponent(ComponentType.CIRCLE, Circle(8, '#fef08a', true))
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

    // Apply damage
    const actualDamage = Math.max(1, bulletComp.damage - (health.armor || 0));
    health.current -= actualDamage;
    health.lastDamageTime = performance.now() / 1000;

    // Create hit effect
    this.createHitEffect(enemyTransform.x, enemyTransform.y);

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

  createHitEffect(x, y) {
    const hit = this.entityManager.createEntity();
    hit
      .addComponent(ComponentType.TRANSFORM, Transform(x, y))
      .addComponent(ComponentType.CIRCLE, Circle(10, '#ef4444', false, 3))
      .addComponent(ComponentType.LIFETIME, Lifetime(0.2))
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
    if (this.waveActive || this.gameState.gameOver) return;

    this.waveActive = true;
    this.gameState.wave++;
    this.waveTimer = 20 + this.gameState.wave * 5; // Wave duration
    this.spawnTimer = 0;
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
