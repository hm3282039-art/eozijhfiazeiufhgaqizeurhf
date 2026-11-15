/**
 * Gestion du clavier.
 *
 * On lit `event.code` (position PHYSIQUE de la touche) : `KeyW` désigne la touche
 * située en haut à gauche du pavé de déplacement, qui porte la lettre « Z » sur un
 * clavier AZERTY et « W » sur un QWERTY. ZQSD et WASD fonctionnent donc tous les
 * deux sans aucun réglage, en plus des flèches.
 */
const BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
};

/** Secours si le navigateur ne fournit pas `event.code` (claviers virtuels, etc.). */
const KEY_FALLBACK = {
  z: 'KeyW',
  w: 'KeyW',
  q: 'KeyA',
  a: 'KeyA',
  s: 'KeyS',
  d: 'KeyD',
  ' ': 'Space',
  spacebar: 'Space',
};

const ACTION_BY_CODE = new Map(
  Object.entries(BINDINGS).flatMap(([action, codes]) => codes.map((code) => [code, action])),
);

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export class InputManager {
  #down = new Set();
  #pressed = new Set();
  #target;

  constructor(target = window) {
    this.#target = target;
    target.addEventListener('keydown', this.#onKeyDown);
    target.addEventListener('keyup', this.#onKeyUp);
    target.addEventListener('blur', this.#reset);
    document.addEventListener('visibilitychange', this.#reset);
  }

  /** La touche liée à l'action est-elle maintenue ? */
  isDown(action) {
    return BINDINGS[action].some((code) => this.#down.has(code));
  }

  /** L'action vient-elle d'être déclenchée pendant cette image ? */
  wasPressed(action) {
    return this.#pressed.has(action);
  }

  /**
   * Direction demandée par le joueur, normalisée.
   * x : −1 (gauche) → +1 (droite) · y : −1 (reculer) → +1 (avancer)
   */
  getMoveVector(out = { x: 0, y: 0 }) {
    out.x = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
    out.y = (this.isDown('forward') ? 1 : 0) - (this.isDown('backward') ? 1 : 0);
    const length = Math.hypot(out.x, out.y);
    if (length > 1) {
      out.x /= length;
      out.y /= length;
    }
    return out;
  }

  /** À appeler en fin d'image : vide les déclenchements « instantanés ». */
  endFrame() {
    this.#pressed.clear();
  }

  dispose() {
    this.#target.removeEventListener('keydown', this.#onKeyDown);
    this.#target.removeEventListener('keyup', this.#onKeyUp);
    this.#target.removeEventListener('blur', this.#reset);
    document.removeEventListener('visibilitychange', this.#reset);
  }

  #resolveCode(event) {
    if (event.code && event.code !== 'Unidentified') return event.code;
    return KEY_FALLBACK[event.key?.toLowerCase()] ?? event.key;
  }

  #onKeyDown = (event) => {
    if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;

    const code = this.#resolveCode(event);
    const action = ACTION_BY_CODE.get(code);
    if (!action) return;

    // Empêche le défilement de la page (flèches, espace) et le « clic » d'un bouton focalisé.
    event.preventDefault();
    if (!this.#down.has(code)) this.#pressed.add(action);
    this.#down.add(code);
  };

  #onKeyUp = (event) => {
    const code = this.#resolveCode(event);
    if (!ACTION_BY_CODE.has(code)) return;
    if (!isTypingTarget(event.target)) event.preventDefault();
    this.#down.delete(code);
  };

  #reset = () => {
    this.#down.clear();
    this.#pressed.clear();
  };
}
