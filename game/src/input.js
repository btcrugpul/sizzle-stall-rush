// input.js — mouse and keyboard control: clicking bins, stations and
// buttons, plus the number keys, Space to serve, T to trash, R to restart.

import { LAYOUT, binRect, stationRect } from './kitchen.js';
import { INGREDIENTS, STATIONS } from './recipes.js';
import { sfxClick } from './audio.js';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, handlers) {
  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = toGameCoords(event);
    if (handlers.onAnyPress()) return; // start / restart overlays eat the click
    for (let i = 0; i < INGREDIENTS.length; i++) {
      if (inside(x, y, binRect(i))) { handlers.onPickIngredient(INGREDIENTS[i].id); return; }
    }
    for (const stationId of Object.keys(STATIONS)) {
      if (inside(x, y, stationRect(stationId))) { handlers.onCollectStation(stationId); return; }
    }
    if (inside(x, y, LAYOUT.serveBtn)) { handlers.onServe(); return; }
    if (inside(x, y, LAYOUT.trashBtn)) { handlers.onTrash(); return; }
    sfxClick();
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter') { handlers.onAnyPress(); return; }
    if (key === 'r' || key === 'R') { handlers.onRestartKey(); return; }
    if (handlers.isOverlayUp()) return;
    if (key === ' ') { event.preventDefault(); handlers.onServe(); return; }
    if (key === 't' || key === 'T') { handlers.onTrash(); return; }
    const def = INGREDIENTS.find((i) => i.key === key);
    if (def) handlers.onPickIngredient(def.id);
  });
}
