# Skybreak

A browser prototype of a roguelike jet dogfighting game. Pick a location and a jet, survive as many waves of enemy fighters as you can, pick field upgrades between waves, and bring home credits for jets, guns and paint, and medals for unlocking and upgrading perks.

## Survival

- Wave 1 is one fighter, wave 2 is two, and so on. From wave 3 every third fighter is a newer jet type, and from wave 5 one in four is an ace. From wave 3 about half of the rest are variants (see below).
- **Every tenth wave brings the location's boss** with half the wave as escorts, and each boss after the first is tougher. Downing a location's boss opens the next location.
- Hull and special charges carry over between waves. The best wave at each location is saved, and every wave pays credits.
- **Enemy variants:** interceptors (FAST) are quick and fragile, heavy fighters (HEAVY) are armored and hit hard, ghosts (GHOST) can't be locked and only show on the HUD and radar inside 1.5 km but carry no missiles, and hunters (HUNTER) carry four missiles and fire them from long range.

## Danger, achievements and the run summary

- **Danger:** before a run, pick modifiers on the Survival tab to make it harder. Each point of danger pays 10% more credits and 5% more medals. In co-op the host's danger applies to everyone.

| Modifier | Points | Effect |
| --- | --- | --- |
| Thin skin | 1 per rank (2 ranks) | You take 15% more damage per rank |
| Swarm | 1 per rank (2 ranks) | 25% more fighters every wave per rank |
| Hardened | 1 per rank (2 ranks) | Fighters and bosses get 20% more hull per rank |
| Ace academy | 2 | Aces from wave 2, one fighter in three |
| Hot rails | 1 | Every enemy fighter carries one more missile |
| Mixed bag | 1 | Every kind of variant from wave 1 |
| Short on flares | 1 | Half the flares |
| No ground crew | 2 | No field repairs or spare parts between waves |
| No second chances | 1 | No rerolls |
| Boss rush | 3 | A boss every 5 waves instead of every 10 |
| Foul weather | 1 | Storm cells on every wave |

- The highest danger at which you've downed each location's boss is saved and shown on the location card and the Records tab.
- **Achievements** (Records tab): 29 feats, from First blood to Into the fire (wave 10 at danger 10). They pay credits or medals, or unlock paint schemes (Ace hunter, Hazard stripes, Inferno, Squadron colours, Hexed), perks (Gun-kill bounty, Big warheads) or a free F-16C. A toast pops up the moment you earn one.
- **Run summary:** the debrief shows time flown, accuracy, damage dealt and taken, best kill streak, damage split by weapon (each gun, the special, wingman, ricochets, arc rounds and so on), your build with its synergies, the danger modifiers and any achievements, and **Copy summary** puts a text version on the clipboard to share.

## Daily sortie

- Once a UTC day everyone gets the same sortie: one location, era and jet (stock guns, no perks), two danger modifiers, and the same waves, weather, ground targets and field upgrade offers. It's on the Survival tab, solo only.
- **Score:** 1,000 a wave, 25 a kill, 500 a boss. Fly it as often as you like; your best counts. The debrief shows the score, **Copy summary** puts it at the top of the text, and the Survival tab keeps your best for the last month of days.
- **Shared board:** today's top 20 callsigns (each keeps their best) come from a small service next to the matchmaking server, `server/board.js`. Set it up on the droplet with `curl -fsSL https://raw.githubusercontent.com/MikeSantonastaso/Skybreak/main/server/setup-board.sh | sudo bash`; it serves `https://board.<ip-with-dashes>.sslip.io` behind the same Caddy. Add `?board=https://host` to the URL to use another. If the board is down the sortie still works and says so. Scores are sent by the browser and only sanity-checked, so the board keeps friends honest; it isn't cheat-proof.
- Two achievements: fly a daily sortie, and fly one on 5 different days.

## Strike waves, weather and bosses

