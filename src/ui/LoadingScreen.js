/**
 * Écran de chargement (présent dans index.html : il s'affiche avant même le JavaScript).
 */
export class LoadingScreen {
  #element;

  /** @param {HTMLElement} element */
  constructor(element) {
    this.#element = element;
  }

  /** Fait disparaître l'écran en fondu, puis le retire de la page. */
  hide() {
    const element = this.#element;
    element.classList.add('is-hidden');
    element.addEventListener('transitionend', () => element.remove(), { once: true });
    // Filet de sécurité si la transition CSS ne se déclenche pas (onglet en arrière-plan…).
    setTimeout(() => element.remove(), 1200);
  }

  /** Remplace l'animation de chargement par un message d'erreur. */
  showError(title, details = '') {
    this.#element.classList.add('has-error');
    this.#element.querySelector('[data-loading-status]').textContent = title;
    this.#element.querySelector('[data-loading-details]').textContent = details;
  }
}
