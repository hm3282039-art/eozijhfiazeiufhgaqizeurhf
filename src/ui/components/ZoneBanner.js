import { el } from '../dom.js';

/** Bandeau (en haut au centre) indiquant la zone dans laquelle se trouve le joueur. */
export class ZoneBanner {
  #name;

  /** @param {{ index: number, name: string }} zone */
  constructor(zone) {
    this.#name = el('span', { class: 'zone-banner__name' });
    this.element = el('div', { class: 'zone-banner', role: 'status' }, [
      el('span', { class: 'zone-banner__emoji', text: '🏝️', 'aria-hidden': 'true' }),
      this.#name,
    ]);
    this.setZone(zone);
  }

  /** @param {{ index: number, name: string }} zone */
  setZone({ index, name }) {
    this.#name.textContent = `Zone ${index} — ${name}`;
  }
}
