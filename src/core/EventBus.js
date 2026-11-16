/**
 * Bus d'événements minimaliste (publish / subscribe).
 * Permet aux systèmes (porte-monnaie, pets, UI…) de communiquer sans se connaître.
 */
export class EventBus {
  #listeners = new Map();

  /**
   * Abonne `handler` à l'événement `type`.
   * @returns {() => void} fonction de désabonnement
   */
  on(type, handler) {
    if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());
    this.#listeners.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    this.#listeners.get(type)?.delete(handler);
  }

  emit(type, payload) {
    const handlers = this.#listeners.get(type);
    if (!handlers) return;
    // Copie : un handler peut se désabonner pendant l'émission.
    for (const handler of [...handlers]) handler(payload);
  }
}

/** Noms des événements du jeu, centralisés pour éviter les fautes de frappe. */
export const EVENTS = Object.freeze({
  WALLET_CHANGED: 'wallet:changed',
  PETS_CHANGED: 'pets:changed',
  PET_ANIMATION_CHANGED: 'pets:animation-changed',
  PLAYER_TELEPORTED: 'player:teleported',
  GATE_BLOCKED: 'gate:blocked',
  ZONE_UNLOCKED: 'zone:unlocked',
  TOAST: 'ui:toast',
});
