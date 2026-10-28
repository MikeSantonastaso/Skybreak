# Skybreak

A browser prototype of a roguelike jet dogfighting game. Pick a location and a jet, survive as many waves of enemy fighters as you can, pick field upgrades between waves, and bring home credits for jets, guns and paint, and medals for unlocking and upgrading perks.

## Survival

- Wave 1 is one fighter, wave 2 is two, and so on. From wave 3 every third fighter is a newer jet type, and from wave 5 one in four is an ace. From wave 3 about half of the rest are variants (see below).
- **Every tenth wave brings the location's boss** with half the wave as escorts, and each boss after the first is tougher. Downing a location's boss opens the next location.
- Hull and special charges carry over between waves. The best wave at each location is saved, and every wave pays credits.
- **Enemy variants:** interceptors (FAST) are quick and fragile, heavy fighters (HEAVY) are armored and hit hard, ghosts (GHOST) can't be locked and only show on the HUD and radar inside 1.5 km but carry no missiles, and hunters (HUNTER) carry four missiles and fire them from long range.

## Weapons

- **Gun groups:** every fitted gun is in the primary or the secondary fire group (set per hardpoint in Loadout; bays default to primary, pods to secondary). Only the selected group fires. Swap with the mouse wheel, Tab or G, 1 / 2, gamepad X, or the SWAP touch button.
- **Heat:** each group has its own heat gauge. At full that group locks until it cools to 30%, and you swap to the other group automatically while it cools. The group you aren't firing cools the whole time.
- **Special:** one per jet, on the right mouse button or R, like a grenade: a few charges that refill one at a time, and gun kills take 2 s off the cooldown.

| Special | Charges | Cooldown | Price | What it does |
| --- | --- | --- | --- | --- |
| Heat-seeking missiles | 1 to 3, by jet | 22 s | Free | Lock on, then fire. Flares and hard breaks can shake them |
| Rocket pod | 2 | 12 s | Free | Eight unguided rockets down the nose |
| Flak cannon | 3 | 8 s | 1,800 | A shell that bursts beside the first enemy it passes and hits everything nearby |
| EMP pulse | 1 | 26 s | 3,500 | Knocks out every enemy within 1.1 km for 3.5 s and defeats missiles chasing you |

## Perks

- **Slots:** perks are equipped in the hangar's Perks tab and work on every jet. You start with 3 slots, get a 4th for downing your first boss and a 5th for downing the bosses of 3 locations.
- **Tiers:** unlock perks with medals, then raise each from tier I to V (2, 3, 5 and 8 medals). You earn a medal for every wave you survive and three for every boss.
- **Field upgrades:** after every wave you pick one that lasts for the rest of the run, or a field repair. Picks come in four rarities: **common** and **rare** stat boosts that stack, **epics** that change how you fight (ricochet rounds, both gun groups firing together, twin-shot specials, leech rounds, second wind, hot pursuit, squadron leader), and **cursed** trade-offs (overcharged barrels, stripped airframe, glass rails, blood money). Epics get likelier as the waves climb, and every card after a boss wave is an epic.
- **Synergies:** every pick has a tag (Guns, Heat, Special, Airframe, Flight, Wingman). Three of one tag opens its bonus: Gunslinger, Thermal discipline, Quartermaster, Ironclad, Slipstream or Wingman ace.
- **Reroll and skip:** one reroll a run plus one for every boss, or skip a pick for 30 credits plus 10 a wave, paid when the run ends.
- **Wingman:** the Wingman perk brings one wingman per pilot (in co-op too). Tiers give them more hull and firepower; a downed wingman is back next wave. Wingman field upgrades (armor, guns, missiles, Cover me) only show up while you have one.

## Hangar and loadout

- **Hangar:** five jets to buy with credits, and a paint shop with schemes bought with credits or earned by downing bosses, racking up kills or surviving 30 waves.
- **Loadout:** each jet has its own gun hardpoints (bays inside the airframe for cannons, wing pylons for gun pods), a payload limit, a gun limit and a list of guns it can take. The Loadout tab shows the jet from above with a marker on every hardpoint: pick one and fit a gun. Seven guns, from the light M3 .50 cal to the ADEN 30 mm and the SUU-23 pod, are bought once with credits; a gun that comes fitted on a jet you own is free. Weight above the factory fit costs turn and thrust (lighter gives a little back), pods add drag, and pods on the F-35 halve its stealth. In combat every gun fires from its own hardpoint at its own rate. Set each gun's fire group and pick the special below the guns.
- **Testing:** Settings has an Unlock everything button that opens every location, jet, gun, secondary, perk and paint scheme.

