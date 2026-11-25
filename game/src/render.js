// render.js — all canvas drawing: the kitchen, order board, stations,
// ingredient bins, the plate mid-assembly, timers and overlays.

import { LAYOUT, VIEW_W, VIEW_H, binRect, stationRect } from './kitchen.js';
import { INGREDIENTS, INGREDIENT_BY_ID, STATIONS } from './recipes.js';
import { DAY_SECONDS, findMatchingOrder } from './orders.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient drawn as a tasty little icon centred on (cx, cy).
export function drawIngredientIcon(ctx, id, cx, cy, s) {
  const def = INGREDIENT_BY_ID[id];
  if (!def) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.strokeStyle = def.dark;
  if (id === 'bun') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.52, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2cf';
    for (const dx of [-0.22, 0, 0.22]) { ctx.beginPath(); ctx.ellipse(dx * s, -s * 0.18, s * 0.05, s * 0.03, 0.5, 0, 7); ctx.fill(); }
  } else if (id === 'patty') {
    ctx.fillStyle = def.color;
    roundRect(ctx, -s * 0.55, -s * 0.22, s * 1.1, s * 0.44, s * 0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = def.dark;
    for (const dx of [-0.3, 0.05, 0.32]) { ctx.beginPath(); ctx.arc(dx * s, -s * 0.02, s * 0.05, 0, 7); ctx.fill(); }
  } else if (id === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.3); ctx.lineTo(s * 0.55, -s * 0.1); ctx.lineTo(s * 0.4, s * 0.38); ctx.lineTo(-s * 0.4, s * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.08, 0, 7); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2; const r = s * (0.42 + 0.1 * Math.sin(i * 2.4)); const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.7; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, s * 0.06, s * 0.46, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3f9c34';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.18, s * 0.08, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.08, s * 0.1, 0, 7); ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.42, 0.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#d9c9a8'; ctx.stroke();
    ctx.fillStyle = '#ffb400';
    ctx.beginPath(); ctx.arc(s * 0.05, 0, s * 0.24, 0, 7); ctx.fill(); ctx.strokeStyle = '#d98e00'; ctx.stroke();
  } else if (id === 'noodles') {
    ctx.strokeStyle = def.color; ctx.lineWidth = s * 0.11; ctx.lineCap = 'round';
    for (let r = -1; r <= 1; r++) {
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const px = -s * 0.5 + (i / 12) * s; const py = r * s * 0.22 + Math.sin(i * 1.6 + r) * s * 0.09; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
  } else if (id === 'sausage') {
    ctx.save(); ctx.rotate(-0.5);
    ctx.fillStyle = def.color;
    roundRect(ctx, -s * 0.55, -s * 0.2, s * 1.1, s * 0.4, s * 0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, -s * 0.4, -s * 0.13, s * 0.5, s * 0.1, s * 0.05); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawHeader(ctx, orders) {
  ctx.fillStyle = '#7a2e1d';
  ctx.fillRect(0, 0, VIEW_W, 56);
  ctx.fillStyle = '#a34a2a';
  ctx.fillRect(0, 52, VIEW_W, 4);
  text(ctx, 'SIZZLE STALL RUSH', 20, 29, 25, '#ffe9b0');
  text(ctx, 'SCORE ' + orders.score, 560, 29, 22, '#ffffff', 'center');
  text(ctx, 'COMBO x' + Math.max(1, orders.combo), 760, 29, 20, orders.combo >= 2 ? '#ffd23e' : '#e8c9a0', 'center');
  const hearts = '♥'.repeat(Math.max(0, orders.lives)) + '♡'.repeat(Math.max(0, 3 - orders.lives));
  text(ctx, hearts, 950, 29, 24, '#ff7a6b', 'center');
  // Day timer bar
  const frac = Math.max(0, orders.dayTimeLeft / DAY_SECONDS);
  ctx.fillStyle = '#4a1d10'; roundRect(ctx, 1060, 14, 200, 28, 8); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? '#6fce62' : '#ef4b3a';
  if (frac > 0) { roundRect(ctx, 1063, 17, 194 * frac, 22, 6); ctx.fill(); }
  text(ctx, Math.ceil(orders.dayTimeLeft) + 's', 1160, 29, 16, '#ffffff', 'center');
}

export function drawOrderBoard(ctx, orders) {
  ctx.fillStyle = '#fdf3d8';
  roundRect(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 12); ctx.fill();
  ctx.strokeStyle = '#b97a26'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, 'ORDER BOARD', LAYOUT.board.x + 14, LAYOUT.board.y + 16, 15, '#7a2e1d');
  if (orders.orders.length === 0) {
    text(ctx, 'Waiting for customers...', 640, 165, 22, '#a98f5f', 'center');
  }
  orders.orders.forEach((order, i) => {
    const x = LAYOUT.orderCard.x0 + i * (LAYOUT.orderCard.w + LAYOUT.orderCard.gap);
    const y = LAYOUT.orderCard.y;
    const w = LAYOUT.orderCard.w, h = LAYOUT.orderCard.h;
    const urgent = order.timeLeft / order.lifetime < 0.3;
    ctx.fillStyle = urgent ? '#ffe3dc' : '#ffffff';
    roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = urgent ? '#ef4b3a' : '#d9c9a8'; ctx.lineWidth = 2; ctx.stroke();
    // customer face
    ctx.fillStyle = 'hsl(' + order.hue + ',65%,72%)';
    ctx.beginPath(); ctx.arc(x + 28, y + 30, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#33302a';
    ctx.beginPath(); ctx.arc(x + 22, y + 27, 2.4, 0, 7); ctx.arc(x + 34, y + 27, 2.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#33302a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + 28, y + 33, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    text(ctx, order.customer, x + 52, y + 22, 15, '#7a2e1d');
    text(ctx, order.recipe.name, x + 52, y + 44, 16, '#22201c');
    text(ctx, order.recipe.price + ' pts', x + w - 12, y + 22, 14, '#3f9c34', 'right');
    // required ingredients as icons + names
    order.recipe.items.forEach((itemId, j) => {
      const ix = x + 34 + j * 62;
      drawIngredientIcon(ctx, itemId, ix, y + 88, 34);
      text(ctx, INGREDIENT_BY_ID[itemId].name, ix, y + 118, 11, '#5a4632', 'center', 'normal');
    });
    // countdown timer bar
    const frac = Math.max(0, order.timeLeft / order.lifetime);
    ctx.fillStyle = '#e8dcc0'; roundRect(ctx, x + 10, y + h - 14, w - 20, 8, 4); ctx.fill();
    ctx.fillStyle = urgent ? '#ef4b3a' : '#f2a007';
    if (frac > 0) { roundRect(ctx, x + 10, y + h - 14, (w - 20) * frac, 8, 4); ctx.fill(); }
  });
}

export function drawKitchen(ctx, kitchen) {
  ctx.fillStyle = '#f3e2c2';
  roundRect(ctx, LAYOUT.kitchen.x, LAYOUT.kitchen.y, LAYOUT.kitchen.w, LAYOUT.kitchen.h, 12); ctx.fill();
  ctx.strokeStyle = '#b97a26'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, 'KITCHEN STATIONS — click a ready (glowing) station to plate its food', LAYOUT.kitchen.x + 14, LAYOUT.kitchen.y + 18, 15, '#7a2e1d');
  for (const stationId of Object.keys(STATIONS)) {
    const r = stationRect(stationId);
    const job = kitchen.stations[stationId];
    ctx.fillStyle = job && job.done ? '#dff5cf' : '#e9d9b8';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = job && job.done ? '#3f9c34' : '#a98f5f'; ctx.lineWidth = job && job.done ? 4 : 2; ctx.stroke();
    text(ctx, STATIONS[stationId].name, r.x + 14, r.y + 20, 16, '#7a2e1d');
    // appliance body
    ctx.fillStyle = stationId === 'pot' ? '#9db4c6' : stationId === 'board' ? '#c98f4e' : '#5a5a66';
    roundRect(ctx, r.x + 14, r.y + 34, 110, 72, 8); ctx.fill();
    if (job) {
      drawIngredientIcon(ctx, job.ingredientId, r.x + 69, r.y + 70, 52);
      const label = job.done ? 'READY! click to plate' : 'cooking...';
      text(ctx, INGREDIENT_BY_ID[job.ingredientId].name, r.x + 140, r.y + 52, 16, '#22201c');
      text(ctx, label, r.x + 140, r.y + 76, 14, job.done ? '#2e7d24' : '#8a6d3b');
      ctx.fillStyle = '#d8cba6'; roundRect(ctx, r.x + 140, r.y + 92, 200, 12, 6); ctx.fill();
      ctx.fillStyle = job.done ? '#3f9c34' : '#f2a007';
      roundRect(ctx, r.x + 140, r.y + 92, 200 * Math.min(1, job.progress), 12, 6); ctx.fill();
    } else {
      text(ctx, 'empty', r.x + 140, r.y + 70, 14, '#a98f5f', 'left', 'normal');
    }
  }
}

export function drawPlateArea(ctx, kitchen, orders) {
  const a = LAYOUT.plateArea;
  ctx.fillStyle = '#fdf3d8';
  roundRect(ctx, a.x, a.y, a.w, a.h, 12); ctx.fill();
  ctx.strokeStyle = '#b97a26'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, 'PLATING AREA', a.x + 14, a.y + 18, 15, '#7a2e1d');
  const match = kitchen.plate.length ? findMatchingOrder(orders, kitchen.plate) : null;
  if (match) text(ctx, 'Matches: ' + match.recipe.name + ' — SERVE it!', a.x + a.w - 14, a.y + 18, 14, '#2e7d24', 'right');
  // the plate
  const p = LAYOUT.plate;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r, p.r * 0.82, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = match ? '#3f9c34' : '#c9b98f'; ctx.lineWidth = match ? 5 : 3; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r * 0.72, p.r * 0.56, 0, 0, 7); ctx.strokeStyle = '#e3d9bd'; ctx.lineWidth = 2; ctx.stroke();
  if (kitchen.plate.length === 0) {
    text(ctx, 'empty plate', p.cx, p.cy, 16, '#b3a075', 'center', 'normal');
  }
  kitchen.plate.forEach((itemId, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    drawIngredientIcon(ctx, itemId, p.cx + (col - 1) * 62, p.cy - 26 + row * 48, 44);
  });
  text(ctx, kitchen.plate.length ? kitchen.plate.map((id) => INGREDIENT_BY_ID[id].name).join(' · ') : ' ', p.cx, p.cy + 108, 13, '#5a4632', 'center', 'normal');
  // buttons
  const s = LAYOUT.serveBtn;
  ctx.fillStyle = match ? '#3f9c34' : '#7fae72';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  text(ctx, 'SERVE  (Space)', s.x + s.w / 2, s.y + s.h / 2, 17, '#ffffff', 'center');
  const t = LAYOUT.trashBtn;
  ctx.fillStyle = '#b0563a';
  roundRect(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
  text(ctx, 'TRASH  (T)', t.x + t.w / 2, t.y + t.h / 2, 17, '#ffffff', 'center');
}

export function drawCounter(ctx, kitchen) {
  ctx.fillStyle = '#8a4b2a';
  roundRect(ctx, LAYOUT.counter.x, LAYOUT.counter.y, LAYOUT.counter.w, LAYOUT.counter.h, 12); ctx.fill();
  ctx.fillStyle = '#a35a33';
  ctx.fillRect(LAYOUT.counter.x, LAYOUT.counter.y, LAYOUT.counter.w, 10);
  text(ctx, 'INGREDIENT COUNTER — click a bin (or press its number)', LAYOUT.counter.x + 14, LAYOUT.counter.y + 16, 14, '#ffe9b0');
  INGREDIENTS.forEach((def, i) => {
    const r = binRect(i);
    ctx.fillStyle = '#fdf3d8';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 2; ctx.stroke();
    drawIngredientIcon(ctx, def.id, r.x + r.w / 2, r.y + 42, 52);
    text(ctx, def.name, r.x + r.w / 2, r.y + 82, 15, '#22201c', 'center');
    const sub = def.prep ? STATIONS[def.prep].name + ' ' + STATIONS[def.prep].seconds + 's' : 'ready to plate';
    text(ctx, sub, r.x + r.w / 2, r.y + 100, 11, '#8a6d3b', 'center', 'normal');
    ctx.fillStyle = '#7a2e1d';
    ctx.beginPath(); ctx.arc(r.x + 16, r.y + 16, 11, 0, 7); ctx.fill();
    text(ctx, def.key, r.x + 16, r.y + 17, 13, '#ffffff', 'center');
  });
}

export function drawFooter(ctx, kitchen) {
  ctx.fillStyle = '#4a2c17';
  roundRect(ctx, LAYOUT.footer.x, LAYOUT.footer.y, LAYOUT.footer.w, LAYOUT.footer.h, 10); ctx.fill();
  const msg = kitchen.flash > 0 ? kitchen.lastAction : 'Tip: start patties and noodles early — they take the longest!';
  text(ctx, msg, 640, LAYOUT.footer.y + 20, 17, '#ffe9b0', 'center');
  text(ctx, 'Keys 1-8 pick ingredient · click glowing station to plate · Space serve · T trash · R restart', 640, LAYOUT.footer.y + 44, 13, '#d9b98a', 'center', 'normal');
}

export function drawStartOverlay(ctx) {
  ctx.fillStyle = 'rgba(40,16,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fdf3d8';
  roundRect(ctx, 340, 210, 600, 330, 18); ctx.fill();
  text(ctx, 'SIZZLE STALL RUSH', 640, 268, 40, '#7a2e1d', 'center');
  text(ctx, 'A busy street-stall cooking game', 640, 308, 19, '#8a6d3b', 'center', 'normal');
  text(ctx, 'Read the ORDER BOARD, cook at the stations,', 640, 356, 18, '#33302a', 'center', 'normal');
  text(ctx, 'build each dish on the plate and SERVE before time runs out!', 640, 384, 18, '#33302a', 'center', 'normal');
  text(ctx, 'Orders expire and cost a heart. Chain serves for combo bonus.', 640, 420, 16, '#5a4632', 'center', 'normal');
  ctx.fillStyle = '#3f9c34'; roundRect(ctx, 490, 452, 300, 54, 12); ctx.fill();
  text(ctx, 'CLICK OR PRESS ENTER TO OPEN', 640, 480, 17, '#ffffff', 'center');
}

export function drawGameOverOverlay(ctx, orders) {
  ctx.fillStyle = 'rgba(40,16,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fdf3d8';
  roundRect(ctx, 340, 200, 600, 360, 18); ctx.fill();
  text(ctx, 'DAY OVER!', 640, 258, 40, '#7a2e1d', 'center');
  text(ctx, 'Final score: ' + orders.score, 640, 316, 30, '#22201c', 'center');
  text(ctx, 'Dishes served: ' + orders.served + '    Orders missed: ' + orders.missed, 640, 362, 19, '#5a4632', 'center', 'normal');
  text(ctx, 'Best combo: x' + Math.max(1, orders.bestCombo), 640, 396, 19, '#5a4632', 'center', 'normal');
  text(ctx, orders.score >= 1500 ? 'A legendary stall keeper!' : orders.score >= 800 ? 'The stall is famous on this street!' : 'A good first day at the stall.', 640, 438, 17, '#3f9c34', 'center');
  ctx.fillStyle = '#3f9c34'; roundRect(ctx, 490, 472, 300, 54, 12); ctx.fill();
  text(ctx, 'CLICK OR PRESS R TO PLAY AGAIN', 640, 500, 16, '#ffffff', 'center');
}

export function renderGame(ctx, game) {
  ctx.fillStyle = '#f7e7c8';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // awning stripes
  for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#c94f30' : '#fdf3d8'; ctx.fillRect(i * 80, 56, 80, 10); }
  drawHeader(ctx, game.orders);
  drawOrderBoard(ctx, game.orders);
  drawKitchen(ctx, game.kitchen);
  drawPlateArea(ctx, game.kitchen, game.orders);
  drawCounter(ctx, game.kitchen);
  drawFooter(ctx, game.kitchen);
  if (game.mode === 'start') drawStartOverlay(ctx);
  if (game.mode === 'over') drawGameOverOverlay(ctx, game.orders);
}
