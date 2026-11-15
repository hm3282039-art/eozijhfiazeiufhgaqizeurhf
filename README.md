# Pet World 3D

Jeu de pets en 3D façon **Pet Simulator 99** (Roblox), construit avec [Three.js](https://threejs.org/).
Version 1 : le **Hub de départ** (Zone 1) — île tropicale, fontaine, arche arc-en-ciel,
œuf géant, et porte verrouillée vers la Zone 2.

- **Joueur** : avatar articulé, déplacement relatif à la caméra, saut (coyote time + mémoire de touche).
- **Pets** : 3 starters (chat, chien, dragon) qui suivent en formation derrière le joueur,
  avec saut « |sin| » + balancement en marche et respiration au repos.
- **Caméra 3ème personne** : rotation au clic (gauche ou droit), zoom à la molette, suivi doux.
- **Interface PS99** : compteurs de pièces jaunes / diamants bleus, boutons Pets / Boutique / Téléportation,
  notifications, boîte d'aide repliable, boutons de test (animation, pet de test).
- **Pets hybrides** : modèle Blender (`.glb`) si `modelUrl` est défini, sinon générateur procédural
  « style Blender » (corps arrondi + visage dessiné sur canvas + accessoires sculptés).

## Lancer le jeu

Aucune installation, aucune dépendance : il suffit de Node.js (≥ 18) pour le petit serveur statique.

```bash
npm start
```

Puis ouvrir **http://localhost:5173** dans un navigateur.

> ⚠️ Le jeu charge Three.js depuis le CDN [jsDelivr](https://cdn.jsdelivr.net) : il faut donc
> une connexion Internet. Les modules ES ne fonctionnent pas depuis `file://` — passer par
> le serveur local (ou héberger le dossier sur n'importe quel hébergeur statique).

## Commandes

| Touche | Action |
|---|---|
| **ZQSD** / **WASD** / flèches | Bouger (relatif à la caméra) |
| **Espace** | Sauter (maintenir = sauts enchaînés) |
| **Souris** (clic maintenu + glisser) | Tourner la caméra autour du joueur |
| **Molette** | Zoomer / dézoomer |
| **Échap** | Fermer le panneau ouvert |

ZQSD et WASD fonctionnent tous les deux sans réglage (le clavier est lu par position physique).

## Utiliser un vrai modèle Blender (.glb)

1. Exporter le pet depuis Blender en **glTF 2.0 (.glb)**, avec une animation « Idle » si on veut.
2. Déposer le fichier dans **`assets/models/`** (ex : `assets/models/cat.glb`).
3. Dans **`src/config/petSpecies.js`**, renseigner l'URL du modèle :

```js
cat: {
  id: 'cat',
  name: 'Starter Cat',
  builder: 'cat',
  modelUrl: 'assets/models/cat.glb',   // ← au lieu de null
  modelRotationY: 0,                    // à ajuster si le modèle ne regarde pas vers +Z
  palette: { /* … */ },
},
```

Le modèle est alors **normalisé automatiquement** (plus grande dimension = 1,45 unité,
centré, posé au sol, ombres activées) et son animation « Idle » est jouée en boucle.
Si le fichier est introuvable ou invalide, le jeu affiche un avertissement dans la console
et retombe sur le générateur procédural : le jeu ne plante jamais.

## Structure du projet

```
index.html                  importmap (Three.js), liens CSS, points de montage
package.json                npm start → serveur statique
scripts/serve.mjs           serveur de développement (zéro dépendance)
assets/
  fonts/                    police Fredoka (variable, OFL) — utilisée aussi pour les textures canvas
  icons/                    favicon
  models/                   ← déposer ici les .glb de pets
styles/
  base.css                  police, variables de design, remise à zéro, canvas
  hud.css                   disposition générale du HUD
  components/               un fichier par composant (barre d'actions, modales, toasts…)
src/
  main.js                   démarrage (chargement de la police, puis Game)
  Game.js                   assemble les systèmes, ordre d'une image, API de débogage
  boot/                     garde-fou si le CDN est injoignable
  config/                   réglages : gameConfig, worldConfig, palette, petSpecies, zones, shopCatalog
  core/                     boucle de jeu, entrées clavier, bus d'événements, création du renderer
  graphics/                 géométries « douces », matériaux, ombres rondes, fusion de maillages statiques
  camera/                   caméra 3ème personne (OrbitControls + suivi du joueur)
  world/                    île, océan, nuages, décor, collisions 2D, plan du hub
  player/                   avatar, contrôleur (déplacement + saut), animation
  pets/
    Pet.js                  classe hybride : modèle .glb OU procédural
    PetManager.js           équipe, formation, séparation des pets, étiquettes
    PetMovement.js          déplacement vers l'emplacement de formation
    PetFormation.js         grille de formation derrière le joueur
    PetModelLoader.js       chargement + normalisation des .glb
    PetLabel.js             étiquette de nom (taille constante à l'écran de près)
    animation/              animateur + styles (Rebond, Lévitation, Toupie, Dandinement)
    procedural/             générateur : anatomie, visages canvas, pattes/queues/oreilles/cornes/ailes
  economy/                  porte-monnaie (pièces, diamants) et boutique d'œufs
  ui/                       HUD, composants, panneaux (Pets, Boutique, Téléportation)
  utils/                    maths, nombres aléatoires, formatage (typographie française)
```

## Réglages

Tout ce qui se « tune » est dans **`src/config/gameConfig.js`** : vitesse du joueur, saut,
distance de caméra, nombre maximum de pets (12), espacement de la formation, taille des modèles, etc.
Le plan de l'île (spawn, fontaine, porte, prix de la Zone 2) est dans **`src/config/worldConfig.js`**.

## Débogage

Dans la console du navigateur, `window.game` expose le jeu :

```js
game.debugStep(2)              // avance la simulation de 2 s (indépendant du framerate)
game.player.teleport(0, 0, 0)  // déplace le joueur
game.pets.addPet({ species: 'cat' })
game.wallet.add('coins', 1000)
game.cameraRig.camera          // caméra de rendu
```

## Notes techniques

- **Three.js 0.170.0** depuis jsDelivr (importmap dans `index.html`).
- **Aucun build, aucun framework** : modules ES natifs, interface en DOM vanilla.
- Les maillages statiques (buissons, nuages, feuillages) sont **fusionnés par matériau** :
  ~270 draw calls et ~330 000 triangles pour la scène complète, ombres comprises.
- Les visages des pets procéduraux sont des textures dessinées sur `<canvas>` appliquées
  uniquement sur la face avant du corps (`RoundedBoxGeometry`, groupe de matériaux n° 4).
