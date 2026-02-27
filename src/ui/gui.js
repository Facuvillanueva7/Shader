import GUI from 'lil-gui';
import { generators } from '../generators';

export function createAppGUI(app) {
  // Limpieza defensiva: si HMR dejó una GUI vieja (legacy), la removemos.
  document.querySelectorAll('.lil-gui.root').forEach((node) => node.remove());

  const gui = new GUI({ title: 'Synesthesia Lite' });
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
    Object.values(folders).forEach((folder) => {
      [...folder.children].forEach((child) => child.destroy());
    });

    folders.global.add(app.global, 'bpm', 40, 220, 1).name('BPM');

    folders.layers.add({ addPulse: () => { app.layerManager.addLayer('pulseRing'); refresh(); } }, 'addPulse').name('+ Add Pulse Ring');
    folders.layers.add({ addCircle: () => { app.layerManager.addLayer('sdfCircle'); refresh(); } }, 'addCircle').name('+ Add SDF Circle');

    app.layerManager.layers.forEach((layer, index) => {
      const layerLabel = index === 0 ? 'Layer 1 / Pulse Ring Params' : `Layer ${index + 1} / ${layer.name}`;
      const layerFolder = folders.layers.addFolder(layerLabel);

      layerFolder.add(layer, 'visible').name('Visible');
      layerFolder.add(layer, 'blendMode', ['normal', 'add', 'screen', 'multiply', 'overlay']).name('Blend');
      layerFolder.add(layer, 'opacity', 0, 1, 0.01).name('Opacity');
      layerFolder
        .add(layer, 'generatorId', generatorOptions)
        .name('Generator')
        .onChange(() => {
          app.layerManager.setGenerator(layer.id, layer.generatorId);
          refresh();
        });

      layerFolder.add({ up: () => { app.layerManager.moveLayer(layer.id, -1); refresh(); } }, 'up').name('Move Up');
      layerFolder.add({ down: () => { app.layerManager.moveLayer(layer.id, 1); refresh(); } }, 'down').name('Move Down');
      layerFolder.add({ duplicate: () => { app.layerManager.duplicateLayer(layer.id); refresh(); } }, 'duplicate').name('Duplicate');
      layerFolder.add({ remove: () => { app.layerManager.removeLayer(layer.id); refresh(); } }, 'remove').name('Delete');

      const generator = app.generatorMap[layer.generatorId];
      const paramsFolder = layerFolder.addFolder(`${generator.name} Params`);
      generator.uiSchema.forEach((field) => {
        if (field.type === 'color') {
          paramsFolder.addColor(layer.baseParams, field.key).name(field.label);
        } else if (field.type === 'select') {
          paramsFolder.add(layer.baseParams, field.key, field.options).name(field.label);
        } else {
          paramsFolder.add(layer.baseParams, field.key, field.min, field.max, field.step).name(field.label);
        }
      });
    });

    folders.modulators.add({ addLfo: () => { app.modManager.add('lfo'); refresh(); } }, 'addLfo').name('+ LFO');
    folders.modulators.add({ addAudio: () => { app.modManager.add('audio'); refresh(); } }, 'addAudio').name('+ Audio');
    folders.modulators.add({ enableAudio: () => app.modManager.enableAudio() }, 'enableAudio').name('Enable Audio');

    app.modManager.modulators.forEach((mod) => {
      const modFolder = folders.modulators.addFolder(`${mod.type}: ${mod.id}`);
      Object.entries(mod.params).forEach(([key, value]) => {
        if (typeof value === 'number') {
          modFolder.add(mod.params, key, 0, key.includes('rate') ? 12 : 2, 0.01).name(key);
        } else {
          modFolder.add(mod.params, key, ['sine', 'triangle', 'saw', 'square']).name(key);
        }
      });
      modFolder.add(mod, 'output', 0, 1, 0.001).name('Output').listen();
      if (mod.type === 'audio') {
        modFolder.add(mod.bands, 'low', 0, 1, 0.001).listen();
        modFolder.add(mod.bands, 'mid', 0, 1, 0.001).listen();
        modFolder.add(mod.bands, 'high', 0, 1, 0.001).listen();
      }
    });

    folders.mappings.add({ addMapping: () => { app.addMapping(); refresh(); } }, 'addMapping').name('+ Add Mapping');
    app.mappingEngine.mappings.forEach((map, index) => {
      const mapFolder = folders.mappings.addFolder(`Map ${index + 1}`);
      mapFolder.add(map, 'modId', app.modManager.modulators.map((m) => m.id));
      mapFolder.add(map, 'target', app.getNumericTargets());
      mapFolder.add(map, 'amount', -2, 2, 0.01);
      mapFolder.add(map, 'min', -1, 1, 0.01);
      mapFolder.add(map, 'max', -1, 1, 0.01);
      mapFolder.add(map, 'curve', ['linear', 'expo']);
      mapFolder.add({ remove: () => { app.mappingEngine.remove(index); refresh(); } }, 'remove').name('Delete');
    });

    folders.scenes.add(app.sceneState, 'name').name('Scene Name');
    folders.scenes.add({ save: app.saveScene }, 'save').name('Save Scene');
    folders.scenes.add({ load: () => app.loadScene(app.sceneState.index) }, 'load').name('Load Scene');
    folders.scenes.add({ prev: app.prevScene }, 'prev').name('Prev Scene');
    folders.scenes.add({ next: app.nextScene }, 'next').name('Next Scene');
    folders.scenes.add({ exportJson: app.exportScenes }, 'exportJson').name('Export JSON');
    folders.scenes.add({ importJson: app.importScenes }, 'importJson').name('Import JSON');
    folders.scenes.add(app.sceneState, 'transitionDuration', 0.1, 5, 0.1).name('Crossfade Sec');

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
