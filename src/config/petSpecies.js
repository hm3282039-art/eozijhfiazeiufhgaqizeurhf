/**
 * Catalogue des espèces de pets.
 *
 * Chaque espèce peut être rendue de deux façons (classe `Pet` hybride) :
 *  1. `modelUrl` renseigné  → le fichier Blender (.glb / .gltf) est chargé avec GLTFLoader ;
 *  2. `modelUrl: null` (ou fichier introuvable) → générateur procédural « style Blender ».
 *
 * Pour utiliser un vrai modèle : dépose par exemple `cat.glb` dans `assets/models/`
 * puis remplace `modelUrl: null` par `modelUrl: 'assets/models/cat.glb'`.
 *
 * Palette :
 *   body      couleur principale (corps + fond du visage)
 *   secondary ventre, pattes, museau…
 *   accent    détails propres à l'espèce (intérieur d'oreille, oreilles, cornes…)
 *   cheek     joues roses
 *   ink       traits du visage (yeux, bouche)
 */
const INK = '#1b1d33';

export const PET_SPECIES = Object.freeze({
  cat: {
    id: 'cat',
    name: 'Starter Cat',
    builder: 'cat',
    modelUrl: null, // ex : 'assets/models/cat.glb'
    modelRotationY: 0,
    palette: { body: '#79cfff', secondary: '#eef2f8', accent: '#ff9ec4', cheek: '#ff8fbd', ink: INK },
  },
  dog: {
    id: 'dog',
    name: 'Happy Dog',
    builder: 'dog',
    modelUrl: null, // ex : 'assets/models/dog.glb'
    modelRotationY: 0,
    palette: { body: '#ffa32b', secondary: '#ffdc6a', accent: '#d9691a', cheek: '#ff8a8a', ink: INK },
  },
  dragon: {
    id: 'dragon',
    name: 'Mini Dragon',
    builder: 'dragon',
    modelUrl: null, // ex : 'assets/models/dragon.glb'
    modelRotationY: 0,
    palette: { body: '#ff3a3a', secondary: '#ffa42e', accent: '#ffd23f', cheek: '#ff9ca6', ink: INK },
  },
});

/** Les 3 pets équipés au lancement, dans l'ordre de la rangée (gauche → droite). */
export const STARTER_PETS = Object.freeze(['cat', 'dog', 'dragon']);

/**
 * Variantes de couleur : mêmes espèces, autres palettes.
 * Elles servent au bouton « Pet de test » et aux œufs de la boutique, et montrent que
 * le générateur procédural s'adapte à n'importe quelle palette.
 */
export const PET_VARIANTS = Object.freeze([
  {
    species: 'cat',
    id: 'candy-cat',
    name: 'Candy Cat',
    palette: { body: '#ff9ad2', secondary: '#fff3fa', accent: '#ffffff', cheek: '#ff6fae', ink: INK },
  },
  {
    species: 'dragon',
    id: 'emerald-dragon',
    name: 'Emerald Dragon',
    palette: { body: '#34cf6f', secondary: '#d7f56b', accent: '#ffd23f', cheek: '#ffb0b8', ink: INK },
  },
  {
    species: 'dog',
    id: 'choco-dog',
    name: 'Choco Dog',
    palette: { body: '#b8733d', secondary: '#ffe3b3', accent: '#7c4a21', cheek: '#ff9a9a', ink: INK },
  },
  {
    species: 'cat',
    id: 'midnight-cat',
    name: 'Midnight Cat',
    palette: { body: '#8a6bff', secondary: '#ece6ff', accent: '#ffb1e3', cheek: '#ff9ed6', ink: INK },
  },
  {
    species: 'dragon',
    id: 'ice-dragon',
    name: 'Ice Dragon',
    palette: { body: '#3fc4ff', secondary: '#dbf6ff', accent: '#ffffff', cheek: '#ffb0cf', ink: INK },
  },
  {
    species: 'dog',
    id: 'snow-dog',
    name: 'Snow Dog',
    palette: { body: '#f3f6ff', secondary: '#cfe9ff', accent: '#9db4d6', cheek: '#ffa3b5', ink: INK },
  },
]);
