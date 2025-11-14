/**
 * Entity Component System
 * Lightweight ECS for game objects
 */

let nextEntityId = 1;

export class Entity {
  constructor() {
    this.id = nextEntityId++;
    this.components = new Map();
    this.tags = new Set();
    this.active = true;
  }

  addComponent(type, data) {
    this.components.set(type, data);
    return this;
  }

  getComponent(type) {
    return this.components.get(type);
  }

  hasComponent(type) {
    return this.components.has(type);
  }

  removeComponent(type) {
    this.components.delete(type);
    return this;
  }

  addTag(tag) {
    this.tags.add(tag);
    return this;
  }

  hasTag(tag) {
    return this.tags.has(tag);
  }

  removeTag(tag) {
    this.tags.delete(tag);
    return this;
  }

  destroy() {
    this.active = false;
    this.components.clear();
    this.tags.clear();
  }
}

export class EntityManager {
  constructor() {
    this.entities = [];
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
  }

  createEntity() {
    const entity = new Entity();
    this.entitiesToAdd.push(entity);
    return entity;
  }

  removeEntity(entity) {
    if (entity) {
      this.entitiesToRemove.push(entity);
    }
  }

  update() {
    // Add new entities
    if (this.entitiesToAdd.length > 0) {
      this.entities.push(...this.entitiesToAdd);
      this.entitiesToAdd = [];
    }

    // Remove destroyed entities
    if (this.entitiesToRemove.length > 0) {
      for (const entity of this.entitiesToRemove) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
          this.entities.splice(index, 1);
        }
        entity.destroy();
      }
      this.entitiesToRemove = [];
    }

    // Remove inactive entities
    this.entities = this.entities.filter(e => e.active);
  }

  getEntities() {
    return this.entities;
  }

  getEntitiesWith(...componentTypes) {
    return this.entities.filter(entity =>
      entity.active && componentTypes.every(type => entity.hasComponent(type))
    );
  }

  getEntitiesWithTag(tag) {
    return this.entities.filter(entity => entity.active && entity.hasTag(tag));
  }

  clear() {
    for (const entity of this.entities) {
      entity.destroy();
    }
    this.entities = [];
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
  }
}
