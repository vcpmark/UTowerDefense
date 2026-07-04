# Groundhog Arena — Backyard Tower Defense × Survival

## 🦫 Groundhog Arena (`arena.html`) — the flagship mode

A polished single-file hybrid of tower defense and arena survival. Pilot the groundhog with WASD (or a touch joystick), build and upgrade garden defenses around yourself, and survive escalating waves of backyard pests.

**Features**
- **8 defense types** — Acorn Turret, Beehive (splash), Sprinkler (slow), Thorn Launcher (pierce), Storm Totem (chain lightning), Sunflower (aura buffs), Melon Mortar (long-range arcing artillery with a blind spot up close), and Cash Crop (harvests passive income) — each upgradable to level 8, sellable, with a click-to-select stats panel
- **Player progression** — enemies drop XP orbs; each level presents a 3-card perk draft from 16 perks (damage, crits, split shot, regen, magnets, tower buffs — plus Orbiting Acorns, a loyal Bee Friend companion, and retaliating Thorn Coat)
- **Meta-progression** — runs bank 🥕 Carrots based on waves, kills, and boss takedowns; spend them in the Burrow on **4 playable classes** (Classic, Burly, Hawkeye, Hoarder Chuck) and **3 permanent upgrade tracks** (starting cash, damage, XP gain) — all persisted between sessions
- **7 pest types** — rats, mosquitoes, boars, splitting rabbits, loot raccoons — plus **3 rotating bosses** every 5 waves, each with its own AI pattern and HP bar: the charging Grizzly, the minion-summoning Fox, and the feather-strafing Hawk
- **Wave modifiers** — every wave rolls a twist (Farmers Market, Morning Buzz, Cold Snap, Hailstorm, Fertile Grounds)
- **Groundhog Rage & combo system** — kills charge a global overdrive; kill streaks stack damage bonuses
- **Armory: 4 weapon classes** — Acorn Slinger (ranged), Claws & Tail (melee arc swipes with knockback and a 360° tail-spin every 4th hit), Seed Shotgun (5-pellet spray), Thorn Rifle (slow piercing sniper)
- **Victory & Endless** — defend the yard through wave 20 for a carrot bonus, then push into Endless Mode where shielded/swift/enraged elite pests join every wave
- **14 achievements** — persistent, each worth bonus carrots, shown in the Burrow
- **A living groundhog** — waddles with dust puffs, faces its target, and when idle will sniff, look around, stretch, nibble a carrot, or doze off
- **Juice** — particles, screen shake, floating text, bullet trails, chain-lightning arcs, low-HP vignette, synth SFX and a generative soundtrack (WebAudio, no assets)
- **Quality of life** — pause, 1×/2×/3× speed, auto-start waves, difficulty select, persistent best wave, game-over stats + instant restart, full touch/mobile support
- **Zero dependencies** — one self-contained HTML file, works from `file://`, GitHub Pages, or any static host

---

# Legacy modes (original project)

A dual-mode game featuring both a Motato clone and tower defense, built with a modern WebGL2 engine, actual Motato sprites, and an Entity Component System architecture.

## 🎮 Two Game Modes

### 🥔 Motato Mode (Recommended)
A faithful recreation of Motato with:
- Player-controlled character (WASD movement)
- Auto-attacking weapons
- Wave-based survival
- XP and level progression
- Real sprites from MotatoWithUnity

### 🗼 Tower Defense Mode
Strategic tower placement with:
- Multiple tower types
- Hype Burst & Momentum mechanics
- Special abilities and chain effects
- Wave modifiers and events

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

### Motato-Inspired Mechanics
- **Hype Burst**: Build hype from kills and unleash for massive damage boost
- **Momentum Frenzy**: Chain kills rapidly to trigger a speed/power frenzy
- **Wave Events**: Dynamic modifiers that change gameplay each wave
- **Multiple Tower Types**: Basic, Pulse, Frost, Sniper, and Storm towers
- **Special Effects**: Chain lightning, splash damage, and slow effects

## 📁 Project Structure

```
UTowerDefense/
├── index.html                  # Landing page / game mode selector
├── motato.html                 # Motato game mode
├── go.html                     # Tower defense (original)
├── towers.html                 # Tower defense (WebGL2 version)
├── assets/
│   └── sprites/                # Motato sprites from Unity
│       ├── player/             # potato.png, legs.png, highlight.png
│       ├── enemies/            # Enemy sprites
│       ├── weapons/            # Weapon sprites
│       └── bullets/            # Bullet animations
├── src/
│   ├── renderer/
│   │   ├── WebGLRenderer.js    # WebGL2 rendering engine
│   │   └── TextureLoader.js    # Texture loading and caching
│   ├── core/
│   │   └── Engine.js           # Game loop and system management
│   ├── ecs/
│   │   ├── Entity.js           # Entity and EntityManager
│   │   └── Components.js       # Component definitions
│   ├── systems/
│   │   ├── RenderSystem.js     # Rendering logic
│   │   └── PhysicsSystem.js    # Physics and movement
│   └── game/
│       ├── Game.js             # Tower defense logic
│       ├── MotatoGame.js       # Motato game logic
│       └── GameState.js        # Game state management
└── README.md
```

## 🎮 How to Play

### Motato Mode (`motato.html`)
1. **Move**: Use WASD or Arrow Keys
2. **Attack**: Weapons automatically shoot nearest enemies
3. **Survive**: Complete waves to earn money and XP
4. **Level Up**: Gain stat boosts every level
5. **Wave Control**: Start new waves when ready

### Tower Defense Mode (`go.html` or `towers.html`)
1. **Select Tower**: Click on a tower card
2. **Place**: Click on canvas to place tower
3. **Start Wave**: Begin the enemy assault
4. **Abilities**: Use Hype Burst and momentum
5. **Strategy**: Upgrade towers and use chain effects

### GitHub Pages Deployment
The game works on GitHub Pages! Access via:
- Main page: `https://[username].github.io/UTowerDefense/`
- Motato: `https://[username].github.io/UTowerDefense/motato.html`
- Tower Defense: `https://[username].github.io/UTowerDefense/go.html`

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

### Motato Mechanics Integration
Based on the MotatoWithUnity repository analysis:
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

### Motato Mode
- [ ] Item shop between waves
- [ ] Multiple weapon types
- [ ] Stat modifiers and items
- [ ] More character sprites (different classes)
- [ ] Boss enemies
- [ ] Achievements and unlocks

### Tower Defense Mode
- [ ] Tower upgrades UI
- [ ] More tower types
- [ ] Path editor
- [ ] Multiple difficulty levels

### Both Modes
- [ ] Save/load game state
- [ ] Sound effects and music
- [ ] Particle system for better effects
- [ ] Mobile touch controls
- [ ] Leaderboards
- [ ] Multiplayer support

## 📜 License

This project is open source and available for educational purposes.

## 🙏 Credits

- Inspired by Motato by Blobfish
- MotatoWithUnity reference implementation
- WebGL2 rendering techniques from various sources

---

**Note**: This is a modernized version using WebGL2 and ECS architecture. The original game logic has been preserved while the rendering engine has been completely rewritten for better performance and maintainability.
