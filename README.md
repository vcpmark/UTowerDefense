# Brotato Towers - Modern WebGL Edition

A tower defense game built with a modern WebGL2 engine, featuring Brotato-inspired mechanics and an Entity Component System architecture.

## 🚀 Features

### Modern WebGL2 Engine
- **Batch Rendering**: Efficient sprite batching for optimal performance
- **WebGL2 Shaders**: Custom GLSL shaders for rendering shapes and sprites
- **Fixed Timestep**: Deterministic physics with fixed update rate
- **Entity Component System**: Flexible and maintainable game architecture
- **Modular Design**: Clean separation of concerns with multiple systems

### Game Systems
- **Rendering System**: WebGL-based rendering with effects and animations
- **Physics System**: Movement, velocity, and collision detection
- **Tower System**: Automated targeting and shooting mechanics
- **Enemy System**: Path-following AI with various enemy types
- **Bullet System**: Projectile physics with homing and special effects

### Brotato-Inspired Mechanics
- **Hype Burst**: Build hype from kills and unleash for massive damage boost
- **Momentum Frenzy**: Chain kills rapidly to trigger a speed/power frenzy
- **Wave Events**: Dynamic modifiers that change gameplay each wave
- **Multiple Tower Types**: Basic, Pulse, Frost, Sniper, and Storm towers
- **Special Effects**: Chain lightning, splash damage, and slow effects

## 📁 Project Structure

```
UTowerDefense/
├── index.html              # Main entry point
├── src/
│   ├── renderer/
│   │   └── WebGLRenderer.js    # WebGL2 rendering engine
│   ├── core/
│   │   └── Engine.js           # Game loop and system management
│   ├── ecs/
│   │   ├── Entity.js           # Entity and EntityManager
│   │   └── Components.js       # Component definitions
│   ├── systems/
│   │   ├── RenderSystem.js     # Rendering logic
│   │   └── PhysicsSystem.js    # Physics and movement
│   └── game/
│       ├── Game.js             # Main game logic
│       └── GameState.js        # Game state management
└── README.md
```

## 🎮 How to Play

1. **Start the Game**: Open `index.html` in a modern browser (Chrome, Firefox, Edge)
2. **Select a Tower**: Click on a tower card in the right panel
3. **Place Towers**: Click on the game canvas to place the selected tower
4. **Start Wave**: Click "Start Wave" to begin the enemy assault
5. **Build Strategy**: Upgrade towers and use special abilities to survive

### Controls
- **Left Click**: Place selected tower / Select tower
- **Start Wave**: Begin the next wave
- **Speed Button**: Toggle game speed (1x, 2x, 3x)
- **Activate Hype**: Unleash hype burst when meter is full

## 🏗️ Architecture

### WebGL Renderer
The `WebGLRenderer` class provides a modern WebGL2 API for drawing:
- Circles (filled and outlined)
- Rectangles
- Lines
- Custom shapes with batching

### Entity Component System
Entities are composed of components:
- **Transform**: Position, rotation, scale
- **Velocity**: Movement vector
- **Health**: HP and armor
- **Tower**: Tower behavior and stats
- **Enemy**: Enemy AI and pathfinding
- **Bullet**: Projectile behavior

### Game Systems
Systems process entities with specific components:
- **PhysicsSystem**: Updates positions based on velocity
- **RenderSystem**: Draws entities to the canvas
- **Game**: Handles tower shooting, enemy movement, collisions

## 🔧 Technical Details

### WebGL2 Features
- Orthographic projection matrix for 2D rendering
- Custom vertex and fragment shaders
- Efficient buffer management
- Alpha blending for transparency

### Performance Optimizations
- Batch rendering to minimize draw calls
- Efficient collision detection with spatial partitioning (future)
- Fixed timestep prevents physics issues
- Component-based architecture for cache efficiency

### Brotato Mechanics Integration
Based on the BrotatoWithUnity repository analysis:
- Player-like progression systems
- Wave-based difficulty scaling
- Item and stat modifiers
- Chain and combo mechanics
- Visual feedback with effects

## 🛠️ Development

### Requirements
- Modern browser with WebGL2 support
- ES6 module support
- Local web server (for development)

### Running Locally
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Then open http://localhost:8000
```

### Adding New Towers
1. Define tower stats in `Game.getTowerData()`
2. Add tower card to `TOWERS` array in `index.html`
3. Implement special behavior in tower system if needed

### Adding New Mechanics
1. Create new component in `Components.js`
2. Add system to process the component
3. Update game logic in `Game.js`

## 🎯 Future Enhancements

- [ ] Player-controlled character (Brotato-style)
- [ ] Item shop between waves
- [ ] Weapon system with auto-attack
- [ ] Stat system (damage, speed, armor, etc.)
- [ ] Save/load game state
- [ ] Sound effects and music
- [ ] Particle system for better effects
- [ ] Mobile touch controls
- [ ] Multiplayer support

## 📜 License

This project is open source and available for educational purposes.

## 🙏 Credits

- Inspired by Brotato by Blobfish
- BrotatoWithUnity reference implementation
- WebGL2 rendering techniques from various sources

---

**Note**: This is a modernized version using WebGL2 and ECS architecture. The original game logic has been preserved while the rendering engine has been completely rewritten for better performance and maintainability.
