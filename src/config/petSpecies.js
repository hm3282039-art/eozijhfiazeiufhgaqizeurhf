/**
 * Catalogue des ESPECES de pets (structuré, tableau propre).
 *
 * Chaque espèce est rendue de deux façons (classe `Pet` hybride) :
 *   1. `modelUrl` renseigné  → le fichier Blender (.glb / .gltf) est chargé ;
 *   2. `modelUrl: null`      → générateur procédural « style Blender » anatomique.
 *
 * Chaque espèce a un générateur ANATOMIQUE distinct (voir `procedural/species/`) :
 *   cat · dog · bunny · dragon · bear · panda · fox · axolotl · shark · griffin
 *
 * Palette (reprise par les rarités, qui ajoutent leur couleur + leur aura) :
 *   body      couleur principale (corps + fond du visage)
 *   secondary ventre, pattes, museau…
 *   accent    détails propres à l'espèce (oreilles, cornes, ailes…)
 *   cheek     joues roses
 *   ink       traits du visage (yeux, bouche)
 */
const INK = '#1b1d33';

/** Une espèce : données pures, pas de logique de rendu. */
/**
 * @typedef {object} PetSpecies
 * @property {string} id
 * @property {string} name
 * @property {string} builder      identifiant du générateur procédural (`species/index.js`)
 * @property {string | null} modelUrl
 * @property {number} modelRotationY
 * @property {import('./variantConfig.js').PetPalette} palette
 */

/** @type {Record<string, PetSpecies>} */
export const PET_SPECIES = Object.freeze({
  cat: {
    id: 'cat',
    name: 'Starter Cat',
    builder: 'cat',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#79cfff', secondary: '#eef2f8', accent: '#ff9ec4', cheek: '#ff8fbd', ink: INK },
  },
  dog: {
    id: 'dog',
    name: 'Happy Dog',
    builder: 'dog',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#ffa32b', secondary: '#ffdc6a', accent: '#d9691a', cheek: '#ff8a8a', ink: INK },
  },
  bunny: {
    id: 'bunny',
    name: 'Bunny',
    builder: 'bunny',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#ffe0f0', secondary: '#fff6fb', accent: '#ffc2e2', cheek: '#ff9ac6', ink: INK },
  },
  dragon: {
    id: 'dragon',
    name: 'Mini Dragon',
    builder: 'dragon',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#ff3a3a', secondary: '#ffa42e', accent: '#ffd23f', cheek: '#ff9ca6', ink: INK },
  },
  bear: {
    id: 'bear',
    name: 'Brown Bear',
    builder: 'bear',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#b57a45', secondary: '#e8c79a', accent: '#8a5a2b', cheek: '#ff9a9a', ink: INK },
  },
  panda: {
    id: 'panda',
    name: 'Panda',
    builder: 'panda',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#f4f6fb', secondary: '#ffffff', accent: '#2f3440', cheek: '#ff9ac6', ink: INK },
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    builder: 'fox',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#ff7a3a', secondary: '#fff3e6', accent: '#d94f1a', cheek: '#ffb0a0', ink: INK },
  },
  axolotl: {
    id: 'axolotl',
    name: 'Axolotl',
    builder: 'axolotl',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#ff9ec4', secondary: '#ffd0e6', accent: '#ff6fa8', cheek: '#ffb8d8', ink: INK },
  },
  shark: {
    id: 'shark',
    name: 'Shark',
    builder: 'shark',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#6f879b', secondary: '#dfe6ee', accent: '#3d4b5a', cheek: '#ffb8c8', ink: INK },
  },
  griffin: {
    id: 'griffin',
    name: 'Griffin',
    builder: 'griffin',
    modelUrl: null,
    modelRotationY: 0,
    palette: { body: '#b08bff', secondary: '#ece0ff', accent: '#ffd23f', cheek: '#ffb0c8', ink: INK },
  },
});

/** Les 3 pets équipés au lancement, dans l'ordre de la rangée (gauche → droite). */
export const STARTER_PETS = Object.freeze(['cat', 'dog', 'dragon']);

/** Toutes les espèces, sous forme de tableau trié (pour l'index / la collection). */
export const ALL_SPECIES = Object.freeze(Object.values(PET_SPECIES));

/**
 * Variantes de couleur : mêmes espèces, autres palettes.
 * Elles servent au bouton « Pet de test » et montrent que le générateur
 * procédural s'adapte à n'importe quelle palette.
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
    species: 'bunny',
    id: 'midnight-bunny',
    name: 'Midnight Bunny',
    palette: { body: '#8a6bff', secondary: '#ece6ff', accent: '#ffb1e3', cheek: '#ff9ed6', ink: INK },
  },
  {
    species: 'shark',
    id: 'ice-shark',
    name: 'Ice Shark',
    palette: { body: '#3fc4ff', secondary: '#dbf6ff', accent: '#ffffff', cheek: '#ffb0cf', ink: INK },
  },
  {
    species: 'fox',
    id: 'snow-fox',
    name: 'Snow Fox',
    palette: { body: '#f3f6ff', secondary: '#cfe9ff', accent: '#9db4d6', cheek: '#ffa3b5', ink: INK },
  },
]);
