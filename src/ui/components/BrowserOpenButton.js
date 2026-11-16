import { button, el } from '../dom.js';

/**
 * Bouton « [🚀 Ouvrir dans le Navigateur (Lien Direct)] » (en haut à droite, à côté du
 * bouton Plein Écran).
 *
 * Génère dynamiquement un lien fonctionnel pour ouvrir le jeu dans un nouvel onglet
 * indépendant :
 *   1. Tentative `window.open(url, '_blank', 'noopener')` → ouvre directement le jeu.
 *   2. Si un bloqueur de pop-up empêche l'ouverture (`window.open` retourne null),
 *      le bouton bascule en mode « lien » : il affiche un lien cliquable + copier
 *      (navigateur intégré) que l'utilisateur peut ouvrir manuellement.
 *
 * Le lien « direct » est l'URL courante de la page (`window.location.href`), adaptée
 * automatiquement : c'est la seule URL qui garantit que le jeu charge correctement.
 */
export class BrowserOpenButton {
  #button;
  #link;
  #anchor;
  #mode = 'idle'; // 'idle' | 'link'
  #url;

  constructor() {
    this.#url = window.location.href;

    this.#button = button(
      {
        class: 'browser-open-button',
        title: 'Ouvrir ce jeu dans un nouvel onglet du navigateur',
        onClick: () => this.#handleClick(),
      },
      [
        el('span', { class: 'browser-open-button__icon', text: '🚀', 'aria-hidden': 'true' }),
        el('span', { class: 'browser-open-button__label', text: 'Ouvrir dans le Navigateur' }),
      ],
    );

    // Lien affiché en dessous du bouton (mode « bloqueur de pop-up ») :
    // texte explicatif + lien cliquable (target=_blank).
    this.#anchor = el('a', {
      class: 'browser-open-button__anchor',
      href: this.#url,
      target: '_blank',
      rel: 'noopener',
      text: this.#url,
      // Un clic sur le lien ne doit pas relancer la tentative d'ouverture du bouton.
      onClick: (event) => event.stopPropagation(),
    });
    this.#link = el('span', { class: 'browser-open-button__link', hidden: 'hidden' }, [
      el('span', { class: 'browser-open-button__link-label', text: 'Bloqueur de pop-up ? Copiez ce lien :' }),
      this.#anchor,
    ]);
    this.#button.append(this.#link);
  }

  get element() {
    return this.#button;
  }

  /** Ouvre le jeu dans un nouvel onglet ; si bloqué, bascule en mode lien. */
  #handleClick() {
    if (this.#openWindow()) {
      // Réinitialise le mode lien après une tentative réussie.
      this.#setMode('idle');
    } else {
      // Bloqueur de pop-up : on affiche le lien copiable/cliquable.
      this.#setMode('link');
      this.#copyToClipboard(this.#url);
    }
  }

  /** Tentative d'ouverture via `window.open` (renvoie `true` si le new tab a été créé). */
  #openWindow() {
    try {
      const win = window.open(this.#url, '_blank', 'noopener');
      // Un bloqueur peut retourner `null` sans erreur : on ne peut pas distinguer
      // immédiatement un nouvel onglet bloqué d'une ouverture réussie. On considère
      // `null` comme un blocage.
      return Boolean(win);
    } catch (error) {
      console.warn('[BrowserOpen] Ouverture refusée :', error?.message ?? error);
      return false;
    }
  }

  #setMode(mode) {
    this.#mode = mode;
    this.#link.hidden = mode !== 'link';
    this.#button.classList.toggle('is-link', mode === 'link');
    const label = this.#button.querySelector('.browser-open-button__label');
    if (label) label.textContent = mode === 'link' ? 'Lien Copié' : 'Ouvrir dans le Navigateur';
  }

  /** Copie le lien dans le presse-papiers (sans casser le rendu si refusé). */
  #copyToClipboard(text) {
    const done = () => console.info('[BrowserOpen] Lien copié :', text);
    const fail = () => console.warn('[BrowserOpen] Copie refusée (permissions) — lien cliquable affiché.');
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fail);
        return;
      }
    } catch (error) {
      fail();
      return;
    }
    // Fallback : sélection manuelle via un input temporaire.
    try {
      const input = el('input', { type: 'text', value: text, readonly: 'readonly' });
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      const ok = document.execCommand('copy');
      input.remove();
      ok ? done() : fail();
    } catch (error) {
      fail();
    }
  }
}
