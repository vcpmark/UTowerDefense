/**
 * Brotato-Style Game
 * Top-down wave survival with auto-attacking weapons
 */

import { Engine } from '../core/Engine.js';
import { WebGLRenderer } from '../renderer/WebGLRenderer.js';
import { TextureLoader } from '../renderer/TextureLoader.js';
import { EntityManager } from '../ecs/Entity.js';
import { ComponentType, Transform, Circle, Health, Velocity, Player, Enemy, Bullet } from '../ecs/Components.js';
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

    this.init();
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
    try {
      // Load player sprites
      this.textures.player = await this.textureLoader.loadTexture('assets/sprites/player/potato.png');
      this.textures.playerLegs = await this.textureLoader.loadTexture('assets/sprites/player/legs.png');

      // Load enemy sprites
      this.textures.enemy = await this.textureLoader.loadTexture('assets/sprites/enemies/1.png');

      // Load bullet sprites
      this.textures.bullet = await this.textureLoader.loadTexture('assets/sprites/bullets/frame0000.png');
    } catch (error) {
      console.warn('Some assets failed to load, using fallbacks:', error);
    }
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

    // Add a basic weapon
    const player = this.playerEntity.getComponent(ComponentType.PLAYER);
    player.weapons.push({
      cooldown: 0,
      rate: 0.5,
      damage: 15,
      range: 250,
      projectileSpeed: 400,
      piercing: 0
    });
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

    for (const weapon of player.weapons) {
      weapon.cooldown -= dt * this.gameState.speedMultiplier;

      if (weapon.cooldown <= 0 && enemies.length > 0) {
        // Find nearest enemy
        const target = this.findNearestEnemy(playerTransform, weapon.range, enemies);

        if (target) {
          this.fireWeapon(playerTransform, weapon, target);
          weapon.cooldown = weapon.rate;
        }
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

  fireWeapon(playerTransform, weapon, target) {
    const targetTransform = target.getComponent(ComponentType.TRANSFORM);

    // Calculate direction
    const dx = targetTransform.x - playerTransform.x;
    const dy = targetTransform.y - playerTransform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Create bullet
    const bullet = this.entityManager.createEntity();
    bullet
      .addComponent(ComponentType.TRANSFORM, Transform(playerTransform.x, playerTransform.y))
      .addComponent(ComponentType.VELOCITY, Velocity(dirX * weapon.projectileSpeed, dirY * weapon.projectileSpeed))
      .addComponent(ComponentType.BULLET, Bullet(weapon.damage, weapon.projectileSpeed, weapon.piercing, target))
      .addComponent(ComponentType.CIRCLE, Circle(4, '#facc15', true))
      .addTag('bullet');
  }

  updateEnemies(dt) {
    if (!this.playerEntity) return;

    const playerTransform = this.playerEntity.getComponent(ComponentType.TRANSFORM);
    const enemies = this.entityManager.getEntitiesWithTag('enemy');

    for (const enemy of enemies) {
      const enemyComp = enemy.getComponent(ComponentType.ENEMY);
      const transform = enemy.getComponent(ComponentType.TRANSFORM);
      const velocity = enemy.getComponent(ComponentType.VELOCITY);

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
        const health = this.playerEntity.getComponent(ComponentType.HEALTH);
        health.current -= 5 * dt;
        if (health.current <= 0) {
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

    bulletComp.hitEnemies.add(enemy.id);

    // Apply damage
    const actualDamage = Math.max(1, bulletComp.damage - (health.armor || 0));
    health.current -= actualDamage;

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

  onEnemyKilled(enemy) {
    const enemyComp = enemy.getComponent(ComponentType.ENEMY);

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
