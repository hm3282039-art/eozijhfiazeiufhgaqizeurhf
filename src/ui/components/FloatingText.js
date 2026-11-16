import * as THREE from 'three';
import { el } from '../dom.js';
import { formatNumber } from '../../utils/format.js';

const MAX_NUMBERS = 24;
const NUMBER_LIFE = 0.95;

/**
 * Calque HTML par-dessus la scène 3D :
 *  - barres de vie des Breakables (nom + barre verte/jaune/rouge + « 180 / 250 PV ») ;
 *  - chiffres de dégâts flottants (« -15 », « -30 CRIT! ») qui jaillissent et s'estompent.
 *
 * Les positions 3D sont projetées à l'écran à chaque image (`update`).
 */
export class FloatingText {
  #layer;
  #numbers = [];
  #hpBars = new Map();
  #projected = new THREE.Vector3();

  /** @param {HTMLElement} root conteneur (le HUD) */
  constructor(root) {
    this.#layer = el('div', { class: 'floating-layer', 'aria-hidden': 'true' });
    root.append(this.#layer);
  }

  /** Le calque DOM (à insérer dans le HUD, au-dessus du reste). */
  get element() {
    return this.#layer;
  }

  /**
   * Affiche un chiffre de dégâts au-dessus d'un point du monde.
   * @param {THREE.Vector3} worldPosition
   * @param {number} amount
   * @param {boolean} crit
   */
  showDamage(worldPosition, amount, crit) {
    let entry = this.#numbers.find((n) => n.life <= 0);
    if (!entry) {
      if (this.#numbers.length >= MAX_NUMBERS) return;
      const element = el('span', { class: 'damage-number' });
      this.#layer.append(element);
      entry = { element, life: 0, position: new THREE.Vector3() };
      this.#numbers.push(entry);
    }
    entry.life = NUMBER_LIFE;
    entry.position.copy(worldPosition);
    entry.position.x += (Math.random() - 0.5) * 0.8;
    entry.position.z += (Math.random() - 0.5) * 0.8;
    entry.element.textContent = crit ? `-${formatNumber(amount)} CRIT!` : `-${formatNumber(amount)}`;
    entry.element.classList.toggle('is-crit', crit);
    entry.element.style.display = '';
  }

  /**
   * Projette les barres de vie et les chiffres à l'écran.
   * @param {THREE.Camera} camera
   * @param {import('../../world/props/breakables/Breakable.js').Breakable[]} breakables
   * @param {import('../../world/props/breakables/Breakable.js').Breakable | null} target Breakable ciblé par les pets
   * @param {number} dt
   */
  update(camera, breakables, target, dt) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // ── Barres de vie ────────────────────────────────────────────────────────
    for (const breakable of breakables) {
      const visible = breakable.showHpBar || breakable === target;
      let bar = this.#hpBars.get(breakable);
      if (!visible) {
        if (bar) bar.element.style.display = 'none';
        continue;
      }
      if (!bar) {
        bar = this.#createHpBar(breakable);
        this.#hpBars.set(breakable, bar);
      }
      bar.element.style.display = '';
      const screen = this.#project(camera, breakable.position.x, breakable.height + 0.9, breakable.position.z, width, height);
      if (!screen) {
        bar.element.style.display = 'none';
        continue;
      }
      bar.element.style.transform = `translate(-50%, -100%) translate(${screen.x}px, ${screen.y}px)`;
      const fraction = breakable.hpFraction;
      bar.fill.style.width = `${Math.round(fraction * 100)}%`;
      bar.fill.className = `hp-bar__fill${fraction > 0.5 ? '' : fraction > 0.25 ? ' is-warning' : ' is-critical'}`;
      bar.text.textContent = `${formatNumber(Math.ceil(breakable.hp))} / ${formatNumber(breakable.maxHp)} PV`;
    }

    // ── Chiffres de dégâts ───────────────────────────────────────────────────
    for (const entry of this.#numbers) {
      if (entry.life <= 0) continue;
      entry.life -= dt;
      if (entry.life <= 0) {
        entry.element.style.display = 'none';
        continue;
      }
      entry.position.y += dt * 1.5;
      const screen = this.#project(camera, entry.position.x, entry.position.y, entry.position.z, width, height);
      if (!screen) {
        entry.element.style.display = 'none';
        continue;
      }
      const t = entry.life / NUMBER_LIFE;
      entry.element.style.transform = `translate(-50%, -50%) translate(${screen.x}px, ${screen.y}px) scale(${0.7 + 0.5 * Math.min(1, t * 3)})`;
      entry.element.style.opacity = String(Math.min(1, t * 2.5));
    }
  }

  #createHpBar(breakable) {
    const fill = el('div', { class: 'hp-bar__fill' });
    const element = el('div', { class: 'hp-bar' }, [
      el('span', { class: 'hp-bar__name', text: breakable.type.name }),
      el('div', { class: 'hp-bar__track' }, [fill]),
      el('span', { class: 'hp-bar__text' }),
    ]);
    this.#layer.append(element);
    return { element, fill, text: element.querySelector('.hp-bar__text') };
  }

  /** Projette un point du monde en pixels écran (`null` si derrière la caméra). */
  #project(camera, x, y, z, width, height) {
    this.#projected.set(x, y, z).project(camera);
    if (this.#projected.z > 1 || this.#projected.z < -1) return null;
    return {
      x: (this.#projected.x * 0.5 + 0.5) * width,
      y: (-this.#projected.y * 0.5 + 0.5) * height,
    };
  }
}
