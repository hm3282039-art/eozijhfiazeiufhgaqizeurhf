import { Modal } from '../components/Modal.js';
import { button, el } from '../dom.js';

/**
 * Panneau Admin : tout tester en 1 clic (monnaies, pets, coffres, zones, joueur, ambiances).
 * Fenêtre sombre et claire, rangée par catégories. Ouvert par le bouton « 🛠️ Admin Panel »
 * ou par la touche F2.
 *
 * @param {{
 *   addCoins: (amount: number) => void,
 *   addDiamonds: (amount: number) => void,
 *   resetWallet: () => void,
 *   spawnPet: (variant: 'huge' | 'golden' | 'rainbow') => void,
 *   toggleDamageBoost: () => boolean,
 *   spawnBossChest: () => void,
 *   nukeMap: () => void,
 *   unlockZone2: () => void,
 *   setPlayerSpeed: (multiplier: number) => void,
 *   setPetSize: (multiplier: number) => void,
 *   toggleMood: () => 'day' | 'sunset',
 *   setQuality: (quality: 'performance' | 'ultra') => void,
 * }} actions
 */
export class AdminPanel extends Modal {
  #actions;
  #boostButton;
  #moodButton;
  #speedValue;
  #sizeValue;
  #qualityButton;

  constructor(actions) {
    super({ title: 'Admin Panel', emoji: '🛠️', variant: 'admin' });
    this.#actions = actions;

    this.#boostButton = button(
      { class: 'admin-btn admin-btn--danger', 'aria-pressed': 'false', onClick: () => this.#toggleBoost() },
      ['⚔️ Boost Dégâts des Pets x10 : OFF'],
    );
    this.#moodButton = button(
      { class: 'admin-btn admin-btn--utility', onClick: () => this.#toggleMood() },
      ['☀️ Passer au coucher de soleil doré'],
    );
    this.#speedValue = el('strong', { text: 'x1.0' });
    this.#sizeValue = el('strong', { text: 'x1.0' });
    this.#qualityButton = button(
      { class: 'admin-btn admin-btn--utility', onClick: () => this.#toggleQuality() },
      ['🎮 Qualité : Ultra'],
    );

    this.body.append(
      this.#section('💰 Économie & Ressources', [
        button({ class: 'admin-btn admin-btn--gold', onClick: () => actions.addCoins(1000) }, ['🪙 +1 000 Pièces']),
        button({ class: 'admin-btn admin-btn--gold', onClick: () => actions.addCoins(100000) }, ['🪙 +100 000 Pièces']),
        button({ class: 'admin-btn admin-btn--diamond', onClick: () => actions.addDiamonds(500) }, ['💎 +500 Diamants']),
        button({ class: 'admin-btn admin-btn--utility', onClick: () => actions.resetWallet() }, ['🔄 Remettre à Zéro']),
      ]),
      this.#section('🐾 Gestion & Spawn de Pets', [
        button({ class: 'admin-btn admin-btn--pet', onClick: () => actions.spawnPet('huge') }, ['🔥 Spawner HUGE Cat Géant !']),
        button({ class: 'admin-btn admin-btn--gold', onClick: () => actions.spawnPet('golden') }, ['✨ Spawner Pet DORÉ (Golden)']),
        button({ class: 'admin-btn admin-btn--rainbow', onClick: () => actions.spawnPet('rainbow') }, ['🌈 Spawner Pet ARC-EN-CIEL (Rainbow)']),
        button({ class: 'admin-btn admin-btn--utility', onClick: () => actions.activateGamepass('extra-pets') }, ['🐾 +15 Pets Équipés (Gamepass)']),
        this.#boostButton,
      ]),
      this.#section('📦 Monde, Coffres & Zones', [
        button({ class: 'admin-btn admin-btn--world', onClick: () => actions.spawnBossChest() }, ['👑 Faire apparaître un Coffre Boss ici']),
        button({ class: 'admin-btn admin-btn--danger', onClick: () => actions.nukeMap() }, ['💥 Tout Casser (Nuke Map)']),
        button({ class: 'admin-btn admin-btn--world', onClick: () => actions.unlockZone2() }, ['🔓 Débloquer Zone 2 Gratuitement']),
        button({ class: 'admin-btn admin-btn--world', onClick: () => actions.unlockZone3() }, ['💎 Débloquer Zone 3 Gratuitement']),
      ]),
      this.#section('⚡ Joueur & Graphismes', [
        this.#slider('🏃 Vitesse du Joueur', this.#speedValue, 1, 3, 0.1, 1, (value) => actions.setPlayerSpeed(value)),
        this.#slider('🐾 Taille des Pets', this.#sizeValue, 0.5, 3, 0.1, 1, (value) => actions.setPetSize(value)),
        this.#qualityButton,
        this.#moodButton,
      ]),
    );
  }

  #section(title, children) {
    return el('section', { class: 'admin-section' }, [
      el('h3', { class: 'admin-section__title', text: title }),
      el('div', { class: 'admin-grid' }, children),
    ]);
  }

  #slider(label, valueElement, min, max, step, initial, onChange) {
    const input = el('input', {
      type: 'range',
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(initial),
      'aria-label': label,
    });
    input.addEventListener('input', () => {
      const value = Number(input.value);
      valueElement.textContent = `x${value.toFixed(1)}`;
      onChange(value);
    });
    return el('label', { class: 'admin-slider' }, [
      el('span', { class: 'admin-slider__label' }, [label, ' ', valueElement]),
      input,
    ]);
  }

  #toggleBoost() {
    const enabled = this.#actions.toggleDamageBoost();
    this.#boostButton.setAttribute('aria-pressed', String(enabled));
    this.#boostButton.classList.toggle('is-active', enabled);
    this.#boostButton.replaceChildren(`⚔️ Boost Dégâts des Pets x10 : ${enabled ? 'ON' : 'OFF'}`);
  }

  #toggleQuality() {
    // Bascule entre Performance FPS Max et Qualité Ultra.
    const current = this.#qualityButton.textContent.includes('Ultra') ? 'performance' : 'ultra';
    this.#actions.setQuality(current);
    const label = current === 'ultra' ? '🎮 Qualité : Ultra' : '🎮 Qualité : Performance FPS Max';
    this.#qualityButton.replaceChildren(label);
    this.#qualityButton.classList.toggle('is-active', current === 'ultra');
  }

  #toggleMood() {
    const mood = this.#actions.toggleMood();
    this.#moodButton.replaceChildren(
      mood === 'sunset' ? '🌙 Revenir au jour' : '☀️ Passer au coucher de soleil doré',
    );
  }
}
