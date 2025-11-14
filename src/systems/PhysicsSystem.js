/**
 * Physics System
 * Handles entity movement and velocity
 */

import { ComponentType } from '../ecs/Components.js';

export class PhysicsSystem {
  constructor(entityManager) {
    this.entityManager = entityManager;
  }

  update(dt, state) {
    const entities = this.entityManager.getEntitiesWith(
      ComponentType.TRANSFORM,
      ComponentType.VELOCITY
    );

    for (const entity of entities) {
      const transform = entity.getComponent(ComponentType.TRANSFORM);
      const velocity = entity.getComponent(ComponentType.VELOCITY);

      // Apply velocity
      transform.x += velocity.vx * dt;
      transform.y += velocity.vy * dt;

      // Apply max speed limit
      if (velocity.maxSpeed !== Infinity) {
        const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
        if (speed > velocity.maxSpeed) {
          const scale = velocity.maxSpeed / speed;
          velocity.vx *= scale;
          velocity.vy *= scale;
        }
      }
    }

    // Update lifetime components
    const lifetimeEntities = this.entityManager.getEntitiesWith(ComponentType.LIFETIME);
    for (const entity of lifetimeEntities) {
      const lifetime = entity.getComponent(ComponentType.LIFETIME);
      lifetime.elapsed += dt;

      if (lifetime.elapsed >= lifetime.duration) {
        this.entityManager.removeEntity(entity);
      }
    }
  }

  destroy() {
    // Clean up if needed
  }
}
