// audio.js — tiny WebAudio bleeps generated in code; no sound files needed.

let audioContext = null;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioContext) audioContext = new AC();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

export function playTone(freq, seconds, type = 'square', volume = 0.05, when = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + when;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export function sfxPickup() { playTone(520, 0.07, 'square', 0.04); }
export function sfxChop() { playTone(180, 0.05, 'sawtooth', 0.05); playTone(140, 0.05, 'sawtooth', 0.04, 0.06); }
export function sfxSizzle() { playTone(900, 0.12, 'sawtooth', 0.02); }
export function sfxReady() { playTone(660, 0.09, 'triangle', 0.06); playTone(880, 0.12, 'triangle', 0.06, 0.09); }
export function sfxServe() { playTone(523, 0.1, 'triangle', 0.06); playTone(659, 0.1, 'triangle', 0.06, 0.1); playTone(784, 0.16, 'triangle', 0.07, 0.2); }
export function sfxError() { playTone(160, 0.18, 'sawtooth', 0.06); }
export function sfxExpire() { playTone(300, 0.15, 'square', 0.05); playTone(200, 0.22, 'square', 0.05, 0.14); }
export function sfxClick() { playTone(700, 0.04, 'square', 0.03); }
