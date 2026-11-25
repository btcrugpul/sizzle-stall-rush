// orders.js — the order board: spawning customer orders with countdown
// timers, matching a finished plate to an order, scoring and lives.

import { RECIPES, plateMatchesRecipe } from './recipes.js';
import { sfxServe, sfxError, sfxExpire } from './audio.js';

export const MAX_ORDERS = 4;
export const DAY_SECONDS = 120;

export function createOrderState(rng) {
  return {
    orders: [],
    nextOrderIn: 0.5,
    orderSeq: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    lives: 3,
    elapsed: 0,
    dayTimeLeft: DAY_SECONDS,
    over: false,
    started: false,
    rng,
  };
}

// Difficulty ramps: orders arrive faster and live shorter as the day goes on.
export function spawnInterval(state) {
  const t = state.elapsed / DAY_SECONDS;
  return Math.max(2.6, 6.5 - t * 4.2);
}

export function orderLifetime(state) {
  const t = state.elapsed / DAY_SECONDS;
  return Math.max(22, 38 - t * 14);
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  // Later in the day, prefer bigger recipes.
  const t = state.elapsed / DAY_SECONDS;
  const pool = RECIPES.filter((r) => r.items.length <= 3 || t > 0.25 || state.rng() < 0.35);
  const recipe = pool[Math.floor(state.rng() * pool.length)] || RECIPES[0];
  const lifetime = orderLifetime(state);
  const order = {
    id: ++state.orderSeq,
    recipe,
    timeLeft: lifetime,
    lifetime,
    customer: CUSTOMER_NAMES[Math.floor(state.rng() * CUSTOMER_NAMES.length)],
    hue: Math.floor(state.rng() * 360),
  };
  state.orders.push(order);
  return order;
}

export const CUSTOMER_NAMES = ['Maya', 'Rudi', 'Sinta', 'Bima', 'Lala', 'Dedi', 'Nina', 'Agus', 'Rina', 'Tono'];

// Try to serve the current plate. Returns 'served' | 'nomatch'.
export function servePlate(state, kitchen) {
  const idx = state.orders.findIndex((o) => plateMatchesRecipe(kitchen.plate, o.recipe));
  if (idx === -1) {
    state.combo = 0;
    kitchen.lastAction = 'No order matches this plate!';
    kitchen.flash = 0.8;
    sfxError();
    return 'nomatch';
  }
  const order = state.orders[idx];
  const timeBonus = Math.round((order.timeLeft / order.lifetime) * 60);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = (state.combo - 1) * 15;
  const gained = order.recipe.price + timeBonus + comboBonus;
  state.score += gained;
  state.served += 1;
  state.orders.splice(idx, 1);
  kitchen.plate = [];
  kitchen.lastAction = 'Served ' + order.recipe.name + '! +' + gained + ' pts';
  kitchen.flash = 1.0;
  if (state.nextOrderIn > 1.2) state.nextOrderIn = 1.2;
  sfxServe();
  return 'served';
}

export function updateOrders(state, dt) {
  if (!state.started || state.over) return;
  state.elapsed += dt;
  state.dayTimeLeft = Math.max(0, DAY_SECONDS - state.elapsed);
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state);
    state.nextOrderIn = spawnInterval(state);
  }
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const order = state.orders[i];
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      state.orders.splice(i, 1);
      state.missed += 1;
      state.lives -= 1;
      state.combo = 0;
      sfxExpire();
      if (state.lives <= 0) state.over = true;
    }
  }
  if (state.dayTimeLeft <= 0) state.over = true;
}

export function findMatchingOrder(state, plateItems) {
  return state.orders.find((o) => plateMatchesRecipe(plateItems, o.recipe)) || null;
}
