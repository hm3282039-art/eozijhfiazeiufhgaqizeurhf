import { button, el } from '../dom.js';
import { createIcon } from '../icons.js';

/** Lignes d'aide : [touches, action]. */
const CONTROLS = [
  [['ZQSD', 'WASD'], 'Bouger'],
  [['Espace'], 'Sauter'],
  [['Souris'], 'Caméra'],
  [['Molette'], 'Zoom'],
];

/**
 * Boîte d'aide (en haut à droite) : rappel des touches + boutons de test
 * (changer l'animation des pets, ajouter / retirer un pet de test).
 * Un clic sur son titre la replie pour dégager l'écran.
 */
export class HelpBox {
  #animationName;
  #removeButton;
  #toggle;
  #content;

  /**
   * @param {{ onCycleAnimation: () => void, onAddTestPet: () => void, onRemoveTestPet: () => void }} handlers
   */
  constructor({ onCycleAnimation, onAddTestPet, onRemoveTestPet }) {
    this.#animationName = el('strong', { class: 'help-box__animation', text: '—' });

    this.#removeButton = button(
      {
        class: 'test-btn test-btn--icon test-btn--red',
        title: 'Retirer le dernier pet de test',
        'aria-label': 'Retirer le dernier pet de test',
        disabled: true,
        onClick: onRemoveTestPet,
      },
      ['➖'],
    );

    this.#toggle = button(
      {
        class: 'help-box__title',
        title: 'Replier / déplier l’aide',
        'aria-expanded': 'true',
        onClick: () => this.setCollapsed(!this.isCollapsed),
      },
      [el('span', { text: 'Commandes' }), createIcon('chevron', 'help-box__chevron')],
    );

    this.#content = el('div', { class: 'help-box__content' }, [
      el(
        'ul',
        { class: 'help-box__list' },
        CONTROLS.map(([keys, action]) =>
          el('li', { class: 'help-box__row' }, [
            el(
              'span',
              { class: 'help-box__keys' },
              keys.flatMap((key, index) => [
                index > 0 && el('span', { class: 'help-box__separator', text: '/' }),
                el('kbd', { text: key }),
              ]),
            ),
            el('span', { class: 'help-box__action', text: action }),
          ]),
        ),
      ),
      el('div', { class: 'help-box__tests' }, [
        button({ class: 'test-btn test-btn--purple', title: "Changer l'animation des pets", onClick: onCycleAnimation }, [
          el('span', { text: '🎬 Animation : ' }),
          this.#animationName,
        ]),
        el('div', { class: 'help-box__test-row' }, [
          button({ class: 'test-btn test-btn--green', title: 'Ajouter un pet de test', onClick: onAddTestPet }, [
            '➕ Pet de test',
          ]),
          this.#removeButton,
        ]),
      ]),
    ]);

    this.element = el('aside', { class: 'help-box', 'aria-label': 'Aide' }, [
      el('h2', { class: 'help-box__heading' }, [this.#toggle]),
      this.#content,
    ]);
  }

  get isCollapsed() {
    return this.#content.hidden;
  }

  /** Replie (titre seul) ou déplie la boîte. */
  setCollapsed(collapsed) {
    this.#content.hidden = collapsed;
    this.#toggle.setAttribute('aria-expanded', String(!collapsed));
    this.element.classList.toggle('is-collapsed', collapsed);
  }

  /** Affiche le nom du style d'animation en cours. */
  setAnimationName(name) {
    this.#animationName.textContent = name;
  }

  /** Active le bouton « retirer » uniquement s'il existe un pet de test. */
  setCanRemoveTestPet(canRemove) {
    this.#removeButton.disabled = !canRemove;
  }
}
