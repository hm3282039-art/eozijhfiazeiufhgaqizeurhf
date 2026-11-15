import { Game } from './Game.js';
import { LoadingScreen } from './ui/LoadingScreen.js';

/** Délai maximal accordé au chargement de la police avant de démarrer quand même. */
const FONT_TIMEOUT_MS = 2500;

/**
 * Attend la police « Fredoka » : le panneau de la porte et les étiquettes des pets sont
 * dessinés sur <canvas>, il faut donc qu'elle soit disponible AVANT de construire le monde.
 */
async function loadFonts() {
  const timeout = new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS));
  try {
    await Promise.race([document.fonts.load('700 48px "Fredoka"'), timeout]);
  } catch {
    // Police indisponible : les polices de secours du système seront utilisées.
  }
}

async function main() {
  const loading = new LoadingScreen(document.getElementById('loading-screen'));

  try {
    await loadFonts();

    const game = new Game({
      canvas: document.getElementById('game-canvas'),
      hudRoot: document.getElementById('hud'),
    });
    await game.init();
    game.start();

    // Poignée de débogage : tape `game` dans la console du navigateur pour explorer le jeu.
    window.game = game;
    loading.hide();
  } catch (error) {
    loading.showError(
      'Impossible de démarrer le jeu.',
      'Vérifie que ton navigateur prend en charge WebGL 2, puis recharge la page.',
    );
    throw error;
  }
}

main();
