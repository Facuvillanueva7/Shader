export function createEnvelope(id) {
  return {
    id,
    type: 'envelope',
    params: { attack: 0.05, decay: 0.2, sustain: 0.55, release: 0.5 },
    gate: false,
    state: 'idle',
    level: 0,
    output: 0
  };
}

export function triggerEnvelope(mod, on) {
  mod.gate = on;
  if (on) mod.state = 'attack';
  else if (mod.state !== 'idle') mod.state = 'release';
}

export function evalEnvelope(mod, dt) {
  const p = mod.params;
  if (mod.state === 'attack') {
    mod.level += dt / Math.max(0.001, p.attack);
    if (mod.level >= 1) { mod.level = 1; mod.state = 'decay'; }
  } else if (mod.state === 'decay') {
    mod.level -= dt * (1 - p.sustain) / Math.max(0.001, p.decay);
    if (mod.level <= p.sustain) { mod.level = p.sustain; mod.state = mod.gate ? 'sustain' : 'release'; }
  } else if (mod.state === 'sustain') {
    mod.level = p.sustain;
    if (!mod.gate) mod.state = 'release';
  } else if (mod.state === 'release') {
    mod.level -= dt * p.sustain / Math.max(0.001, p.release);
    if (mod.level <= 0) { mod.level = 0; mod.state = 'idle'; }
  }
  mod.output = Math.min(1, Math.max(0, mod.level));
  return mod.output;
}
