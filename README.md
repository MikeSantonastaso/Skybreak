# Skybreak

A browser prototype of a roguelike jet dogfighting game. Pick a location, a heat level and a jet, fly a branching map of eight missions that ends in a boss, collect gear that changes how you fight, and bring home credits for new jets and paint, and skill points for the skill web.

## Progression

- **Locations** open one at a time: down the boss at one to open the next.
- **Heat 0 to 5** at each location. Downing the boss at a heat level opens the next one there. Each level adds enemy hull, damage, skill and numbers, and pays more credits and boss skill points.
- **Skill web:** 61 permanent skills in five rings around a core, across six sectors (Airframe, Engine, Guns, Missiles, Pilot, Logistics). Train any skill connected to one you already have. Each sector ends in a keystone, and hybrid skills on the rim join neighbouring sectors.
- **Hangar:** five jets to buy with credits, and a paint shop with schemes bought with credits or earned by downing bosses, racking up kills or clearing heat 5.

**Play:** open `index.html` in a browser, or use the GitHub Pages link for this repository.

## Controls (mouse aim)

| Input | Action |
| --- | --- |
| Mouse | Aim. The jet flies toward the circle. In cockpit view it moves the stick |
| W / S | Throttle. Keep holding W at 100% for afterburner |
| A / D, Q / E | Roll, rudder |
| Left mouse / Space | Guns |
| Right mouse / R | Missile, after lock-on |
| F / middle mouse | Flares |
| V (hold) | Free look |
| C | Chase / cockpit view |
| P / Esc | Pause |

A gamepad and touch controls also work. Progress is saved in your browser.

Built with [three.js](https://threejs.org/) r128, loaded from cdnjs. `assets.js` is the asset library: procedural paint textures, the paint schemes, and every aircraft and boss model.
