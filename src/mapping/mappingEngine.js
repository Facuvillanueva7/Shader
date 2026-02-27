function applyCurve(v, curve) {
  if (curve === 'expo') return v * v;
  return v;
}

export class MappingEngine {
  constructor() {
    this.mappings = [];
  }

  add(mapping) {
    this.mappings.push({ amount: 1, min: 0, max: 1, curve: 'linear', ...mapping });
  }

  remove(index) { this.mappings.splice(index, 1); }

  apply(layerManager, modManager) {
    layerManager.layers.forEach((layer) => {
      layer.params = { ...layer.baseParams };
    });

    for (const map of this.mappings) {
      const mod = modManager.getById(map.modId);
      if (!mod) continue;
      const [layerToken, paramKey] = map.target.split('.');
      const layerId = layerToken.replace('layer:', '');
      const layer = layerManager.layers.find((l) => l.id === layerId);
      if (!layer || typeof layer.params[paramKey] !== 'number') continue;

      const modBase = map.sourceBand ? mod.bands?.[map.sourceBand] ?? 0 : mod.output;
      const curved = applyCurve(Math.min(1, Math.max(0, modBase)), map.curve);
      const ranged = map.min + (map.max - map.min) * curved;
      layer.params[paramKey] = layer.baseParams[paramKey] + ranged * map.amount;
    }
  }

  toJSON() { return JSON.parse(JSON.stringify(this.mappings)); }
  loadFromJSON(maps) { this.mappings = maps || []; }
}
