import { createLayer } from '../layers/layerManager';

const STORAGE_KEY = 'synesthesia-scenes-v1';

function deep(v) { return JSON.parse(JSON.stringify(v)); }

export function makeScene(name, state) { return { name, state: deep(state) }; }

export function getDemoScenes() {
  const l1 = createLayer('pulseRing');
  const l2 = createLayer('stripesChecker');
  const l3 = createLayer('noiseWarp');

  return [
    makeScene('Neon Rings', {
      bpm: 122,
      layers: [l1],
      postFX: { vignette: 0.4, grain: 0.03, aberration: 0.004, brightness: 1.05, contrast: 1.1, saturation: 1.15, bloom: 0.55 },
      modulators: [], mappings: []
    }),
    makeScene('Kaleido Stripes', {
      bpm: 108,
      layers: [{ ...l2, blendMode: 'screen' }, { ...l3, opacity: 0.6, blendMode: 'overlay' }],
      postFX: { vignette: 0.25, grain: 0.05, aberration: 0.007, brightness: 1.02, contrast: 1.2, saturation: 1.25, bloom: 0.45 },
      modulators: [], mappings: []
    }),
    makeScene('Soft Shapes', {
      bpm: 92,
      layers: [createLayer('sdfCircle'), createLayer('sdfRoundedBox'), createLayer('sdfStar')],
      postFX: { vignette: 0.2, grain: 0.02, aberration: 0.002, brightness: 1, contrast: 1.03, saturation: 0.9, bloom: 0.28 },
      modulators: [], mappings: []
    }),
    makeScene('Noise Bloom', {
      bpm: 132,
      layers: [createLayer('noiseWarp'), createLayer('rays')],
      postFX: { vignette: 0.45, grain: 0.08, aberration: 0.006, brightness: 1.12, contrast: 1.15, saturation: 1.1, bloom: 0.85 },
      modulators: [], mappings: []
    }),
    makeScene('Audio Pulse', {
      bpm: 120,
      layers: [createLayer('pulseRing'), createLayer('rays')],
      postFX: { vignette: 0.35, grain: 0.04, aberration: 0.005, brightness: 1, contrast: 1.1, saturation: 1.05, bloom: 0.5 },
      modulators: [{ id: 'mod_audio_demo', type: 'audio', params: { gain: 1, threshold: 0.35, cooldown: 0.25 }, output: 0, bands: { low: 0, mid: 0, high: 0, beat: 0 } }],
      mappings: []
    })
  ];
}

export class SceneStore {
  constructor() {
    this.scenes = getDemoScenes();
  }

  save(name, state) {
    const idx = this.scenes.findIndex((s) => s.name === name);
    const next = makeScene(name, state);
    if (idx >= 0) this.scenes[idx] = next;
    else this.scenes.push(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scenes));
  }

  loadLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try { this.scenes = JSON.parse(raw); } catch { /* noop */ }
  }

  exportJSON() { return JSON.stringify(this.scenes, null, 2); }
  importJSON(text) { this.scenes = JSON.parse(text); localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scenes)); }
}

export function lerpSceneState(from, to, t) {
  const out = deep(from);
  out.bpm = from.bpm + (to.bpm - from.bpm) * t;
  out.postFX = Object.fromEntries(Object.keys(from.postFX).map((k) => [k, from.postFX[k] + (to.postFX[k] - from.postFX[k]) * t]));
  out.layers = from.layers.map((l, i) => {
    const r = to.layers[i] || l;
    const params = { ...l.params };
    Object.keys(params).forEach((key) => {
      if (typeof params[key] === 'number' && typeof r.params?.[key] === 'number') params[key] = params[key] + (r.params[key] - params[key]) * t;
    });
    return { ...l, opacity: l.opacity + ((r.opacity ?? l.opacity) - l.opacity) * t, params, baseParams: params };
  });
  return out;
}