- **Strike waves** (waves 3, 7, 11 and every fourth wave after, unless it's a boss wave) bring ground targets that have to be knocked out along with the fighters, and a few fewer fighters to make room. Over land they're flak batteries, which burst shells around you out to about 2.5 km, and (in the Modern and Future eras) SAM sites, which launch missiles from the ground. At sea they're warships that circle on open water with flak, deck guns and, after WW2, missiles. Ground targets show as hollow squares on the radar.
- **Storm cells** can roll in on any wave from the fourth (about one wave in three, or every wave with the Foul weather modifier). They show as grey patches on the radar. Inside one the air is rough, the fog closes in and nothing can be locked, by you or the enemy, and a missile that follows you in can lose you. Thunderheads throw lightning at whatever flies through (enemies included); in the desert and the canyon they're dust storms with no lightning but rougher air.
- **More bosses:** the first boss wave brings the location's own boss. After that it takes turns with three others, each named for the era:
  - a **stealth ace** (Su-57 stealth ace, Der Graf in an Me 262, Reaper prime): a fighter flown by the best pilot in the sky, which only shows on the HUD inside 2.5 km and can only be locked inside 1.5 km;
  - a **carrier** that launches fighters every few seconds until it goes down: a warship circling at sea (Kuznetsov, Akagi, Tidebreaker), a flying carrier anywhere else;
  - an **airship** (Graf Zeppelin, Aerostat battleship, Cloud fortress): huge, slow, armored and bristling with guns and flak.
  At the Pacific Fleet the carrier comes first. Any boss opens the next location.
- Five achievements go with these: destroy 25 ground or naval targets, down a stealth ace, a carrier and an airship, and down 10 enemies inside storm cells.

## Eras

Pick an era on the Survival tab. Each era has its own jets, guns, enemies, bosses and field upgrades, and keeps its own best wave per location (Modern keeps the records you already had). In co-op everyone flies the host's era.

- **WW2 (piston fighters):** P-51D Mustang (free), Spitfire Mk II, F4U Corsair and Bf 109 F-2, against Bf 109s, Zeros, Fw 190s, Ki-84s and the Me 262. Wing guns (.303, .50 cal M2, Hispano 20 mm, MK 108 30 mm), rockets and flak, and no guided missiles: fighters carry none, and hunters carry two slow, weakly guided rockets. Throttle past military power shows WEP. Bosses are bombers and gunships such as the Fw 200 Condor and the Me 264 Amerika bomber. Era upgrades: Water injection, Armored windscreen and Incendiary rounds (set targets burning).
- **Modern (jet age):** the original game, unchanged.
- **Future (energy weapons):** XF-9 Nightjar (free), Valkyrie, Nova and Volition, all with recharging shields, against drones, Wraiths, Lancers, Mantises and Reapers. Pulse lasers, plasma and coilguns, faster and harder-turning missiles, EMP and the **Railgun** special (two charges, a long-range beam that hits everything along its line). Bosses are motherships and command ships. Era upgrades: Shield capacitor, Nanite hull (hull regenerates) and Phase shift (harder to hit, faster shield recharge).
- Three achievements cover the eras: wave 10 in WW2, wave 10 in the Future, and wave 5 in all three.

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
- **Gunner seat:** in the room, a guest can pick **Ride as the host's gunner** instead of flying. The gunner sits on the spine of the host's jet and works a turret with the mouse (or WASD / arrows / the touch stick) in any direction: twin .50s in WW2, a 20 mm revolver cannon in the Modern era, a pulse laser in the Future. The pilot flies and takes the hits; the gunner's kills are their own, field upgrades still boost the turret, and F pops the pilot's flares. If the jet goes down, both are out until the wave ends.

How it works: `net.js` uses [PeerJS](https://peerjs.com) (loaded from cdnjs only when you open a room) and Skybreak's own broker (`peer.165-245-229-241.sslip.io`, falling back to PeerJS's free public broker if it's down) to introduce the browsers, then the game talks peer to peer over WebRTC, falling back to PeerJS's relay when a firewall blocks a direct link. The host's game flies the enemies and runs the waves; each pilot's game flies their own jet and decides when enemy fire hits them, and the shooter's game decides friendly fire. If the host leaves, the run ends and everyone banks what they earned. Add `?peer=host:port` to the URL to use a different [peerjs-server](https://github.com/peers/peerjs-server) instead. `server/setup.sh` sets up the broker on a fresh Ubuntu 24.04 server: run it as root and it installs peerjs-server as a service behind Caddy with a free HTTPS certificate.

## Stalls, G and energy

- **Stalls:** too slow, or past the wing's stall angle, and your jet departs: a wing drops, the nose falls and the controls go mushy, with a buffet and a stall horn, until you have flying speed again. Push the nose down and add power. Jets' fly-by-wire limiter keeps you short of the stall angle; WW2 fighters have no limiter and drop a wing hardest; future jets vector their thrust and barely depart at all.
- **G:** pull past your tolerance (6 G in WW2, 9 G for Modern jets, 12 G with Future inertial suits) and the edges of the screen grey in; keep pulling and you black out for a few seconds with the stick limp. Hard negative G reds you out the same way. The G readout turns amber, then red, and the mouse-aim instructor eases the pull as you grey out (it won't stop you if you insist). The **G-suit** field upgrade adds 1.5 G of tolerance per rank.
- **Energy:** the ENERGY readout shows whether you're gaining (green ▲) or bleeding (amber or red ▼) total energy, height plus speed, in metres a second. The speed readout turns green around your jet's corner speed, where it turns tightest.

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

The five Modern player jets, the four WW2 fighters and three of the four Future ships (the Nova keeps its built-in model) use detailed glTF models from Sketchfab, listed in `assets/manifest.json`; the Bf 109 model also flies as the WW2 enemy Bf 109. The game loads them after the hangar appears, and falls back to the built-in models if a file is missing. Each model was shrunk for the web: textures cut to 1024 px (2048 px for the Bf 109 and the XF-9 and Valkyrie ships, whose whole airframes share one texture), meshes compressed, and landing gear and the F-5's open canopy removed. The WW2 and Future models were also baked nose-forward with their parts flattened into one body (the Volition also lost its open canopy), and each WW2 fighter keeps its propeller under a node called `prop`, centred on the hub, so the game spins it. The manifest also sets each model's facing and where its afterburner flames sit. Paint schemes are painted onto the models by a shader that projects the pattern onto the airframe and keeps the model's own panel lines, shading and colourful markings; `detail` (0 to 1) turns down how much of a grimy texture shows through. A sky photo (`.hdr`) can be listed the same way under `skies`, keyed by location.

| Jet | Model | Author | License |
| --- | --- | --- | --- |
| F-5E | [F-5E (DCS World)](https://sketchfab.com/3d-models/f-5e-dcs-world-9edaba003c1c4c96911b44a7d0c67016) | KojfDiscord | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| F-16C | [Lockheed Martin F-16E/F Fighting Falcon](https://sketchfab.com/3d-models/lockheed-martin-f-16ef-fighting-falcon-d54c72e055a647ad9173e01548e50db3) | andertan | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| F-14B | [F-14 Tomcat - Fighter Jet - Free](https://sketchfab.com/3d-models/f-14-tomcat-fighter-jet-free-497f77c311b5411d9b567d8707a81c33) | bohmerang | [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/) |
| F/A-18E | [Boeing F/A-18F Super Hornet - Free](https://sketchfab.com/3d-models/boeing-fa-18f-super-hornet-free-447caa975f534554a83f70f0877b73fb) | bohmerang | [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/) |
| F-35C | [F-35A Lightning II](https://sketchfab.com/3d-models/f-35a-lightning-ii-a06d6113cfb44a0aa7b8f17106aca9c4) | shangus930 | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| P-51D | [P-51 Mustang](https://sketchfab.com/3d-models/p-51-mustang-36f0f3e71d2a4c18b479db1ae8f9e7a7) | UlissesVinicios | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| Spitfire Mk II | [Supermarine Spitfire MK II](https://sketchfab.com/3d-models/supermarine-spitfire-mk-ii-e0afc8c4cf8946feabbad0e0a9e2e5fe) | DedRam | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| F4U Corsair | [Corsair Plane](https://sketchfab.com/3d-models/corsair-plane-e711389c942b4a4489f901cf345abad7) | G. (gunn24) | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| Bf 109 F-2 | [BF 109 F-2 Messerschmitt](https://sketchfab.com/3d-models/bf-109-f-2-messerschmitt-e48914913f2140158bee87495916d64e) | GRIP420 | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| XF-9 Nightjar | [SPACESHIP - CB1](https://sketchfab.com/3d-models/spaceship-cb1-4a8fddf9fadf4d2998925ca4b6d4b93b) | Lezalit | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| Valkyrie | [SPACESHIP - CB2](https://sketchfab.com/3d-models/spaceship-cb2-b9708d29e85746c891b48075a8a1e70a) | Lezalit | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |
| Volition | [Volition Fighter](https://sketchfab.com/3d-models/volition-fighter-e1b77308e1f24d8aa0c5da969971ba30) | tulex_art | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) |

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
