# Skybreak

A browser prototype of a roguelike jet dogfighting game. Pick a location, a heat level and a jet, fly a branching map of eight missions that ends in a boss, collect gear that changes how you fight, and bring home credits for new jets and paint, and skill points for the skill web.

## Progression

- **Locations** open one at a time: down the boss at one to open the next.
- **Heat 0 to 5** at each location. Downing the boss at a heat level opens the next one there. Each level adds enemy hull, damage, skill and numbers, and pays more credits and boss skill points.
- **Skill web:** 61 permanent skills in five rings around a core, across six sectors (Airframe, Engine, Guns, Missiles, Pilot, Logistics). Train any skill connected to one you already have. Each sector ends in a keystone, and hybrid skills on the rim join neighbouring sectors.
- **Survival:** a separate mode on its own tab. Wave 1 is one fighter, wave 2 is two, and so on. From wave 3 every third fighter is a newer jet type, and from wave 5 one in four is an ace. From wave 3 about half of the rest are variants (see below). After each wave pick a piece of gear or a field repair. Hull, missiles and the missile cooldown carry over between waves. The best wave at each location is saved, and every wave pays credits, with a skill point for every two.
- **Enemy variants** mix in from survival wave 3, and from the middle of a sortie map. Interceptors (FAST) are quick and fragile, heavy fighters (HEAVY) are armored and hit hard, ghosts (GHOST) can't be locked and only show on the HUD and radar inside 1.5 km but carry no missiles, and hunters (HUNTER) carry four missiles and fire them from long range.
- **Missiles are a special.** Each jet carries one to three on the rails, and each refills on a 24 s cooldown. Gun kills take 2 s off the cooldown. The Missiles sector of the skill web and the Ordnance crew, Ready rack and Gun-kill bounty gear cut the cooldown or add missiles.
- **Hangar:** five jets to buy with credits, and a paint shop with schemes bought with credits or earned by downing bosses, racking up kills or clearing heat 5.
- **Loadout:** each jet has its own gun hardpoints (bays inside the airframe for cannons, wing pylons for gun pods), a payload limit and a list of guns it can take. The Loadout tab shows the jet from above with a marker on every hardpoint: pick one and fit a gun. Seven guns, from the light M3 .50 cal to the ADEN 30 mm and the SUU-23 pod, are bought once with credits; a gun that comes fitted on a jet you own is free. Weight above the factory fit costs turn and thrust (lighter gives a little back), pods add drag, and pods on the F-35 halve its stealth. In combat every gun fires from its own hardpoint at its own rate.

| Jet | Hardpoints | Payload | Factory guns |
| --- | --- | --- | --- |
| F-5E | 2 nose bays, 2 pylons | 3 | 2 × M39 |
| F-16C | 2 root bays, 2 pylons | 4 | M61 |
| F-14B | 2 nose bays, 4 pylons | 5.5 | M61 |
| F/A-18E | 1 nose bay, 4 pylons | 5 | M61 |
| F-35C | 1 internal bay, 3 pylons | 4.5 | GAU-22 |

**Play:** open `index.html` in a browser, or use the GitHub Pages link for this repository.

## Controls (mouse aim)

| Input | Action |
| --- | --- |
| Mouse | Aim. The jet flies toward the circle. In cockpit view it moves the stick |
| W / S | Throttle. Keep holding W at 100% for afterburner |
| A / D, Q / E | Roll, rudder |
| Left mouse / Space | Guns |
| Right mouse / R | Missile, after lock-on. Each one refills on a cooldown |
| F / middle mouse | Flares |
| V (hold) | Free look |
| C | Chase / cockpit view |
| P / Esc | Pause |

A gamepad and touch controls also work. Progress is saved in your browser.

Built with [three.js](https://threejs.org/) r128, loaded from cdnjs. `assets.js` is the asset library: procedural paint textures, the paint schemes, and every aircraft and boss model.

## Aircraft models

The five player jets use detailed glTF models from Sketchfab, listed in `assets/manifest.json`. The game loads them after the hangar appears, and falls back to the built-in models if a file is missing. Each model was shrunk for the web: textures cut to 1024 px, meshes compressed, and landing gear and the F-5's open canopy removed. The manifest also sets each model's facing and where its afterburner flames sit. Paint schemes are painted onto the models by a shader that projects the pattern onto the airframe and keeps the model's own panel lines, shading and colourful markings; `detail` (0 to 1) turns down how much of a grimy texture shows through. A sky photo (`.hdr`) can be listed the same way under `skies`, keyed by location.

| Jet | Model | Author | License |
| --- | --- | --- | --- |
| F-5E | [F-5E (DCS World)](https://sketchfab.com/3d-models/f-5e-dcs-world-9edaba003c1c4c96911b44a7d0c67016) | KojfDiscord | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| F-16C | [Lockheed Martin F-16E/F Fighting Falcon](https://sketchfab.com/3d-models/lockheed-martin-f-16ef-fighting-falcon-d54c72e055a647ad9173e01548e50db3) | andertan | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| F-14B | [F-14 Tomcat - Fighter Jet - Free](https://sketchfab.com/3d-models/f-14-tomcat-fighter-jet-free-497f77c311b5411d9b567d8707a81c33) | bohmerang | [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/) |
| F/A-18E | [Boeing F/A-18F Super Hornet - Free](https://sketchfab.com/3d-models/boeing-fa-18f-super-hornet-free-447caa975f534554a83f70f0877b73fb) | bohmerang | [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/) |
| F-35C | [F-35A Lightning II](https://sketchfab.com/3d-models/f-35a-lightning-ii-a06d6113cfb44a0aa7b8f17106aca9c4) | shangus930 | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |

The modified model files in `assets/jets/` are shared under the same license as their originals. The F-14 and F/A-18 models are non-commercial only, so swap them out before the game is ever sold.

## Sky photos

Each location's sky is a real photo from [Poly Haven](https://polyhaven.com), listed under `skies` in `assets/manifest.json`. The game reads the photo's sun position and horizon colour to set the sunlight, fog and reflections, so the ground and the jets sit in the same light. Without the file it keeps the painted gradient sky.

| Location | Sky | License |
| --- | --- | --- |
| Arctic Circle | [Syferfontein 0d Clear (Pure Sky)](https://polyhaven.com/a/syferfontein_0d_clear_puresky) | CC0 |
| Desert Storm | [Rustig Koppie (Pure Sky)](https://polyhaven.com/a/rustig_koppie_puresky) | CC0 |
| Pacific Fleet | [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | CC0 |
| Metro Strike | [Belfast Sunset (Pure Sky)](https://polyhaven.com/a/belfast_sunset_puresky) | CC0 |
| Canyon Run | [Goegap](https://polyhaven.com/a/goegap) | CC0 |

The files in `assets/skies/` are the 2K versions with everything below the horizon filled with one colour, since the game never shows it. That halves each file to about 2.5 MB. `exposure` brightens or darkens a sky, `rot` turns it, and `keepFog` keeps the location's own fog colour instead of the photo's.
