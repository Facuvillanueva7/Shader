import GUI from 'lil-gui';
import { generators } from '../generators';

export function createAppGUI(app) {
  const gui = new GUI({ title: 'Synesthesia MVP' });
  const folders = {
    layers: gui.addFolder('Layers'),
    modulators: gui.addFolder('Modulators'),
    mappings: gui.addFolder('Mappings'),
    scenes: gui.addFolder('Scenes'),
    post: gui.addFolder('Post FX'),
    global: gui.addFolder('Global')
  };

  const generatorOptions = Object.fromEntries(generators.map((g) => [g.name, g.id]));

  const refresh = () => {
    Object.values(folders).forEach((f) => {
      const kids = [...f.children];
      kids.forEach((c) => c.destroy());
    });

    folders.global.add(app.global, 'bpm', 40, 220, 1).name('BPM');
    folders.global.add(app, 'addLayer').name('+ Add Layer');

    app.layerManager.layers.forEach((layer) => {
      const lf = folders.layers.addFolder(layer.name);
      lf.add(layer, 'visible').name('Visible');
      lf.add(layer, 'blendMode', ['normal', 'add', 'screen', 'multiply', 'overlay']).name('Blend');
      lf.add(layer, 'opacity', 0, 1, 0.01).name('Opacity');
      lf.add(layer, 'generatorId', generatorOptions).name('Generator').onChange(() => { app.layerManager.setGenerator(layer.id, layer.generatorId); refresh(); });
      lf.add({ up: () => { app.layerManager.moveLayer(layer.id, -1); refresh(); } }, 'up').name('Move Up');
      lf.add({ down: () => { app.layerManager.moveLayer(layer.id, 1); refresh(); } }, 'down').name('Move Down');
      lf.add({ dup: () => { app.layerManager.duplicateLayer(layer.id); refresh(); } }, 'dup').name('Duplicate');
      lf.add({ del: () => { app.layerManager.removeLayer(layer.id); refresh(); } }, 'del').name('Delete');

      const gen = app.generatorMap[layer.generatorId];
      const pf = lf.addFolder('Params');
      gen.uiSchema.forEach((field) => {
        if (field.type === 'color') pf.addColor(layer.baseParams, field.key).name(field.label);
        else if (field.type === 'select') pf.add(layer.baseParams, field.key, field.options).name(field.label);
        else pf.add(layer.baseParams, field.key, field.min, field.max, field.step).name(field.label);
      });
    });

    folders.modulators.add({ lfo: () => { app.modManager.add('lfo'); refresh(); } }, 'lfo').name('+ LFO');
    folders.modulators.add({ envelope: () => { app.modManager.add('envelope'); refresh(); } }, 'envelope').name('+ Envelope');
    folders.modulators.add({ audio: () => { app.modManager.add('audio'); refresh(); } }, 'audio').name('+ Audio');
    folders.modulators.add({ enableAudio: () => app.modManager.enableAudio() }, 'enableAudio').name('Enable Mic');

    app.modManager.modulators.forEach((mod) => {
      const mf = folders.modulators.addFolder(`${mod.type}: ${mod.id}`);
      Object.entries(mod.params).forEach(([k, v]) => {
        if (typeof v === 'number') mf.add(mod.params, k, 0, k.includes('rate') ? 12 : 2, 0.01).name(k);
        else mf.add(mod.params, k, ['sine', 'triangle', 'saw', 'square']).name(k);
      });
      mf.add(mod, 'output', 0, 1, 0.001).name('Output').listen();
      if (mod.type === 'audio') {
        mf.add(mod.bands, 'low', 0, 1, 0.001).listen();
        mf.add(mod.bands, 'mid', 0, 1, 0.001).listen();
        mf.add(mod.bands, 'high', 0, 1, 0.001).listen();
        mf.add(mod.bands, 'beat', 0, 1, 1).listen();
      }
    });

    folders.mappings.add({ addMapping: () => { app.addMapping(); refresh(); } }, 'addMapping').name('+ Add Mapping');
    app.mappingEngine.mappings.forEach((map, idx) => {
      const mf = folders.mappings.addFolder(`Map ${idx + 1}`);
      mf.add(map, 'modId', app.modManager.modulators.map((m) => m.id));
      mf.add(map, 'target', app.getNumericTargets());
      mf.add(map, 'amount', -2, 2, 0.01);
      mf.add(map, 'min', -1, 1, 0.01);
      mf.add(map, 'max', -1, 1, 0.01);
      mf.add(map, 'curve', ['linear', 'expo']);
      const selectedMod = app.modManager.getById(map.modId);
      if (selectedMod?.type === 'audio') mf.add(map, 'sourceBand', ['', 'low', 'mid', 'high', 'beat']);
      mf.add({ remove: () => { app.mappingEngine.remove(idx); refresh(); } }, 'remove');
    });

    folders.scenes.add(app.sceneState, 'name').name('Scene Name');
    folders.scenes.add({ save: app.saveScene }, 'save').name('Save Scene');
    folders.scenes.add({ load: () => app.loadScene(app.sceneState.index) }, 'load').name('Load Scene');
    folders.scenes.add({ prev: app.prevScene }, 'prev').name('Prev Scene');
    folders.scenes.add({ next: app.nextScene }, 'next').name('Next Scene');
    folders.scenes.add(app.sceneState, 'transitionDuration', 0.1, 5, 0.1).name('Crossfade Sec');
    folders.scenes.add({ export: app.exportScenes }, 'export').name('Export JSON');
    folders.scenes.add({ import: app.importScenes }, 'import').name('Import JSON');

    folders.post.add(app.compositor.postSettings, 'vignette', 0, 1, 0.01);
    folders.post.add(app.compositor.postSettings, 'grain', 0, 0.25, 0.001);
    folders.post.add(app.compositor.postSettings, 'aberration', 0, 0.05, 0.0005);
    folders.post.add(app.compositor.postSettings, 'brightness', 0, 2, 0.01);
    folders.post.add(app.compositor.postSettings, 'contrast', 0, 2.5, 0.01);
    folders.post.add(app.compositor.postSettings, 'saturation', 0, 2.5, 0.01);
    folders.post.add(app.compositor.postSettings, 'bloom', 0, 1.5, 0.01);
  };

  refresh();
  return { gui, refresh };
}
