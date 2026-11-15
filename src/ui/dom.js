import { frenchTypography } from '../utils/format.js';

/**
 * Mini-utilitaire de création d'éléments DOM (l'interface n'a besoin d'aucun framework).
 *
 * @example
 *   el('button', { class: 'btn btn--green', onClick: save }, [el('span', { text: 'OK' })])
 *
 * @param {string} tag
 * @param {object} [props]
 *   `class` · `text` (typographie française appliquée) · `html` (chaîne de confiance uniquement)
 *   `dataset` · `style` (objet)
 *   `onXxx` (écouteur d'événement) · toute autre clé devient un attribut HTML
 * @param {(Node | string | null | undefined | false)[]} [children]
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = frenchTypography(String(value));
    else if (key === 'html') element.innerHTML = value;
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else if (key === 'style') Object.assign(element.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else element.setAttribute(key, value === true ? '' : value);
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }
  return element;
}

/**
 * Crée un bouton d'interface. Après un clic à la souris, le bouton rend le focus au jeu :
 * sinon la barre d'espace (saut) « recliquerait » sur le bouton.
 *
 * @param {object} props mêmes propriétés que `el`, plus `onClick`
 * @param {(Node | string)[]} [children]
 * @returns {HTMLButtonElement}
 */
export function button(props = {}, children = []) {
  const { onClick, ...rest } = props;
  const element = el('button', { type: 'button', ...rest }, children);
  element.addEventListener('click', (event) => {
    onClick?.(event);
    // `detail` vaut 0 pour une activation au clavier : on conserve alors le focus (accessibilité).
    if (event.detail > 0) element.blur();
  });
  return /** @type {HTMLButtonElement} */ (element);
}

/** Rejoue une animation CSS déclenchée par une classe (ex : petit « pop » d'un compteur). */
export function restartAnimation(element, className) {
  element.classList.remove(className);
  // Lecture d'une propriété de mise en page : force le navigateur à prendre en compte le retrait.
  void element.offsetWidth;
  element.classList.add(className);
}