| Jet | Hardpoints | Gun limit | Payload | Factory guns (primary / secondary) |
| --- | --- | --- | --- | --- |
| F-5E | 2 nose bays, 2 pylons | 2 | 3 | M39 / M39 |
| F-16C | 2 root bays, 2 pylons | 3 | 4 | M61 / M3 |
| F-14B | 2 nose bays, 4 pylons | 4 | 5.5 | M61 / M3 |
| F/A-18E | 1 nose bay, 4 pylons | 4 | 5 | M61 / minigun pod |
| F-35C | 1 internal bay, 3 pylons | 3 | 4.5 | GAU-22 / none |

Old saves carry over: ranks trained in the old skill web come back as medals, and a heat 5 clear keeps the Gold standard paint.

**Play:** open `index.html` in a browser, or use the GitHub Pages link for this repository.

## Online co-op

Survival for one to four pilots over the internet, with no server of our own. On the Survival tab, one pilot picks **Host a room** and shares the four-letter code (or the invite link); the others type it and **Join**. The host picks the location and launches, and everyone flies their own jet, loadout and perks.

- **Difficulty** goes up with every pilot past the first: 60% more fighters per wave, 25% more enemy hull (bosses too), and three more fighters in the air at once.
- **Friendly fire is on.** Guns, missiles and flak hit teammates, and your missiles can lock a teammate (the HUD marks it FRIENDLY).
- **Going down** doesn't end your run while a teammate is still flying. You watch them until the wave is cleared, then come back with half hull and one field upgrade lost at random. If the whole team goes down, the run ends for everyone.
- After every wave each pilot picks a field upgrade, and the next wave starts when everyone has picked. Pause doesn't stop the game in co-op. Co-op runs pay credits and medals but don't count toward your solo best wave.

How it works: `net.js` uses [PeerJS](https://peerjs.com) (loaded from cdnjs only when you open a room) and Skybreak's own broker (`peer.165-245-229-241.sslip.io`, falling back to PeerJS's free public broker if it's down) to introduce the browsers, then the game talks peer to peer over WebRTC, falling back to PeerJS's relay when a firewall blocks a direct link. The host's game flies the enemies and runs the waves; each pilot's game flies their own jet and decides when enemy fire hits them, and the shooter's game decides friendly fire. If the host leaves, the run ends and everyone banks what they earned. Add `?peer=host:port` to the URL to use a different [peerjs-server](https://github.com/peers/peerjs-server) instead. `server/setup.sh` sets up the broker on a fresh Ubuntu 24.04 server: run it as root and it installs peerjs-server as a service behind Caddy with a free HTTPS certificate.

## Controls (mouse aim)

| Input | Action |
| --- | --- |
| Mouse | Aim. The jet flies toward the circle. In cockpit view it moves the stick |
| W / S | Throttle. Keep holding W at 100% for afterburner |
| A / D, Q / E | Roll, rudder |
| Left mouse / Space | Guns (selected group) |
| Wheel / Tab / G / 1 / 2 | Swap primary and secondary guns |
| Right mouse / R | Special. Missiles need a lock first. Charges refill on a cooldown |
| F / middle mouse | Flares |
| V (hold) | Free look |
| C | Chase / cockpit view |
| P / Esc | Pause |

A gamepad and touch controls also work. Progress is saved in your browser.

## Game feel and performance

- **Juice:** kills freeze the game for a few frames (hit-stop, longer for aces and bosses), throw burning debris and a shockwave, and flash a kill marker on the HUD. The camera shakes with a little roll on hits, blasts and while the guns fire, and jets that tear past close by whoosh. The engine has a turbine whine, an afterburner roar and wind noise that builds with speed. **Calm mode** in Settings turns the shake, flashes and hit-stop well down, and starts on if your system asks for reduced motion. Hit-stop is off in co-op.
- **Performance:** bullets, missiles, smoke, sparks and debris come from pools and never leave the scene, so a big fight builds nothing new. Other planes swap to a merged low-poly model past 900 m, damaged jets far beyond the fog stop trailing smoke, and no more than 16 fighters fly at once however many pilots there are. In a fight the game watches its frame rate and lowers the resolution and the particle budget if it drops under about 38 fps, then raises them again once there's headroom.

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
