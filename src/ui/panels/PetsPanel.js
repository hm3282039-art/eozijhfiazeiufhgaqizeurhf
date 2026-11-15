import { Modal } from '../components/Modal.js';
import { el } from '../dom.js';

const PORTRAIT_SIZE = 168;

/** Cadrage du visage dans sa texture : un carré centré sur les yeux et la bouche. */
const CROP = { x: 0.1, y: 0.088, size: 0.8 };

/** Vignette d'un pet : son visage kawaii (pet procédural) ou une empreinte (modèle .glb). */
function createPortrait(pet) {
  const face = pet.visual?.portrait;
  if (!face) {
    return el('div', {
      class: 'pet-card__portrait pet-card__portrait--placeholder',
      text: pet.visual ? '🐾' : '⏳',
      style: { background: pet.palette.body },
    });
  }

  const canvas = el('canvas', { class: 'pet-card__portrait', width: PORTRAIT_SIZE, height: PORTRAIT_SIZE });
  const side = face.width * CROP.size;
  canvas
    .getContext('2d')
    .drawImage(face, face.width * CROP.x, face.height * CROP.y, side, side, 0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  return canvas;
}

function createCard(pet) {
  return el('li', { class: 'pet-card' }, [
    createPortrait(pet),
    el('span', { class: 'pet-card__name', text: pet.name }),
    el('div', { class: 'pet-card__tags' }, [
      el('span', { class: 'tag tag--green', text: 'Équipé' }),
      pet.source === 'model' && el('span', { class: 'tag tag--blue', text: 'Modèle .glb' }),
      pet.isTest && el('span', { class: 'tag tag--purple', text: 'Test' }),
    ]),
  ]);
}

/**
 * Panneau « Pets » : la liste des pets équipés.
 */
export class PetsPanel extends Modal {
  #grid;
  #pets = [];
  #max = 0;

  constructor() {
    super({ title: 'Mes Pets', emoji: '🐾', variant: 'pets' });
    this.#grid = el('ul', { class: 'pet-grid' });
    this.body.append(
      this.#grid,
      el('p', {
        class: 'modal__hint',
        text: 'Tes pets te suivent partout ! Utilise « ➕ Pet de test » (en haut à droite) pour agrandir ton équipe.',
      }),
    );
  }

  /** @param {{ pets: import('../../pets/Pet.js').Pet[], max: number }} state */
  setPets({ pets, max }) {
    this.#pets = pets;
    this.#max = max;
    if (this.isOpen) this.#render();
  }

  open(options) {
    this.#render();
    super.open(options);
  }

  #render() {
    this.subtitle.textContent = `${this.#pets.length} / ${this.#max}`;
    this.#grid.replaceChildren(...this.#pets.map(createCard));
  }
}
