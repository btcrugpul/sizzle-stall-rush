// recipes.js — ingredient and recipe definitions for Sizzle Stall Rush.
// Every dish is a combination of ingredients; some ingredients must be
// cooked or chopped at a station before they can go on the plate.

export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',     color: '#e8a84c', dark: '#b97a26', prep: null,    key: '1' },
  { id: 'patty',   name: 'Patty',   color: '#8a4b2a', dark: '#5f3018', prep: 'grill', key: '2' },
  { id: 'cheese',  name: 'Cheese',  color: '#ffd23e', dark: '#d9a400', prep: null,    key: '3' },
  { id: 'lettuce', name: 'Lettuce', color: '#6fce62', dark: '#3f9c34', prep: 'board', key: '4' },
  { id: 'tomato',  name: 'Tomato',  color: '#ef4b3a', dark: '#b92c1e', prep: 'board', key: '5' },
  { id: 'egg',     name: 'Egg',     color: '#fff3c4', dark: '#f2b705', prep: 'pan',   key: '6' },
  { id: 'noodles', name: 'Noodles', color: '#f7d774', dark: '#c9a227', prep: 'pot',   key: '7' },
  { id: 'sausage', name: 'Sausage', color: '#c65b39', dark: '#8f3a20', prep: 'grill', key: '8' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

export const STATIONS = {
  grill: { id: 'grill', name: 'GRILL', seconds: 3.0 },
  pan:   { id: 'pan',   name: 'FRY PAN', seconds: 2.0 },
  pot:   { id: 'pot',   name: 'NOODLE POT', seconds: 2.5 },
  board: { id: 'board', name: 'CHOP BOARD', seconds: 1.2 },
};

export const RECIPES = [
  { id: 'classic-burger', name: 'Classic Burger', items: ['bun', 'patty', 'cheese'], price: 120 },
  { id: 'garden-burger', name: 'Garden Burger', items: ['bun', 'patty', 'lettuce', 'tomato'], price: 150 },
  { id: 'double-cheese', name: 'Double Cheese Melt', items: ['bun', 'patty', 'cheese', 'cheese'], price: 170 },
  { id: 'sunrise-burger', name: 'Sunrise Burger', items: ['bun', 'patty', 'egg', 'cheese'], price: 180 },
  { id: 'noodle-bowl', name: 'Noodle Bowl', items: ['noodles', 'egg'], price: 110 },
  { id: 'sausage-noodles', name: 'Sausage Noodles', items: ['noodles', 'sausage', 'egg'], price: 160 },
  { id: 'stall-special', name: 'Stall Special', items: ['noodles', 'sausage', 'tomato', 'lettuce'], price: 190 },
  { id: 'sausage-bun', name: 'Sausage Bun', items: ['bun', 'sausage', 'lettuce'], price: 130 },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || RECIPES[0];
}

// A plate matches a recipe when it holds exactly the same multiset of items.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const counts = new Map();
  for (const item of recipe.items) counts.set(item, (counts.get(item) || 0) + 1);
  for (const item of plateItems) {
    const left = (counts.get(item) || 0) - 1;
    if (left < 0) return false;
    counts.set(item, left);
  }
  return [...counts.values()].every((v) => v === 0);
}

export function describeItems(items) {
  return items.map((id) => INGREDIENT_BY_ID[id]?.name || id).join(' + ');
}
