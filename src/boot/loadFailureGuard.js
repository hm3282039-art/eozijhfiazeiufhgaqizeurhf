/**
 * Garde-fou de démarrage (script classique, exécuté avant les modules).
 *
 * Si Three.js ne peut pas être téléchargé depuis le CDN (pas de connexion, CDN bloqué…)
 * ou si la page est ouverte en file://, aucun module ne s'exécute : sans ce garde-fou,
 * l'écran de chargement resterait affiché indéfiniment. Ici, on affiche un message clair.
 */
(function () {
  'use strict';

  var isLocalFile = window.location.protocol === 'file:';

  function showFailure() {
    var screen = document.getElementById('loading-screen');
    if (!screen) return; // le jeu a déjà démarré

    screen.classList.add('has-error');
    screen.querySelector('[data-loading-status]').textContent = isLocalFile
      ? 'Le jeu doit être servi par un serveur web.'
      : 'Impossible de charger le moteur 3D.';
    screen.querySelector('[data-loading-details]').textContent = isLocalFile
      ? 'Lance « npm start » dans le dossier du projet, puis ouvre http://localhost:5173'
      : 'Three.js est téléchargé depuis un CDN : vérifie ta connexion Internet, puis recharge la page.';
  }

  // Les erreurs de chargement de ressources ne « remontent » pas : on les capte en phase de capture.
  window.addEventListener(
    'error',
    function (event) {
      var target = event.target;
      if (target instanceof HTMLScriptElement && target.type === 'module') showFailure();
    },
    true
  );

  // Les modules ES sont bloqués en file:// : inutile d'attendre une erreur pour prévenir.
  if (isLocalFile) window.addEventListener('DOMContentLoaded', showFailure);
})();
