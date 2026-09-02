# Groundhog Arena 2070 — Backyard Tower Defense × Survival

> **2070 Edition.** The flagship `arena.html` is now a neural-linked, installable iPhone game: liquid-glass HUD, wide-color neon bloom, an orientation-adaptive yard, twin-stick touch, Taptic haptics, gyro tilt + shake-to-rage, Bluetooth controllers, a camera "Holo-Yard" mode, share cards, an AI announcer, wake lock, offline play and cross-device save sync — all in one dependency-free HTML file.

## 📱 iPhone systems (arena.html)

Open the yard on an iPhone and the **DEVICE LINK** panel on the menu shows which systems are online. Everything degrades gracefully on other browsers.

| System | What it does | How |
| --- | --- | --- |
| 📲 **Installable PWA** | Home Screen icon, per-model splash screens, standalone fullscreen, safe-area layout for the notch / Dynamic Island / home indicator | `manifest.webmanifest`, `apple-touch-icon`, `apple-touch-startup-image`, `viewport-fit=cover` + `env(safe-area-inset-*)` |
| 📦 **Offline** | The whole yard is cached on first visit; an "update ready" toast appears when a new build ships | `sw.js` (stale-while-revalidate app shell, `SKIP_WAITING` flow) |
| 🔄 **Adaptive yard** | Portrait iPhones get a tall 560×960 yard, landscape phones a wide 1200×600 one, desktops the classic 960×560; the dock becomes a side column in landscape | `pickArenaSize()` at run start + CSS grid media queries |
| 🎯 **Twin-stick touch** | Floating move stick on the left half, aim stick on the right, drag-and-release to place, **long-press** a tower to upgrade, tap to select | Multi-touch handling on the canvas only (`touch-action:none`) |
| 📳 **Haptics** | Taptic feedback on hits, builds, upgrades, level-ups, rage, boss entrances, wave clears and game over | iOS `<input type="checkbox" switch>` trick, `navigator.vibrate` elsewhere, controller rumble via `vibrationActuator` |
| 🧭 **Tilt & shake** | Gyro tilt steering (auto-recentres on rotation) and **shake your phone to trigger RAGE** | `DeviceMotionEvent.requestPermission()` + `deviceorientation` / `devicemotion` |
| 🎮 **Controllers** | MFi / DualSense / Xbox pads: left stick moves, right stick aims or positions the placement cursor, A places/starts waves, X = rage, Y = upgrade, bumpers cycle defenses, Start pauses; menus and level-up cards are navigable | Gamepad API polled every frame |
| 📷 **Holo-Yard** | Projects the translucent arena over your real backyard via the rear camera | `getUserMedia({video:{facingMode:'environment'}})` behind a transparent canvas |
| 📤 **Share cards** | Rendered 1200×630 run cards go straight into the iOS share sheet (falls back to text / clipboard) | Web Share API level 2 with files |
| 🗣️ **AI announcer** | Boss warnings, rage callouts, wave reports, victory and defeat lines | Web Speech `speechSynthesis` |
| 🌈 **Wide color + bloom** | Display-P3 canvas and CSS accents, GPU-composited neon bloom, adaptive resolution when frames run long | `getContext('2d',{colorSpace:'display-p3'})`, `color(display-p3 …)`, a quarter-res multiply/blur/screen pass |
| 🔆 **Wake lock & audio session** | The screen never dims mid-wave; audio respects the silent switch and mixes with your own music | Screen Wake Lock API, `navigator.audioSession.type='ambient'` |
| 🔁 **Save sync** | Export the whole burrow as a `GA2070:` code, share it, import it anywhere; persistent storage is requested so iOS keeps your progress | `navigator.storage.persist()`, Web Share / Clipboard |
| 🔗 **Deep links** | Siri Shortcuts / Home Screen quick actions: `?diff=Hard&play=1`, `?holo=1` | URL params + manifest `shortcuts` |
| 🔔 **Badging** | A paused run in the background shows an app badge until you return | Badging API |
| ♿ **Accessibility** | Live region for toasts, 44pt touch targets, reduced-motion support, VoiceOver labels | `aria-live`, `prefers-reduced-motion` |

**New 2070 content:** the 🛸 **Holo Drone** (instant hit-scan laser, never misses), the 🌀 **Gravity Well** (drags pests inward and slows them; bosses resist), and the 🤖 **Rogue Mower Bot** pest (armored, immune to slows) from wave 7.

**Legacy note:** the original `index.html` landing, `motato.html`, `go.html` and `towers.html` still work unchanged.


## 🦫 Groundhog Arena (`arena.html`) — the flagship mode

