export function createAudioMod(id) {
  return {
    id,
    type: 'audio',
    params: { gain: 1, threshold: 0.33, cooldown: 0.24 },
    output: 0,
    bands: { low: 0, mid: 0, high: 0, beat: 0 },
    enabled: false,
    _cooldown: 0
  };
}

export class AudioAnalyser {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.data = null;
  }

  async enable() {
    if (this.ctx) return true;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    return true;
  }

  sample() {
    if (!this.analyser) return { low: 0, mid: 0, high: 0 };
    this.analyser.getByteFrequencyData(this.data);
    const avg = (a, b) => {
      let sum = 0;
      for (let i = a; i < b; i += 1) sum += this.data[i] || 0;
      return (sum / Math.max(1, b - a)) / 255;
    };
    const n = this.data.length;
    return { low: avg(0, Math.floor(n * 0.1)), mid: avg(Math.floor(n * 0.1), Math.floor(n * 0.35)), high: avg(Math.floor(n * 0.35), Math.floor(n * 0.8)) };
  }
}

export function evalAudio(mod, bands, dt) {
  mod.bands.low = bands.low * mod.params.gain;
  mod.bands.mid = bands.mid * mod.params.gain;
  mod.bands.high = bands.high * mod.params.gain;
  mod.output = Math.min(1, Math.max(0, (mod.bands.low + mod.bands.mid + mod.bands.high) / 3));
  mod._cooldown = Math.max(0, mod._cooldown - dt);
  const energy = mod.bands.low * 0.65 + mod.bands.mid * 0.35;
  if (energy > mod.params.threshold && mod._cooldown <= 0) {
    mod.bands.beat = 1;
    mod._cooldown = mod.params.cooldown;
  } else {
    mod.bands.beat = 0;
  }
  return mod.output;
}
