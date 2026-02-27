import { AudioAnalyser, createAudioMod, evalAudio } from './audio';
import { createEnvelope, evalEnvelope, triggerEnvelope } from './envelope';
import { createLFO, evalLFO } from './lfo';

export class ModulatorManager {
  constructor() {
    this.modulators = [createLFO('mod_lfo_1')];
    this.audioAnalyser = new AudioAnalyser();
  }

  add(type) {
    const id = `mod_${type}_${Math.random().toString(36).slice(2, 7)}`;
    if (type === 'envelope') this.modulators.push(createEnvelope(id));
    else if (type === 'audio') this.modulators.push(createAudioMod(id));
    else this.modulators.push(createLFO(id));
  }

  getById(id) { return this.modulators.find((m) => m.id === id); }

  async enableAudio() {
    await this.audioAnalyser.enable();
    this.modulators.filter((m) => m.type === 'audio').forEach((m) => { m.enabled = true; });
  }

  triggerEnvelope(on) { this.modulators.filter((m) => m.type === 'envelope').forEach((m) => triggerEnvelope(m, on)); }

  update(time, dt) {
    const bands = this.audioAnalyser.sample();
    for (const mod of this.modulators) {
      if (mod.type === 'lfo') evalLFO(mod, time);
      if (mod.type === 'envelope') evalEnvelope(mod, dt);
      if (mod.type === 'audio') evalAudio(mod, bands, dt);
    }
  }

  toJSON() { return JSON.parse(JSON.stringify(this.modulators)); }
  loadFromJSON(mods) { this.modulators = mods; }
}
