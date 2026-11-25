// kitchen.js — kitchen state: the plate being assembled, the cooking
// stations, the shared screen layout, and the rules for moving an
// ingredient from a bin, through its station, onto the plate.

import { INGREDIENTS, INGREDIENT_BY_ID, STATIONS } from './recipes.js';
import { sfxPickup, sfxChop, sfxSizzle, sfxReady } from './audio.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Screen layout shared by render.js (drawing) and input.js (hit testing).
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 16, y: 68, w: 1248, h: 168 },
  orderCard: { w: 296, h: 148, gap: 16, x0: 24, y: 78 },
  kitchen: { x: 16, y: 248, w: 800, h: 300 },
  station: { w: 182, h: 118, gap: 14, x0: 32, y0: 284 },
  plateArea: { x: 832, y: 248, w: 432, h: 300 },
  plate: { cx: 1048, cy: 364, r: 98 },
  serveBtn: { x: 856, y: 490, w: 176, h: 44 },
  trashBtn: { x: 1048, y: 490, w: 176, h: 44 },
  counter: { x: 16, y: 560, w: 1248, h: 150 },
  bin: { w: 140, h: 118, gap: 12, x0: 32, y: 592 },
  footer: { x: 16, y: 722, w: 1248, h: 62 },
};

export function stationRect(stationId) {
  const ids = Object.keys(STATIONS);
  const idx = ids.indexOf(stationId);
  const perRow = 2;
  const col = idx % perRow;
  const row = Math.floor(idx / perRow);
  return {
    x: LAYOUT.station.x0 + col * (LAYOUT.station.w + LAYOUT.station.gap + 190),
    y: LAYOUT.station.y0 + row * (LAYOUT.station.h + 12),
    w: LAYOUT.station.w + 190,
    h: LAYOUT.station.h,
    id: stationId,
  };
}

export function binRect(index) {
  return {
    x: LAYOUT.bin.x0 + index * (LAYOUT.bin.w + LAYOUT.bin.gap),
    y: LAYOUT.bin.y,
    w: LAYOUT.bin.w,
    h: LAYOUT.bin.h,
  };
}

export function createKitchenState() {
  return {
    plate: [],            // ingredient ids on the plate, in stacking order
    stations: {},         // stationId -> { ingredientId, progress, done } | null
    lastAction: 'Pick an ingredient to start cooking!',
    flash: 0,             // brief highlight timer for feedback text
  };
}

export function resetKitchen(state) {
  state.plate = [];
  state.stations = {};
  state.lastAction = 'Pick an ingredient to start cooking!';
  state.flash = 0;
}

// The player clicked an ingredient bin (or pressed its number key).
// Raw ingredients land straight on the plate; the rest start cooking.
export function pickIngredient(state, ingredientId) {
  const def = INGREDIENT_BY_ID[ingredientId];
  if (!def) return false;
  if (!def.prep) {
    state.plate.push(ingredientId);
    state.lastAction = def.name + ' added to the plate';
    state.flash = 0.6;
    sfxPickup();
    return true;
  }
  const stationId = def.prep;
  if (state.stations[stationId]) {
    state.lastAction = STATIONS[stationId].name + ' is busy!';
    state.flash = 0.6;
    return false;
  }
  state.stations[stationId] = { ingredientId, progress: 0, done: false };
  state.lastAction = def.name + ' is on the ' + STATIONS[stationId].name.toLowerCase() + '...';
  state.flash = 0.6;
  if (stationId === 'board') sfxChop(); else sfxSizzle();
  return true;
}

// The player clicked a station: collect the food once it is ready.
export function collectFromStation(state, stationId) {
  const job = state.stations[stationId];
  if (!job) return false;
  if (!job.done) {
    state.lastAction = 'Still cooking... wait for the green glow';
    state.flash = 0.6;
    return false;
  }
  state.plate.push(job.ingredientId);
  state.stations[stationId] = null;
  state.lastAction = INGREDIENT_BY_ID[job.ingredientId].name + ' plated!';
  state.flash = 0.6;
  sfxPickup();
  return true;
}

export function clearPlate(state) {
  if (state.plate.length === 0) return;
  state.plate = [];
  state.lastAction = 'Plate cleared';
  state.flash = 0.6;
}

// Advance every station timer; returns ids of stations that just finished.
export function updateKitchen(state, dt) {
  const finished = [];
  for (const [stationId, job] of Object.entries(state.stations)) {
    if (!job || job.done) continue;
    job.progress += dt / STATIONS[stationId].seconds;
    if (job.progress >= 1) {
      job.progress = 1;
      job.done = true;
      finished.push(stationId);
      sfxReady();
    }
  }
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  return finished;
}

export function ingredientIndexByKey(key) {
  return INGREDIENTS.findIndex((i) => i.key === key);
}
