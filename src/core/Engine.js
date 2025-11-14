/**
 * Game Engine Core
 * Manages game loop, systems, and state
 */

export class Engine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;

    this.running = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fixedTimeStep = 1 / 60; // 60 FPS
    this.accumulator = 0;
    this.maxFrameTime = 0.25; // Max 250ms frame time to prevent spiral of death

    this.systems = [];
    this.updateSystems = [];
    this.renderSystems = [];

    this.state = {
      time: 0,
      frame: 0,
      fps: 0,
      paused: false
    };

    // FPS tracking
    this.fpsFrames = 0;
    this.fpsTime = 0;
  }

  addSystem(system, type = 'update') {
    this.systems.push(system);

    if (type === 'update' || type === 'both') {
      this.updateSystems.push(system);
    }

    if (type === 'render' || type === 'both') {
      this.renderSystems.push(system);
    }

    if (system.init) {
      system.init(this);
    }
  }

  removeSystem(system) {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }

    const updateIndex = this.updateSystems.indexOf(system);
    if (updateIndex !== -1) {
      this.updateSystems.splice(updateIndex, 1);
    }

    const renderIndex = this.renderSystems.indexOf(system);
    if (renderIndex !== -1) {
      this.renderSystems.splice(renderIndex, 1);
    }

    if (system.destroy) {
      system.destroy();
    }
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;

    this.loop();
  }

  stop() {
    this.running = false;
  }

  pause() {
    this.state.paused = true;
  }

  resume() {
    this.state.paused = false;
  }

  loop = () => {
    if (!this.running) return;

    const currentTime = performance.now() / 1000;
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedTimeStep) {
      if (!this.state.paused) {
        this.update(this.fixedTimeStep);
        this.state.time += this.fixedTimeStep;
      }
      this.accumulator -= this.fixedTimeStep;
    }

    // Render with interpolation factor
    const alpha = this.accumulator / this.fixedTimeStep;
    this.render(alpha);

    // FPS counter
    this.fpsFrames++;
    this.fpsTime += frameTime;
    if (this.fpsTime >= 1.0) {
      this.state.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }

    this.state.frame++;

    requestAnimationFrame(this.loop);
  };

  update(dt) {
    this.deltaTime = dt;

    for (const system of this.updateSystems) {
      if (system.update) {
        system.update(dt, this.state);
      }
    }
  }

  render(alpha) {
    for (const system of this.renderSystems) {
      if (system.render) {
        system.render(alpha, this.state);
      }
    }
  }

  destroy() {
    this.stop();

    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy();
      }
    }

    this.systems = [];
    this.updateSystems = [];
    this.renderSystems = [];
  }
}
