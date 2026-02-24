import { generatorMap } from '../generators';

let idCount = 1;
const nextId = () => `layer_${idCount++}`;

export function createLayer(generatorId = 'pulseRing') {
  const generator = generatorMap[generatorId];
  return {
    id: nextId(),
    name: `${generator.name} ${idCount - 1}`,
    generatorId,
    params: { ...generator.defaultParams },
    baseParams: { ...generator.defaultParams },
    visible: true,
    blendMode: 'screen',
    opacity: 1
  };
}

export class LayerManager {
  constructor() {
    this.layers = [createLayer('pulseRing')];
  }
  addLayer(generatorId) { this.layers.push(createLayer(generatorId)); return this.layers.at(-1); }
  removeLayer(id) { this.layers = this.layers.filter((l) => l.id !== id); }
  duplicateLayer(id) {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return;
    const copy = { ...layer, id: nextId(), name: `${layer.name} Copy`, params: { ...layer.params }, baseParams: { ...layer.baseParams } };
    this.layers.splice(this.layers.indexOf(layer) + 1, 0, copy);
  }
  moveLayer(id, dir) {
    const i = this.layers.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= this.layers.length) return;
    [this.layers[i], this.layers[j]] = [this.layers[j], this.layers[i]];
  }
  setGenerator(id, generatorId) {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return;
    const generator = generatorMap[generatorId];
    layer.generatorId = generatorId;
    layer.params = { ...generator.defaultParams };
    layer.baseParams = { ...generator.defaultParams };
    layer.name = `${generator.name} ${id.split('_')[1]}`;
  }
  toJSON() { return this.layers.map((l) => ({ ...l, params: { ...l.baseParams } })); }
  loadFromJSON(layers) {
    this.layers = layers.map((l) => ({ ...l, params: { ...l.params }, baseParams: { ...l.params } }));
  }
}
