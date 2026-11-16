import { CURRENCIES } from '../../economy/Wallet.js';
import { formatNumber } from '../../utils/format.js';
import { Modal } from '../components/Modal.js';
import { button, el } from '../dom.js';

/**
 * Panneau « Téléportation » : la liste des zones.
 * Les zones débloquées se téléportent ; les zones verrouillées proposent un
 * bouton « Débloquer » (actif quand le joueur a de quoi payer le prix).
 * `refresh()` reconstruit la liste à chaque changement (solde / déblocage).
 */
export class TeleportPanel extends Modal {
  #zones;
  #onTeleport;
  #onUnlock;
  #canUnlock;

  /**
   * @param {{
   *   zones: readonly object[],
   *   onTeleport: (zone: object) => void,
   *   onUnlock: (zone: object) => void,
   *   canUnlock: (zone: object) => boolean,
   * }} options
   */
  constructor({ zones, onTeleport, onUnlock, canUnlock }) {
    super({ title: 'Téléportation', emoji: '🚀', variant: 'teleport' });
    this.#zones = zones;
    this.#onTeleport = onTeleport;
    this.#onUnlock = onUnlock;
    this.#canUnlock = canUnlock;

    this.#render();
  }

  /** Reconstruit la liste des zones (appelé après un déblocage ou un changement de solde). */
  refresh() {
    this.#render();
  }

  #render() {
    const action = (zone) => {
      if (zone.unlocked) {
        return [
          button(
            {
              class: 'go-btn',
              onClick: () => {
                this.close();
                this.#onTeleport(zone);
              },
            },
            ['Y aller !'],
          ),
        ];
      }

      // Zone verrouillée : cadenas + prix (information) + bouton « Débloquer »
      // (actif quand le joueur a de quoi payer).
      const price = `${formatNumber(zone.price.amount)} ${CURRENCIES[zone.price.currency].shortLabel}`;
      const affordable = this.#canUnlock ? this.#canUnlock(zone) : true;
      return [
        el('span', { class: 'zone-item__lock', text: `🔒 ${price}` }),
        button(
          {
            class: `go-btn${affordable ? '' : ' is-disabled'}`,
            disabled: !affordable,
            onClick: () => {
              if (!affordable) return;
              this.#onUnlock(zone);
            },
          },
          ['🔓 Débloquer'],
        ),
      ];
    };

    this.body.replaceChildren(
      el(
        'ul',
        { class: 'zone-list' },
        this.#zones.map((zone) =>
          el('li', { class: `zone-item${zone.unlocked ? '' : ' is-locked'}` }, [
            el('span', { class: 'zone-item__index', text: String(zone.index) }),
            el('div', { class: 'zone-item__info' }, [
              el('span', { class: 'zone-item__name', text: zone.unlocked ? `${zone.emoji} ${zone.name}` : zone.name }),
              el('span', { class: 'zone-item__description', text: zone.description }),
            ]),
            ...action(zone),
          ]),
        ),
      ),
    );
  }
}
