import { PET_SPECIES, ALL_SPECIES } from '../../config/petSpecies.js';
import { RARITY_ORDER, getRarity } from '../../config/rarityConfig.js';
import { PET_VARIANTS_VISUAL } from '../../config/variantConfig.js';
import { Modal } from '../components/Modal.js';
import { button, el } from '../dom.js';
import { createIcon } from '../icons.js';

const PORTRAIT_SIZE = 168;
const CROP = { x: 0.1, y: 0.088, size: 0.8 };

/** Cadrage du visage dans sa texture. */
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

/** Vignette d'espèce (index) : visage ou silhouette « ? » si non découvert. */
function createSpeciesPortrait(species, discovered) {
  if (!discovered) {
    return el('div', { class: 'pet-card__portrait pet-card__portrait--silhouette', text: '?' });
  }
  // Pour l'index, on utilise la palette de l'espèce (visage procédural généré au besoin).
  const palette = species.palette;
  const canvas = el('canvas', { class: 'pet-card__portrait', width: PORTRAIT_SIZE, height: PORTRAIT_SIZE });
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = palette.body;
  ctx.beginPath();
  ctx.arc(PORTRAIT_SIZE / 2, PORTRAIT_SIZE / 2, PORTRAIT_SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Yeux.
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.arc(PORTRAIT_SIZE * 0.38, PORTRAIT_SIZE * 0.42, PORTRAIT_SIZE * 0.06, 0, Math.PI * 2);
  ctx.arc(PORTRAIT_SIZE * 0.62, PORTRAIT_SIZE * 0.42, PORTRAIT_SIZE * 0.06, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function rarityTag(rarity) {
  return el('span', { class: `tag tag--rarity tag--${rarity.id}`, text: rarity.label });
}

/**
 * Panneau « Inventaire » : 3 onglets —
 *   🐾 Pets (équipés, « Équiper les Meilleurs », clic pour équiper/déséquiper)
 *   📖 Index (collection par rareté, silhouettes pour les non découverts)
 *   🧪 Prêt à venir (Potions / Enchantements / Objets / Œufs Spéciaux)
 */
export class PetsPanel extends Modal {
  #tabs;
  #content;
  #pets = [];
  #max = 0;
  #collection = new Set();
  #discovered = 0;
  #onEquipBest;
  #onToggleEquip;
  #equipState;
  #activeTab = 'pets';

  /**
   * @param {{
   *   onEquipBest: () => void,
   *   onToggleEquip: (pet: object) => void,
   *   equipState: (speciesId: string, rarityId: string) => boolean,
   * }} handlers
   */
  constructor({ onEquipBest, onToggleEquip, equipState }) {
    super({ title: 'Inventaire', emoji: '🐾', variant: 'pets' });
    this.#onEquipBest = onEquipBest;
    this.#onToggleEquip = onToggleEquip;
    this.#equipState = equipState;

    this.#tabs = el('div', { class: 'pets-tabs' });
    this.#content = el('div', { class: 'pets-content' });
    this.body.append(this.#tabs, this.#content);

    this.#renderTabs();
  }

  /** @param {{ pets: import('../../pets/Pet.js').Pet[], max: number, collection: Set<string>, discovered: number }} state */
  setPets({ pets, max, collection, discovered }) {
    this.#pets = pets;
    this.#max = max;
    this.#collection = collection ?? this.#collection;
    this.#discovered = discovered ?? this.#discovered;
    if (this.isOpen) this.#renderActiveTab();
  }

  open(options) {
    this.#renderActiveTab();
    super.open(options);
  }

  #renderTabs() {
    const tabs = [
      { id: 'pets', label: '🐾 Pets' },
      { id: 'index', label: '📖 Index' },
      { id: 'coming', label: '🧪 Prêt à venir' },
    ];
    this.#tabs.replaceChildren(
      ...tabs.map((tab) =>
        button(
          { class: 'pets-tab', 'data-tab': tab.id, onClick: () => this.#switchTab(tab.id) },
          [el('span', { class: 'pets-tab__label', text: tab.label })],
        ),
      ),
    );
    this.#activeTab = 'pets';
    this.#switchTab('pets');
  }

  #switchTab(id) {
    this.#activeTab = id;
    for (const tab of this.#tabs.querySelectorAll('.pets-tab')) {
      tab.classList.toggle('is-active', tab.dataset.tab === id);
    }
    this.#renderActiveTab();
  }

  #renderActiveTab() {
    if (this.#activeTab === 'pets') this.#renderPets();
    else if (this.#activeTab === 'index') this.#renderIndex();
    else this.#renderComing();
  }

  // ── Onglet 🐾 Pets ─────────────────────────────────────────────────────────
  #renderPets() {
    this.subtitle.textContent = `Équipés ${this.#pets.length} / ${this.#max}`;

    const equipBest = button({ class: 'equip-best-btn', onClick: () => this.#onEquipBest() }, [
      '⚔️ Équiper les Meilleurs',
    ]);

    const grid = el('ul', { class: 'pet-grid' }, this.#pets.map((pet) => this.#petCard(pet)));

    this.#content.replaceChildren(
      equipBest,
      el('p', { class: 'modal__hint pets-tab__hint', text: 'Clique sur un pet pour l’équiper / le déséquiper.' }),
      grid,
    );
  }

  #petCard(pet) {
    const rarity = getRarity(pet.rarity.id);
    const variant = PET_VARIANTS_VISUAL[pet.variant];
    const card = el('li', { class: `pet-card${pet.isTest ? ' pet-card--test' : ''}` }, [
      createPortrait(pet),
      el('span', { class: 'pet-card__name', text: pet.name }),
      el('div', { class: 'pet-card__tags' }, [
        rarityTag(rarity),
        variant.id !== 'normal' && el('span', { class: 'tag tag--gold', text: variant.label }),
        pet.isTest && el('span', { class: 'tag tag--purple', text: 'Test' }),
      ]),
      el('div', { class: 'pet-card__damage', text: `🗡️ Dégâts ×${pet.damageMultiplier.toFixed(1)}` }),
    ]);
    card.classList.add('is-clickable');
    card.addEventListener('click', () => {
      if (pet.isTest) return;
      this.#onToggleEquip?.(pet);
    });
    return card;
  }

  // ── Onglet 📖 Index ───────────────────────────────────────────────────────
  #renderIndex() {
    const total = ALL_SPECIES.length * RARITY_ORDER.filter((r) => !r.special).length;
    this.subtitle.textContent = `Découverts ${this.#discovered} / ${total}`;

    const sections = RARITY_ORDER.filter((r) => !r.special).map((rarity) => {
      const cards = ALL_SPECIES.map((species) => {
        const discovered = this.#collection.has(`${species.id}:${rarity.id}:normal`);
        return this.#indexCard(species, rarity, discovered);
      });
      return el('section', { class: 'index-section' }, [
        el('h4', { class: 'index-section__title' }, [
          el('span', { class: `index-section__dot tag--${rarity.id}` }),
          el('span', { text: `${rarity.label}` }),
        ]),
        el('ul', { class: 'pet-grid pet-grid--index' }, cards),
      ]);
    });

    this.#content.replaceChildren(...sections);
  }

  #indexCard(species, rarity, discovered) {
    return el('li', { class: `pet-card pet-card--index${discovered ? '' : ' is-locked'}` }, [
      createSpeciesPortrait(species, discovered),
      el('span', { class: 'pet-card__name', text: discovered ? species.name : '???' }),
      el('div', { class: 'pet-card__tags' }, [rarityTag(rarity)]),
    ]);
  }

  // ── Onglet 🧪 Prêt à venir ─────────────────────────────────────────────────
  #renderComing() {
    const groups = [
      { emoji: '🧪', title: 'Potions', desc: 'Boissons régénératrices et bonus de combat.', items: ['Potion de Vitalité', 'Potion de Force', 'Potion de Chance'] },
      { emoji: '✨', title: 'Enchantements', desc: 'Améliorations d’équipement et d’aura.', items: ['Enchantement Solaire', 'Enchantement Lunaire', 'Enchantement Arc-en-ciel'] },
      { emoji: '📦', title: 'Objets', desc: 'Artefacts et collections utiles.', items: ['Clé Étincelante', 'Boîte à Trésors', 'Portail Mystique'] },
      { emoji: '🥚', title: 'Œufs Spéciaux', desc: 'Œufs premium à venir : obsidienne, arc-en-ciel, cosmique.', items: ['Œuf d’Obsidienne', 'Œuf Arc-en-ciel', 'Œuf Cosmique'] },
    ];

    const cards = groups.map((group) =>
      el('section', { class: 'coming-group' }, [
        el('h4', { class: 'coming-group__title', text: `${group.emoji} ${group.title}` }),
        el('p', { class: 'coming-group__desc', text: group.desc }),
        el('ul', { class: 'coming-group__list' }, group.items.map((item) => el('li', { class: 'coming-item', text: item }))),
      ]),
    );

    this.#content.replaceChildren(
      el('p', { class: 'modal__hint', text: 'Ces sections arrivent dans les prochaines mises à jour.' }),
      el('div', { class: 'coming-grid' }, cards),
    );
  }
}
