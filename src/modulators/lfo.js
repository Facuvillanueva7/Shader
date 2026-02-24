export function createLFO(id) {
  return {
    id,
    type: 'lfo',
    params: { waveform: 'sine', rateHz: 0.4, depth: 1, offset: 0, phase: 0 },
    output: 0
  };
}

export function evalLFO(mod, t) {
  const x = t * mod.params.rateHz + mod.params.phase;
  const p = x - Math.floor(x);
  let w = 0;
  switch (mod.params.waveform) {
    case 'triangle': w = 1 - Math.abs(2 * p - 1); break;
    case 'saw': w = p; break;
    case 'square': w = p < 0.5 ? 0 : 1; break;
    default: w = 0.5 + 0.5 * Math.sin(x * Math.PI * 2);
  }
  mod.output = Math.min(1, Math.max(0, mod.params.offset + w * mod.params.depth));
  return mod.output;
}
