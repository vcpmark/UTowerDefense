/**
 * Main Game Class
 * Orchestrates all game systems and state
 */

import { Engine } from '../core/Engine.js';
import { WebGLRenderer } from '../renderer/WebGLRenderer.js';
import { EntityManager } from '../ecs/Entity.js';
import { ComponentType, Transform, Circle, Health, Tower, Enemy, Bullet, Velocity } from '../ecs/Components.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { GameState } from './GameState.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer(canvas);
    this.engine = new Engine(canvas);
    this.entityManager = new EntityManager();
    this.gameState = new GameState();

    // Path for enemies
    this.path = [
      { x: -20, y: 240 },
      { x: 200, y: 240 },
      { x: 200, y: 360 },
      { x: 500, y: 360 },
      { x: 500, y: 120 },
      { x: 700, y: 120 },
      { x: 820, y: 240 }
    ];

    this.waveInProgress = false;
    this.waveTimer = 0;
    this.spawnQueue = [];

    this.init();
  }

  init() {
    // Add systems to engine
    this.physicsSystem = new PhysicsSystem(this.entityManager);
    this.renderSystem = new RenderSystem(this.renderer, this.entityManager);

    this.engine.addSystem(this.physicsSystem, 'update');
    this.engine.addSystem(this.renderSystem, 'render');
    this.engine.addSystem(this, 'update'); // Add game logic as a system

    // Set up UI callbacks
    this.setupUI();

    // Start engine
    this.engine.start();
  }

  setupUI() {
    // This would connect to the HTML UI elements
    // For now, we'll handle it in the index.html with events
  }

  update(dt) {
    // Update entity manager
    this.entityManager.update();

    // Update game state
    this.gameState.update(dt);

    // Pass game state to render system
    this.renderSystem.renderer.state = this.gameState;

    // Update towers
    this.updateTowers(dt);

    // Update enemies
    this.updateEnemies(dt);

    // Update bullets
    this.updateBullets(dt);

    // Check collisions
    this.checkCollisions();

    // Update wave spawning
    if (this.waveInProgress) {
      this.updateWaveSpawning(dt);
    }

    // Check wave completion
    if (this.waveInProgress && this.spawnQueue.length === 0 && this.gameState.enemiesRemaining === 0) {
      this.onWaveComplete();
    }
  }

  updateTowers(dt) {
    const towers = this.entityManager.getEntitiesWith(ComponentType.TOWER);
    const enemies = this.entityManager.getEntitiesWith(ComponentType.ENEMY);
    const mods = this.gameState.getTowerModifiers();

    for (const towerEntity of towers) {
      const tower = towerEntity.getComponent(ComponentType.TOWER);
      const transform = towerEntity.getComponent(ComponentType.TRANSFORM);

      // Update cooldown
      if (tower.cooldown > 0) {
        tower.cooldown -= dt * this.gameState.speedMultiplier;
      }

      // Find target
      if (!tower.target || !tower.target.active) {
        tower.target = this.findNearestEnemy(transform, tower.range + mods.rangeBonus, enemies);
      }

      // Shoot at target
      if (tower.target && tower.cooldown <= 0) {
        const targetTransform = tower.target.getComponent(ComponentType.TRANSFORM);
        if (targetTransform) {
          const dx = targetTransform.x - transform.x;
          const dy = targetTransform.y - transform.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= tower.range + mods.rangeBonus) {
            this.towerShoot(towerEntity, tower.target);
            tower.cooldown = tower.rate * mods.rateMult;
          }
        }
      }
    }
  }

  findNearestEnemy(transform, range, enemies) {
    let nearest = null;
    let minDist = range * range;

    for (const enemy of enemies) {
      const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);
      const dx = enemyTransform.x - transform.x;
      const dy = enemyTransform.y - transform.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDist) {
        minDist = distSq;
        nearest = enemy;
      }
    }

    return nearest;
  }

  towerShoot(towerEntity, target) {
    const tower = towerEntity.getComponent(ComponentType.TOWER);
    const transform = towerEntity.getComponent(ComponentType.TRANSFORM);
    const targetTransform = target.getComponent(ComponentType.TRANSFORM);
    const mods = this.gameState.getTowerModifiers();

    // Calculate direction
    const dx = targetTransform.x - transform.x;
    const dy = targetTransform.y - transform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Create bullet
    const bulletEntity = this.entityManager.createEntity();
    const bulletSpeed = tower.bullet?.speed || 360;
    const damage = Math.floor(tower.damage * mods.damageMult);

    bulletEntity
      .addComponent(ComponentType.TRANSFORM, Transform(transform.x, transform.y))
      .addComponent(ComponentType.VELOCITY, Velocity(dirX * bulletSpeed, dirY * bulletSpeed))
      .addComponent(ComponentType.BULLET, Bullet(damage, bulletSpeed, tower.pierce, target))
      .addComponent(ComponentType.CIRCLE, Circle(tower.bullet?.r || 3.5, tower.bullet?.color || '#cdd9ff', true))
      .addTag('bullet');

    // Handle special tower types
    if (tower.type === 'storm' && tower.chainTargets > 0) {
      const bullet = bulletEntity.getComponent(ComponentType.BULLET);
      bullet.chain = true;
      bullet.chainTargets = tower.chainTargets;
      bullet.chainRange = tower.chainRange;
      bullet.chainFalloff = tower.chainFalloff;
    }

    if (tower.bullet?.splashRadius) {
      const bullet = bulletEntity.getComponent(ComponentType.BULLET);
      bullet.splashRadius = tower.bullet.splashRadius;
      bullet.splashFalloff = tower.bullet.splashFalloff || 0.6;
    }

    if (tower.bullet?.slow) {
      const bullet = bulletEntity.getComponent(ComponentType.BULLET);
      bullet.slow = { ...tower.bullet.slow };
    }
  }

  updateEnemies(dt) {
    const enemies = this.entityManager.getEntitiesWith(ComponentType.ENEMY);

    for (const enemy of enemies) {
      const enemyComp = enemy.getComponent(ComponentType.ENEMY);
      const transform = enemy.getComponent(ComponentType.TRANSFORM);

      // Update slow effect
      if (enemyComp.slowed) {
        const now = performance.now() / 1000;
        if (now >= enemyComp.slowEndTime) {
          enemyComp.slowed = false;
          enemyComp.slowFactor = 1;
        }
      }

      // Move along path
      const speed = enemyComp.speed * enemyComp.slowFactor * this.gameState.speedMultiplier;
      enemyComp.pathProgress += speed * dt;

      // Update position on path
      const pos = this.getPathPosition(enemyComp.pathProgress);
      transform.x = pos.x;
      transform.y = pos.y;

      // Check if reached end
      if (enemyComp.pathProgress >= this.getPathLength()) {
        if (!enemyComp.reachedEnd) {
          enemyComp.reachedEnd = true;
          const damage = enemyComp.type === 'boss' ? this.gameState.balance.bossLeakLives : 1;
          this.gameState.takeDamage(damage);
          this.gameState.enemiesRemaining--;
          this.entityManager.removeEntity(enemy);
        }
      }
    }
  }

  updateBullets(dt) {
    const bullets = this.entityManager.getEntitiesWith(ComponentType.BULLET);

    for (const bullet of bullets) {
      const bulletComp = bullet.getComponent(ComponentType.BULLET);
      const transform = bullet.getComponent(ComponentType.TRANSFORM);

      // Check if target still exists
      if (bulletComp.target && bulletComp.target.active) {
        const targetTransform = bulletComp.target.getComponent(ComponentType.TRANSFORM);
        if (targetTransform) {
          // Home towards target
          const dx = targetTransform.x - transform.x;
          const dy = targetTransform.y - transform.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 5) {
            const velocity = bullet.getComponent(ComponentType.VELOCITY);
            const dirX = dx / dist;
            const dirY = dy / dist;
            velocity.vx = dirX * bulletComp.speed;
            velocity.vy = dirY * bulletComp.speed;
          }
        }
      }

      // Remove if out of bounds
      if (transform.x < -50 || transform.x > 850 || transform.y < -50 || transform.y > 530) {
        this.entityManager.removeEntity(bullet);
      }
    }
  }

  checkCollisions() {
    const bullets = this.entityManager.getEntitiesWith(ComponentType.BULLET);
    const enemies = this.entityManager.getEntitiesWith(ComponentType.ENEMY);

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
        const collisionDist = (bulletCircle?.radius || 3) + (enemyCircle?.radius || 10);

        if (dist < collisionDist) {
          // Hit!
          this.onBulletHitEnemy(bullet, enemy);
          break;
        }
      }
    }
  }

  onBulletHitEnemy(bulletEntity, enemyEntity) {
    const bullet = bulletEntity.getComponent(ComponentType.BULLET);
    const enemy = enemyEntity.getComponent(ComponentType.ENEMY);
    const health = enemyEntity.getComponent(ComponentType.HEALTH);
    const bulletTransform = bulletEntity.getComponent(ComponentType.TRANSFORM);

    // Mark as hit
    bullet.hitEnemies.add(enemyEntity.id);

    // Apply damage
    const actualDamage = Math.max(1, bullet.damage - (health.armor || 0));
    health.current -= actualDamage;

    // Apply slow effect
    if (bullet.slow) {
      enemy.slowed = true;
      enemy.slowFactor = bullet.slow.factor;
      enemy.slowEndTime = (performance.now() / 1000) + bullet.slow.duration;
    }

    // Check if enemy died
    if (health.current <= 0) {
      this.onEnemyKilled(enemyEntity);
    }

    // Handle splash damage
    if (bullet.splashRadius > 0) {
      this.applySplashDamage(bulletTransform, bullet);
    }

    // Handle pierce
    bullet.pierceCount++;
    if (bullet.pierceCount > bullet.pierce) {
      this.entityManager.removeEntity(bulletEntity);
    }

    // Handle chain lightning
    if (bullet.chain && bullet.chainTargets > 0) {
      this.applyChainLightning(enemyEntity, bullet);
      this.entityManager.removeEntity(bulletEntity);
    }
  }

  applySplashDamage(transform, bullet) {
    const enemies = this.entityManager.getEntitiesWith(ComponentType.ENEMY);

    for (const enemy of enemies) {
      if (bullet.hitEnemies.has(enemy.id)) continue;

      const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);
      const dx = enemyTransform.x - transform.x;
      const dy = enemyTransform.y - transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= bullet.splashRadius) {
        const health = enemy.getComponent(ComponentType.HEALTH);
        const falloff = Math.max(bullet.splashFalloff, 1 - (dist / bullet.splashRadius));
        const damage = Math.floor(bullet.damage * falloff);
        const actualDamage = Math.max(1, damage - (health.armor || 0));

        health.current -= actualDamage;

        if (health.current <= 0) {
          this.onEnemyKilled(enemy);
        }
      }
    }

    // Add splash visual effect
    this.gameState.addPulseEffect(transform.x, transform.y, bullet.splashRadius, '#f9a8d4', 0.5);
  }

  applyChainLightning(startEnemy, bullet) {
    const enemies = this.entityManager.getEntitiesWith(ComponentType.ENEMY);
    const startTransform = startEnemy.getComponent(ComponentType.TRANSFORM);

    let currentEnemy = startEnemy;
    let currentDamage = bullet.damage;
    const chainPoints = [{ x: startTransform.x, y: startTransform.y }];

    for (let i = 0; i < bullet.chainTargets; i++) {
      const currentTransform = currentEnemy.getComponent(ComponentType.TRANSFORM);

      // Find next nearest enemy
      let nextEnemy = null;
      let minDist = bullet.chainRange * bullet.chainRange;

      for (const enemy of enemies) {
        if (bullet.hitEnemies.has(enemy.id)) continue;

        const enemyTransform = enemy.getComponent(ComponentType.TRANSFORM);
        const dx = enemyTransform.x - currentTransform.x;
        const dy = enemyTransform.y - currentTransform.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDist) {
          minDist = distSq;
          nextEnemy = enemy;
        }
      }

      if (!nextEnemy) break;

      // Apply damage
      bullet.hitEnemies.add(nextEnemy.id);
      const health = nextEnemy.getComponent(ComponentType.HEALTH);
      const actualDamage = Math.max(1, Math.floor(currentDamage) - (health.armor || 0));
      health.current -= actualDamage;

      const nextTransform = nextEnemy.getComponent(ComponentType.TRANSFORM);
      chainPoints.push({ x: nextTransform.x, y: nextTransform.y });

      if (health.current <= 0) {
        this.onEnemyKilled(nextEnemy);
      }

      currentEnemy = nextEnemy;
      currentDamage *= bullet.chainFalloff;
    }

    // Add lightning visual effect
    if (chainPoints.length > 1) {
      this.gameState.addLightningEffect(chainPoints, '#fde68a', 0.15);
    }
  }

  onEnemyKilled(enemy) {
    const enemyComp = enemy.getComponent(ComponentType.ENEMY);

    // Add reward
    this.gameState.addMoney(enemyComp.reward);

    // Add kill
    this.gameState.addKill();

    // Remove enemy
    this.gameState.enemiesRemaining--;
    this.entityManager.removeEntity(enemy);
  }

  startWave() {
    if (this.waveInProgress || this.gameState.gameOver) return;

    this.waveInProgress = true;
    this.gameState.wave++;

    // Generate spawn queue
    this.spawnQueue = this.generateWaveSpawns();
    this.waveTimer = 0;
  }

  generateWaveSpawns() {
    const wave = this.gameState.wave;
    const count = this.gameState.calculateWaveEnemyCount(wave);
    const spawns = [];

    for (let i = 0; i < count; i++) {
      const isBoss = wave % this.gameState.balance.bossEvery === 0 && i === count - 1;
      const isTank = !isBoss && i % 5 === 0;
      const type = isBoss ? 'boss' : isTank ? 'tank' : 'normal';

      spawns.push({
        type,
        spawnTime: i * 0.5,
        hp: this.gameState.calculateEnemyHealth(wave, isBoss, isTank),
        armor: this.gameState.calculateEnemyArmor(wave, isBoss, isTank),
        speed: 60 * this.gameState.getEnemyModifiers().speedMult * (isBoss ? 0.7 : isTank ? 0.8 : 1),
        reward: this.gameState.calculateEnemyReward(wave) * (isBoss ? 3 : isTank ? 1.5 : 1)
      });
    }

    this.gameState.enemiesRemaining = spawns.length;
    return spawns;
  }

  updateWaveSpawning(dt) {
    this.waveTimer += dt * this.gameState.speedMultiplier;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnTime <= this.waveTimer) {
      const spawn = this.spawnQueue.shift();
      this.spawnEnemy(spawn);
    }
  }

  spawnEnemy(spawn) {
    const entity = this.entityManager.createEntity();
    const startPos = this.path[0];

    const radius = spawn.type === 'boss' ? 16 : spawn.type === 'tank' ? 12 : 10;
    const color = spawn.type === 'boss' ? '#ef4444' : spawn.type === 'tank' ? '#f59e0b' : '#8b5cf6';

    entity
      .addComponent(ComponentType.TRANSFORM, Transform(startPos.x, startPos.y))
      .addComponent(ComponentType.ENEMY, Enemy(spawn.type, spawn.speed, spawn.reward, 0))
      .addComponent(ComponentType.HEALTH, Health(spawn.hp, spawn.hp, spawn.armor))
      .addComponent(ComponentType.CIRCLE, Circle(radius, color, true))
      .addTag('enemy');
  }

  onWaveComplete() {
    this.waveInProgress = false;

    // Award clear bonus
    const bonus = this.gameState.balance.clearBase + this.gameState.wave * this.gameState.balance.clearPer;
    this.gameState.addMoney(bonus);
  }

  placeTower(x, y, type, cost) {
    if (!this.gameState.spendMoney(cost)) return false;

    // Snap to grid (40px)
    const gridSize = 40;
    const gridX = Math.floor(x / gridSize) * gridSize + gridSize / 2;
    const gridY = Math.floor(y / gridSize) * gridSize + gridSize / 2;

    const entity = this.entityManager.createEntity();

    // Default tower stats (simplified)
    const towerData = this.getTowerData(type);

    entity
      .addComponent(ComponentType.TRANSFORM, Transform(gridX, gridY))
      .addComponent(ComponentType.TOWER, Tower(type, towerData.range, towerData.damage, towerData.rate, towerData.pierce))
      .addComponent(ComponentType.CIRCLE, Circle(15, towerData.color, true))
      .addTag('tower');

    const tower = entity.getComponent(ComponentType.TOWER);
    tower.cost = cost;
    tower.bullet = towerData.bullet;

    this.gameState.towersBuilt++;
    return true;
  }

  getTowerData(type) {
    const data = {
      basic: {
        range: 140,
        damage: 18,
        rate: 0.48,
        pierce: 0,
        color: '#5b72ff',
        bullet: { speed: 360, r: 3.5, color: '#cdd9ff' }
      },
      pulse: {
        range: 135,
        damage: 24,
        rate: 0.85,
        pierce: 0,
        color: '#f472b6',
        bullet: { speed: 300, r: 4, color: '#f9a8d4', splashRadius: 60, splashFalloff: 0.6 }
      },
      frost: {
        range: 150,
        damage: 12,
        rate: 0.52,
        pierce: 0,
        color: '#38bdf8',
        bullet: { speed: 320, r: 3.4, color: '#bae6fd', slow: { factor: 0.55, duration: 1.8 } }
      },
      sniper: {
        range: 240,
        damage: 120,
        rate: 1.35,
        pierce: 2,
        color: '#f97316',
        bullet: { speed: 520, r: 4.5, color: '#facc15' }
      },
      storm: {
        range: 160,
        damage: 52,
        rate: 1.05,
        pierce: 0,
        color: '#fde68a',
        bullet: { speed: 400, r: 4, color: '#fde68a' },
        chainTargets: 3,
        chainRange: 150,
        chainFalloff: 0.75
      }
    };

    return data[type] || data.basic;
  }

  getPathPosition(progress) {
    let distance = 0;
    const distances = [0];

    // Calculate segment distances
    for (let i = 1; i < this.path.length; i++) {
      const dx = this.path[i].x - this.path[i - 1].x;
      const dy = this.path[i].y - this.path[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
      distances.push(distance);
    }

    // Find segment
    for (let i = 1; i < this.path.length; i++) {
      if (progress <= distances[i]) {
        const segmentProgress = (progress - distances[i - 1]) / (distances[i] - distances[i - 1]);
        const p1 = this.path[i - 1];
        const p2 = this.path[i];

        return {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress
        };
      }
    }

    return this.path[this.path.length - 1];
  }

  getPathLength() {
    let distance = 0;
    for (let i = 1; i < this.path.length; i++) {
      const dx = this.path[i].x - this.path[i - 1].x;
      const dy = this.path[i].y - this.path[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }

  destroy() {
    this.engine.destroy();
    this.renderer.destroy();
  }
}
