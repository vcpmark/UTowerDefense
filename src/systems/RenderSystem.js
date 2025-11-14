/**
 * Render System
 * Handles all rendering using the WebGL renderer
 */

import { ComponentType } from '../ecs/Components.js';

export class RenderSystem {
  constructor(renderer, entityManager) {
    this.renderer = renderer;
    this.entityManager = entityManager;
    this.camera = { x: 0, y: 0 };
  }

  render(alpha, state) {
    const renderer = this.renderer;

    // Clear screen
    renderer.clear(0.04, 0.06, 0.12, 1); // Dark blue background

    // Render entities with transform and visual components
    const entities = this.entityManager.getEntities();

    // Sort by render order (towers, enemies, bullets, effects)
    const sorted = [...entities].sort((a, b) => {
      const getOrder = (e) => {
        if (e.hasComponent(ComponentType.TOWER)) return 1;
        if (e.hasComponent(ComponentType.ENEMY)) return 2;
        if (e.hasComponent(ComponentType.BULLET)) return 3;
        if (e.hasComponent(ComponentType.PLAYER)) return 4;
        return 5;
      };
      return getOrder(a) - getOrder(b);
    });

    for (const entity of sorted) {
      if (!entity.active) continue;

      const transform = entity.getComponent(ComponentType.TRANSFORM);
      if (!transform) continue;

      // Render circles
      if (entity.hasComponent(ComponentType.CIRCLE)) {
        const circle = entity.getComponent(ComponentType.CIRCLE);
        renderer.drawCircle(
          transform.x,
          transform.y,
          circle.radius * transform.scale,
          circle.color,
          circle.fill
        );
      }

      // Render tower range (when selected or for utility towers)
      if (entity.hasComponent(ComponentType.TOWER)) {
        const tower = entity.getComponent(ComponentType.TOWER);

        // Draw range circle
        if (tower.selected || tower.showRange) {
          renderer.drawCircle(
            transform.x,
            transform.y,
            tower.range,
            'rgba(255, 255, 255, 0.15)',
            false
          );
        }

        // Draw aura range
        if (entity.hasComponent(ComponentType.AURA)) {
          const aura = entity.getComponent(ComponentType.AURA);
          renderer.drawCircle(
            transform.x,
            transform.y,
            aura.range,
            'rgba(192, 132, 252, 0.2)',
            false
          );
        }

        // Draw tower targeting line
        if (tower.target && tower.target.active) {
          const targetTransform = tower.target.getComponent(ComponentType.TRANSFORM);
          if (targetTransform) {
            renderer.drawLine(
              transform.x,
              transform.y,
              targetTransform.x,
              targetTransform.y,
              'rgba(255, 255, 255, 0.1)',
              1
            );
          }
        }
      }

      // Render health bars
      if (entity.hasComponent(ComponentType.HEALTH)) {
        const health = entity.getComponent(ComponentType.HEALTH);
        if (health.current < health.max) {
          const barWidth = 30;
          const barHeight = 4;
          const barX = transform.x - barWidth / 2;
          const barY = transform.y - 20;

          // Background
          renderer.drawRect(barX, barY, barWidth, barHeight, '#1a1a2e', true);

          // Health
          const healthPercent = health.current / health.max;
          const healthWidth = barWidth * healthPercent;
          const healthColor = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
          renderer.drawRect(barX, barY, healthWidth, barHeight, healthColor, true);
        }
      }
    }

    // Render effects
    this.renderEffects(state);

    // Render UI overlays
    this.renderUI(state);
  }

  renderEffects(state) {
    const renderer = this.renderer;

    // Render lightning effects
    if (state.lightning && state.lightning.length > 0) {
      for (const effect of state.lightning) {
        if (effect.elapsed < effect.duration) {
          const alpha = 1 - (effect.elapsed / effect.duration);
          const color = this.adjustAlpha(effect.color, alpha);

          for (let i = 0; i < effect.points.length - 1; i++) {
            const p1 = effect.points[i];
            const p2 = effect.points[i + 1];
            renderer.drawLine(p1.x, p1.y, p2.x, p2.y, color, 2);
          }
        }
      }
    }

    // Render pulse effects
    if (state.pulses && state.pulses.length > 0) {
      for (const effect of state.pulses) {
        if (effect.ttl > 0) {
          const progress = 1 - (effect.ttl / effect.life);
          const alpha = 1 - progress;
          const color = this.adjustAlpha(effect.color, alpha);
          renderer.drawCircle(effect.x, effect.y, effect.r, color, false);
        }
      }
    }
  }

  renderUI(state) {
    // Draw FPS counter
    // Note: For text, we'd need to implement a bitmap font or use Canvas2D overlay
    // For now, this is handled by the HTML UI
  }

  adjustAlpha(colorStr, alpha) {
    // Parse color and adjust alpha
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return colorStr;
  }

  destroy() {
    // Clean up if needed
  }
}
