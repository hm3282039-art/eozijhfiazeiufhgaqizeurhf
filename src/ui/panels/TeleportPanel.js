import { CURRENCIES } from '../../economy/Wallet.js';
import { formatNumber } from '../../utils/format.js';
import { Modal } from '../components/Modal.js';
import { button, el } from '../dom.js';

/**
 * Panneau « Téléportation » : la liste des zones. Seules les zones débloquées sont accessibles.
 */
export class TeleportPanel extends Modal {
  /**
   * @param {{
   *   zones: readonly object[],
   *   onTeleport: (zone: object) => void,
   * }} options
   */
  constructor({ zones, onTeleport }) {
    super({ title: 'Téléportation', emoji: '🚀', variant: 'teleport' });

    this.body.append(
      el(
        'ul',
        { class: 'zone-list' },
        zones.map((zone) => {
          const action = zone.unlocked
            ? button(
                {
                  class: 'go-btn',
                  onClick: () => {
                    this.close();
                    onTeleport(zone);
                  },
                },
                ['Y aller !'],
              )
            : el('span', {
                class: 'zone-item__lock',
                text: `🔒 ${formatNumber(zone.price.amount)} ${CURRENCIES[zone.price.currency].shortLabel}`,
              });

          return el('li', { class: `zone-item${zone.unlocked ? '' : ' is-locked'}` }, [
            el('span', { class: 'zone-item__index', text: String(zone.index) }),
            el('div', { class: 'zone-item__info' }, [
              el('span', { class: 'zone-item__name', text: zone.unlocked ? `${zone.emoji} ${zone.name}` : zone.name }),
              el('span', { class: 'zone-item__description', text: zone.description }),
            ]),
            action,
          ]);
        }),
      ),
    );
  }
}
