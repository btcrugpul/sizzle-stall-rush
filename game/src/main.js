// main.js — boots Sizzle Stall Rush, runs the game loop, wires input to
// the kitchen and order board, and provides deterministic screenshot
// scenes (?scene=start|rush|serve|over) that compose one fixed frame.

import { createKitchenState, resetKitchen, pickIngredient, collectFromStation, clearPlate, updateKitchen } from './kitchen.js';
import { createOrderState, spawnOrder, servePlate, updateOrders } from './orders.js';
import { renderGame } from './render.js';
import { attachInput } from './input.js';
import { recipeById } from './recipes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// Small deterministic RNG (mulberry32) so screenshot scenes are stable.
export function makeSeededRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(seed) {
  return {
    kitchen: createKitchenState(),
    orders: createOrderState(makeSeededRng(seed)),
    mode: 'start', // start | play | over
  };
}

const game = createGame(20261125);

function startDay() {
  resetKitchen(game.kitchen);
  const fresh = createOrderState(game.orders.rng);
  game.orders = fresh;
  fresh.started = true;
  game.mode = 'play';
  spawnOrder(game.orders);
  spawnOrder(game.orders);
  announce('Day started. First orders are on the board!');
}

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

const handlers = {
  onAnyPress() {
    if (game.mode === 'start') { startDay(); return true; }
    if (game.mode === 'over') { startDay(); return true; }
    return false;
  },
  isOverlayUp() { return game.mode !== 'play'; },
  onRestartKey() { if (game.mode !== 'start') startDay(); },
  onPickIngredient(id) { if (game.mode === 'play') pickIngredient(game.kitchen, id); },
  onCollectStation(id) { if (game.mode === 'play') collectFromStation(game.kitchen, id); },
  onServe() { if (game.mode === 'play') servePlate(game.orders, game.kitchen); },
  onTrash() { if (game.mode === 'play') clearPlate(game.kitchen); },
};

attachInput(canvas, handlers);

// --- Deterministic screenshot scenes -------------------------------------
// Each scene builds a composed, representative frame with fixed values so
// a still capture shows the whole game at once, without waiting on timers.
export function buildScene(name) {
  const g = createGame(7);
  g.orders.started = true;
  g.mode = 'play';
  const addOrder = (recipeId, frac) => {
    const recipe = recipeById(recipeId);
    const order = { id: g.orders.orders.length + 1, recipe, lifetime: 34, timeLeft: 34 * frac, customer: 'Guest', hue: 20 + g.orders.orders.length * 70 };
    g.orders.orders.push(order);
    return order;
  };
  if (name === 'start') {
    g.mode = 'start';
    addOrder('classic-burger', 0.9); addOrder('noodle-bowl', 0.75);
    g.orders.customersNote = '';
    g.orders.orders[0].customer = 'Maya'; g.orders.orders[1].customer = 'Rudi';
    g.kitchen.plate = ['bun'];
    g.orders.dayTimeLeft = 120; g.orders.elapsed = 0;
  } else if (name === 'serve') {
    addOrder('classic-burger', 0.62); addOrder('sausage-noodles', 0.4); addOrder('garden-burger', 0.85);
    g.orders.orders[0].customer = 'Sinta'; g.orders.orders[1].customer = 'Bima'; g.orders.orders[2].customer = 'Lala';
    g.kitchen.plate = ['bun', 'patty', 'cheese']; // a finished Classic Burger, ready to serve
    g.kitchen.stations.pot = { ingredientId: 'noodles', progress: 0.55, done: false };
    g.kitchen.stations.board = { ingredientId: 'tomato', progress: 1, done: true };
    g.kitchen.lastAction = 'Classic Burger complete — hit SERVE!';
    g.kitchen.flash = 5;
    g.orders.score = 640; g.orders.combo = 3; g.orders.served = 4;
    g.orders.elapsed = 52; g.orders.dayTimeLeft = 68;
  } else if (name === 'over') {
    g.mode = 'over';
    addOrder('double-cheese', 0.5);
    g.orders.orders[0].customer = 'Nina';
    g.orders.score = 1870; g.orders.served = 13; g.orders.missed = 3;
    g.orders.bestCombo = 6; g.orders.lives = 1; g.orders.dayTimeLeft = 0; g.orders.elapsed = 120;
    g.kitchen.plate = ['bun', 'patty'];
  } else { // 'rush' — the cover scene: full mid-rush kitchen
    addOrder('garden-burger', 0.55); addOrder('noodle-bowl', 0.8); addOrder('sunrise-burger', 0.28); addOrder('sausage-bun', 0.66);
    g.orders.orders[0].customer = 'Maya'; g.orders.orders[1].customer = 'Rudi';
    g.orders.orders[2].customer = 'Sinta'; g.orders.orders[3].customer = 'Bima';
    g.kitchen.plate = ['bun', 'patty']; // burger mid-assembly
    g.kitchen.stations.grill = { ingredientId: 'patty', progress: 0.6, done: false };
    g.kitchen.stations.pot = { ingredientId: 'noodles', progress: 1, done: true };
    g.kitchen.stations.board = { ingredientId: 'lettuce', progress: 0.45, done: false };
    g.kitchen.lastAction = 'Noodles ready! Plate them for the Noodle Bowl';
    g.kitchen.flash = 5;
    g.orders.score = 420; g.orders.combo = 2; g.orders.served = 3;
    g.orders.elapsed = 38; g.orders.dayTimeLeft = 82;
  }
  return g;
}

const params = new URLSearchParams(window.location.search);
const sceneName = params.get('scene');
if (sceneName) {
  const sceneGame = buildScene(sceneName);
  renderGame(ctx, sceneGame);
  document.title = 'Sizzle Stall Rush — ' + sceneName;
} else {
  // Normal play: orders pre-loaded behind the start overlay so the first
  // frame already shows the full kitchen, board, bins and plate.
  game.orders.started = false;
  spawnOrder(game.orders); spawnOrder(game.orders);
  game.kitchen.plate = ['bun'];
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.mode === 'play') {
      updateOrders(game.orders, dt);
      updateKitchen(game.kitchen, dt);
      if (game.orders.over) { game.mode = 'over'; announce('Day over. Score ' + game.orders.score); }
    }
    renderGame(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
