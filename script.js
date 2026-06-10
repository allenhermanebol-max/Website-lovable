import { GameApp } from "./js/game.js";

function bootGame() {
  window.eidklingeGame = new GameApp();
}

window.addEventListener("DOMContentLoaded", bootGame, { once: true });

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}