A polished single-file hybrid of tower defense and arena survival. Pilot the groundhog with WASD (or a touch joystick), build and upgrade garden defenses around yourself, and survive escalating waves of backyard pests.

**Features**
- **10 defense types** — Acorn Turret, Beehive (splash), Sprinkler (slow), Thorn Launcher (pierce), Storm Totem (chain lightning), Sunflower (aura buffs), Melon Mortar (long-range arcing artillery with a blind spot up close), Cash Crop (harvests passive income), Holo Drone (hit-scan laser) and Gravity Well (pull + slow) — each upgradable to level 8, sellable, with a tap-to-select stats panel
- **Player progression** — enemies drop XP orbs; each level presents a 4-card perk draft from 20 perks, including four build-defining archetypes: Rooted Fortune (stand still for a giant resource magnet + regen), Momentum Runner (damage ramps while moving), Turret Whisperer (buff towers you stand near), and Glass Cannon
- **Meta-progression** — runs bank 🥕 Carrots based on waves, kills, and boss takedowns; spend them in the Burrow on **4 playable classes** (Classic, Burly, Hawkeye, Hoarder Chuck) and **3 permanent upgrade tracks** (starting cash, damage, XP gain) — all persisted between sessions
- **12 pest types** — rats, mosquitoes, boars, splitting rabbits, loot raccoons, weaving vipers, dash-striking bats, skunks (stink cloud on death slows tower fire), quilled hedgehogs (death burst of quills), and armored rogue mower bots (immune to slows) — plus **3 rotating bosses** every 5 waves, each with its own AI pattern and HP bar: the charging Grizzly, the minion-summoning Fox, and the feather-strafing Hawk
- **Enemy visual polish** — spawn-in pop, direction-facing sprites, waddle wobble, pulsing boss glow, elite rings
- **🎆 Seasonal calendar** — three auto-detected special occasions (`?season=july4|halloween|winter` to force, `?noparty` to disable), each with a menu banner, a daily +50 🥕 gift, themed fireworks, and seasonal elite rings:
  - **July 4th week** — America's-birthday celebration, fireworks on wave clears and boss kills, and the Hawk becomes the LIBERTY EAGLE with red-white-and-blue feathers
  - **Halloween Haunt** (Oct 24–31) — pumpkin-strewn moonlit yard with drifting fog, 👻 ghost pest variants, 🍬 candy cash drops, and the PHANTOM FOX
  - **Winter Festival** (Dec 20–Jan 2) — falling snow, snow-drift lawn, and the Grizzly becomes the POLAR WARDEN 🐻‍❄️
  A "Grand Finale" wave event rains celebratory fireworks on pests year-round
- **Wave modifiers** — every wave rolls a twist (Farmers Market, Morning Buzz, Cold Snap, Hailstorm, Fertile Grounds)
- **Groundhog Rage & combo system** — kills charge a global overdrive; kill streaks stack damage bonuses
- **Armory: 4 weapon classes** — Acorn Slinger (ranged), Claws & Tail (melee arc swipes with knockback and a 360° tail-spin every 4th hit), Seed Shotgun (5-pellet spray), Thorn Rifle (slow piercing sniper)
- **Victory & Endless** — defend the yard through wave 20 for a carrot bonus, then push into Endless Mode where shielded/swift/enraged elite pests join every wave
- **14 achievements** — persistent, each worth bonus carrots, shown in the Burrow
- **A living groundhog** — waddles with dust puffs, faces its target, and when idle will sniff, look around, stretch, nibble a carrot, or doze off
- **Juice & graphics** — hand-drawn tower bodies with aiming, recoiling barrels, muzzle flashes, and gold level pips; boss intro splash cards; enemy death-pop animations and impact rings; soft entity shadows; additive-glow projectiles and XP orbs; a detailed lawn (mow stripes, grass tufts, flowers, stones, vignette) with drifting fireflies and cloud shadows; particles, screen shake, floating text, chain-lightning arcs, synth SFX and a generative soundtrack (WebAudio, no assets)
- **Quality of life** — pause menu with music/SFX/haptics/announcer/twin-stick/tilt/Holo-Yard/bloom toggles, 1×/2×/3× speed, auto-start waves, **auto-spend** (AI buys and upgrades towers with spare cash), difficulty select, persistent best wave, **recent-run history in the Burrow**, game-over stats + share card + instant restart, full touch/mobile/controller support
- **Zero dependencies** — one self-contained HTML file, works from `file://`, GitHub Pages, or any static host (installable + offline when served over HTTPS)

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
- [x] Mobile touch controls
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
