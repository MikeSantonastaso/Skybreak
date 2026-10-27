# Skybreak

A browser prototype of a roguelike jet dogfighting game. Pick a location and a jet, survive as many waves of enemy fighters as you can, pick perks between waves, and bring home credits for jets, guns and paint, and medals for unlocking perks.

## Survival

- Wave 1 is one fighter, wave 2 is two, and so on. From wave 3 every third fighter is a newer jet type, and from wave 5 one in four is an ace. From wave 3 about half of the rest are variants (see below).
- **Every tenth wave brings the location's boss** with half the wave as escorts, and each boss after the first is tougher. Downing a location's boss opens the next location.
- Hull and secondary charges carry over between waves. The best wave at each location is saved, and every wave pays credits.
- **Enemy variants:** interceptors (FAST) are quick and fragile, heavy fighters (HEAVY) are armored and hit hard, ghosts (GHOST) can't be locked and only show on the HUD and radar inside 1.5 km but carry no missiles, and hunters (HUNTER) carry four missiles and fire them from long range.

## Weapons

- **Guns:** each jet has a gun limit: 2 on the F-5E, 3 on the F-16C and F-35C, and 4 on the F-14B and F/A-18E. In-run perks make your guns better but never add more.
- **Heat:** all guns share one heat gauge. Firing fills it, and a gun's Fire time in the Loadout tab is how long that gun alone can fire from cold. At full the guns lock until the gauge cools back to 30%, so more guns hit harder but overheat sooner. It cools 0.3 s after you let go.
- **Secondary weapon:** one per jet, on the right mouse button or R. Each holds a few charges that refill one at a time, and gun kills take 2 s off the cooldown.

| Secondary | Charges | Cooldown | Price | What it does |
| --- | --- | --- | --- | --- |
| Heat-seeking missiles | 1 to 3, by jet | 22 s | Free | Lock on, then fire. Flares and hard breaks can shake them |
| Rocket pod | 2 | 12 s | Free | Eight unguided rockets down the nose |
| Flak cannon | 3 | 8 s | 1,800 | A shell that bursts beside the first enemy it passes and hits everything nearby |
| EMP pulse | 1 | 26 s | 3,500 | Knocks out every enemy within 1.1 km for 3.5 s and defeats missiles chasing you |

## Perks

- **During a run:** before wave 1 and after every wave you pick a new perk for an empty slot, or the next level of a perk you already hold, up to level III. Field repair and one reroll a run are also on offer. Once every slot is full and every perk is at III, plain boosts fill the cards.
- **Slots:** the F-5E and F-16C have 3 perk slots, and the F-14B, F/A-18E and F-35C have 4.
- **Unlocks:** 7 perks are open from the start. The other 15 are unlocked for good in the Perks tab with medals. You earn a medal for every two waves you survive and three for every boss.
- Perks cover guns (damage, rate of fire, heat, spread, crits, explosive and arc rounds, glass cannon), the secondary (cooldown, charges, damage, gun-kill bounty), the airframe (hull, repairs, dodging, Phoenix), flight (thrust and roll) and tactics (wingmen, killing time).

## Hangar and loadout

- **Hangar:** five jets to buy with credits, and a paint shop with schemes bought with credits or earned by downing bosses, racking up kills or surviving 30 waves.
- **Loadout:** each jet has its own gun hardpoints (bays inside the airframe for cannons, wing pylons for gun pods), a payload limit, a gun limit and a list of guns it can take. The Loadout tab shows the jet from above with a marker on every hardpoint: pick one and fit a gun. Seven guns, from the light M3 .50 cal to the ADEN 30 mm and the SUU-23 pod, are bought once with credits; a gun that comes fitted on a jet you own is free. Weight above the factory fit costs turn and thrust (lighter gives a little back), pods add drag, and pods on the F-35 halve its stealth. In combat every gun fires from its own hardpoint at its own rate. Pick the secondary weapon below the guns.
- **Testing:** Settings has an Unlock everything button that opens every location, jet, gun, secondary, perk and paint scheme.

| Jet | Hardpoints | Gun limit | Payload | Perk slots | Factory guns |
| --- | --- | --- | --- | --- | --- |
| F-5E | 2 nose bays, 2 pylons | 2 | 3 | 3 | 2 × M39 |
| F-16C | 2 root bays, 2 pylons | 3 | 4 | 3 | M61 |
| F-14B | 2 nose bays, 4 pylons | 4 | 5.5 | 4 | M61 |
| F/A-18E | 1 nose bay, 4 pylons | 4 | 5 | 4 | M61 |
| F-35C | 1 internal bay, 3 pylons | 3 | 4.5 | 4 | GAU-22 |

Old saves carry over: ranks trained in the old skill web come back as medals, and a heat 5 clear keeps the Gold standard paint.

**Play:** open `index.html` in a browser, or use the GitHub Pages link for this repository.

## Online co-op

Survival for one to four pilots over the internet, with no server of our own. On the Survival tab, one pilot picks **Host a room** and shares the four-letter code (or the invite link); the others type it and **Join**. The host picks the location and launches, and everyone flies their own jet, loadout and perks.

- **Difficulty** goes up with every pilot past the first: 60% more fighters per wave, 25% more enemy hull (bosses too), and three more fighters in the air at once.
- **Friendly fire is on.** Guns, missiles and flak hit teammates, and your missiles can lock a teammate (the HUD marks it FRIENDLY).
- **Going down** doesn't end your run while a teammate is still flying. You watch them until the wave is cleared, then come back with half hull and one perk level lost at random. If the whole team goes down, the run ends for everyone.
- After every wave each pilot picks a perk, and the next wave starts when everyone has picked. Pause doesn't stop the game in co-op. Co-op runs pay credits and medals but don't count toward your solo best wave.

How it works: `net.js` uses [PeerJS](https://peerjs.com) (loaded from cdnjs only when you open a room) and its free public broker to introduce the browsers, then the game talks peer to peer over WebRTC, falling back to PeerJS's relay when a firewall blocks a direct link. The host's game flies the enemies and runs the waves; each pilot's game flies their own jet and decides when enemy fire hits them, and the shooter's game decides friendly fire. If the host leaves, the run ends and everyone banks what they earned. Add `?peer=host:port` to the URL to use your own [peerjs-server](https://github.com/peers/peerjs-server) instead.

## Controls (mouse aim)

| Input | Action |
| --- | --- |
| Mouse | Aim. The jet flies toward the circle. In cockpit view it moves the stick |
| W / S | Throttle. Keep holding W at 100% for afterburner |
| A / D, Q / E | Roll, rudder |
| Left mouse / Space | Guns |
| Right mouse / R | Secondary weapon. Missiles need a lock first. Charges refill on a cooldown |
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
