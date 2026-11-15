import { ZONES } from '../config/zones.js';
import { EVENTS } from '../core/EventBus.js';
import { CURRENCIES } from '../economy/Wallet.js';
import { formatNumber } from '../utils/format.js';
import { ActionBar } from './components/ActionBar.js';
import { CurrencyBar } from './components/CurrencyBar.js';
import { HelpBox } from './components/HelpBox.js';
import { ToastManager } from './components/ToastManager.js';
import { ZoneBanner } from './components/ZoneBanner.js';
import { PetsPanel } from './panels/PetsPanel.js';
import { ShopPanel } from './panels/ShopPanel.js';
import { TeleportPanel } from './panels/TeleportPanel.js';

/**
 * Interface du jeu (style PS99) :
 *   à gauche   compteurs de monnaie
 *   en bas     barre de boutons (Pets, Boutique, Téléportation)
 *   en haut    bandeau de zone, notifications, boîte d'aide + boutons de test
 *
 * Le HUD ne contient aucune règle de jeu : il affiche l'état (via le bus d'événements)
 * et transmet les clics aux `actions` fournies par le jeu.
 */
export class HUD {
  #toasts = new ToastManager();
  #currencyBar = new CurrencyBar();
  #panels;

  /**
   * @param {{
   *   root: HTMLElement,
   *   events: import('../core/EventBus.js').EventBus,
   *   wallet: import('../economy/Wallet.js').Wallet,
   *   pets: import('../pets/PetManager.js').PetManager,
   *   shop: import('../economy/Shop.js').Shop,
   *   actions: {
   *     teleportTo: (zone: object) => void,
   *     cycleAnimation: () => void,
   *     addTestPet: () => void,
   *     removeTestPet: () => void,
   *   },
   * }} dependencies
   */
  constructor({ root, events, wallet, pets, shop, actions }) {
    const petsPanel = new PetsPanel();
    const shopPanel = new ShopPanel({ shop, onBuy: (egg) => this.#buyEgg(shop, egg) });
    const teleportPanel = new TeleportPanel({ zones: ZONES, onTeleport: actions.teleportTo });
    this.#panels = [petsPanel, shopPanel, teleportPanel];

    const actionBar = new ActionBar({
      onPets: () => this.#togglePanel(petsPanel),
      onShop: () => this.#togglePanel(shopPanel),
      onTeleport: () => this.#togglePanel(teleportPanel),
    });

    const helpBox = new HelpBox({
      onCycleAnimation: actions.cycleAnimation,
      onAddTestPet: actions.addTestPet,
      onRemoveTestPet: actions.removeTestPet,
    });

    const zoneBanner = new ZoneBanner(ZONES[0]);

    // L'ordre fixe l'empilement : les notifications passent au-dessus du reste du HUD,
    // les panneaux au-dessus de tout.
    root.replaceChildren(
      this.#currencyBar.element,
      zoneBanner.element,
      helpBox.element,
      actionBar.element,
      this.#toasts.element,
      ...this.#panels.map((panel) => panel.element),
    );

    // ── État initial ────────────────────────────────────────────────────────
    this.#currencyBar.setValue('coins', wallet.coins, { animate: false });
    this.#currencyBar.setValue('diamonds', wallet.diamonds, { animate: false });
    helpBox.setAnimationName(pets.animationStyle.label);

    const showPets = ({ pets: list, count, max }) => {
      // Tous les pets possédés sont équipés : « (équipés/possédés) ».
      actionBar.setPetCount(count, count);
      petsPanel.setPets({ pets: list, max });
      helpBox.setCanRemoveTestPet(list.some((pet) => pet.isTest));
    };
    showPets({ pets: pets.pets, count: pets.count, max: pets.maxCount });

    // ── Réactions aux événements du jeu ─────────────────────────────────────
    events.on(EVENTS.PETS_CHANGED, showPets);

    events.on(EVENTS.WALLET_CHANGED, ({ currency, balance }) => {
      this.#currencyBar.setValue(currency, balance);
      shopPanel.refresh();
    });

    events.on(EVENTS.PET_ANIMATION_CHANGED, (style) => helpBox.setAnimationName(style.label));

    events.on(EVENTS.GATE_BLOCKED, ({ price }) => {
      this.#toasts.show(`Zone 2 verrouillée : il faut ${formatNumber(price)} pièces !`, {
        variant: 'warning',
        icon: '🔒',
        key: 'gate-blocked',
        cooldown: 3200,
      });
    });

    events.on(EVENTS.TOAST, ({ message, ...options }) => this.#toasts.show(message, options));

    // Échap ferme le panneau ouvert, où que soit le focus clavier.
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closePanels();
    });
  }

  closePanels() {
    for (const panel of this.#panels) panel.close();
  }

  #togglePanel(panel) {
    const wasOpen = panel.isOpen;
    this.closePanels();
    if (!wasOpen) panel.open();
  }

  async #buyEgg(shop, egg) {
    const result = await shop.buyEgg(egg.id);

    if (result.ok) {
      this.#toasts.show(`${egg.name} : ${result.pet.name} rejoint ton équipe !`, { variant: 'success', icon: '🥚' });
    } else if (result.reason === 'team-full') {
      this.#toasts.show('Ton équipe de pets est complète !', { variant: 'warning', icon: '🐾' });
    } else if (result.reason === 'not-enough') {
      const label = CURRENCIES[result.currency].shortLabel;
      this.#toasts.show(`Il te manque ${formatNumber(result.missing)} ${label}.`, { variant: 'warning', icon: '💸' });
    }
  }
}
