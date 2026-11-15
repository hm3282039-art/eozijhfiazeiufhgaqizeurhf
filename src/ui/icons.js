/**
 * Icônes vectorielles de l'interface (SVG en ligne : nettes à toutes les tailles,
 * identiques sur tous les systèmes — contrairement aux émojis).
 */

const COIN = `
<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <circle cx="32" cy="35" r="26" fill="#b8730a"/>
  <circle cx="32" cy="31" r="26" fill="#ffcc2e" stroke="#8a5200" stroke-width="3"/>
  <path d="M8.2 26a24.5 24.5 0 0 1 47.6 0a40 40 0 0 0-47.6 0z" fill="#ffe873"/>
  <circle cx="32" cy="31" r="17.5" fill="none" stroke="#e79a12" stroke-width="3.5"/>
  <path d="M32 20.5l3.3 6.8 7.4 1-5.4 5.2 1.3 7.4-6.6-3.5-6.6 3.5 1.3-7.4-5.4-5.2 7.4-1z" fill="#e79a12"/>
  <ellipse cx="21.5" cy="18.5" rx="7" ry="3.6" transform="rotate(-38 21.5 18.5)" fill="#ffffff" opacity="0.85"/>
</svg>`;

const DIAMOND = `
<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <path d="M19 10h26l14 16-27 31L5 26z" fill="#1565d8"/>
  <path d="M19 8h26l14 16-27 31L5 24z" fill="#35b8ff" stroke="#0b3f96" stroke-width="3" stroke-linejoin="round"/>
  <path d="M19 8l5.5 16H5z" fill="#8fe0ff"/>
  <path d="M45 8l-5.5 16H59z" fill="#1f8ef0"/>
  <path d="M19 8h26l-5.5 16h-15z" fill="#c4f1ff"/>
  <path d="M24.5 24h15L32 55z" fill="#5fcbff"/>
  <path d="M39.5 24H59L32 55z" fill="#1a78e4"/>
  <path d="M19 8h26l14 16-27 31L5 24z" fill="none" stroke="#0b3f96" stroke-width="3" stroke-linejoin="round"/>
  <path d="M14 20l5-6" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.9"/>
</svg>`;

const CLOSE = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#1d2140" stroke-width="7.5" stroke-linecap="round"/>
  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/>
</svg>`;

const CHEVRON = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M6 9.5l6 6 6-6" fill="none" stroke="#1d2140" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 9.5l6 6 6-6" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ICONS = Object.freeze({ coin: COIN, diamond: DIAMOND, close: CLOSE, chevron: CHEVRON });

/**
 * @param {keyof typeof ICONS} name
 * @param {string} [className]
 * @returns {HTMLSpanElement} conteneur de l'icône
 */
export function createIcon(name, className = '') {
  const wrapper = document.createElement('span');
  wrapper.className = `icon icon--${name} ${className}`.trim();
  wrapper.innerHTML = ICONS[name];
  return wrapper;
}
