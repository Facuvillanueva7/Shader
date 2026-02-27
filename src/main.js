import { Clock, Vector2 } from 'three';
import { createRenderer } from './render/renderer';
import { Compositor } from './render/compositor';
import { LayerManager } from './layers/layerManager';
import { generatorMap, generators } from './generators';
import { ModulatorManager } from './modulators';
import { MappingEngine } from './mapping/mappingEngine';
import { SceneStore, lerpSceneState } from './scenes/sceneStore';
import { createAppGUI } from './ui/gui';
import { createStatusBadge } from './ui/statusBadge';
import './style.css';

console.log('NEW ARCH LOADED ✅');

const appNode = document.querySelector('#app');
const renderCtx = createRenderer();
appNode.appendChild(renderCtx.renderer.domElement);

const layerManager = new LayerManager();
const compositor = new Compositor(renderCtx);
const modManager = new ModulatorManager();
const mappingEngine = new MappingEngine();
const sceneStore = new SceneStore();
sceneStore.loadLocal();

const global = { bpm: 120 };
const sceneState = { index: 0, name: 'Scene', transitionDuration: 1 };

const app = {
  global,
  layerManager,
  generatorMap,
  modManager,
  mappingEngine,
  compositor,
  sceneState,
  addLayer: () => { layerManager.addLayer('pulseRing'); ui.refresh(); },
  getNumericTargets: () => layerManager.layers.flatMap((layer) => Object.keys(layer.baseParams)
    .filter((k) => typeof layer.baseParams[k] === 'number')
    .map((key) => `layer:${layer.id}.${key}`)),
  addMapping: () => {
    const modId = modManager.modulators[0]?.id;
    const target = app.getNumericTargets()[0];
    if (!modId || !target) return;
    mappingEngine.add({ modId, target, amount: 0.35, min: 0, max: 1, curve: 'linear', sourceBand: '' });
  },
  saveScene: () => {
    sceneStore.save(sceneState.name || `Scene ${Date.now()}`, serializeState());
  },
  loadScene: (index) => startTransition(sceneStore.scenes[index]?.state),
  nextScene: () => {
    sceneState.index = (sceneState.index + 1) % sceneStore.scenes.length;
    app.loadScene(sceneState.index);
  },
  prevScene: () => {
    sceneState.index = (sceneState.index - 1 + sceneStore.scenes.length) % sceneStore.scenes.length;
    app.loadScene(sceneState.index);
  },
  exportScenes: () => {
    const text = sceneStore.exportJSON();
    prompt('Copy scene JSON', text);
  },
  importScenes: () => {
    const text = prompt('Paste scene JSON');
    if (!text) return;
    sceneStore.importJSON(text);
    sceneState.index = 0;
  }
};

const ui = createAppGUI(app);
const statusBadge = createStatusBadge({
  layerManager,
  onStateChanged: () => {
    ui.refresh();
    statusBadge.update();
  }
});

function serializeState() {
  return {
    bpm: global.bpm,
    layers: layerManager.toJSON(),
    modulators: modManager.toJSON(),
    mappings: mappingEngine.toJSON(),
    postFX: { ...compositor.postSettings }
  };
}

let transition = null;
function startTransition(targetState) {
  if (!targetState) return;
  transition = {
    start: performance.now(),
    duration: sceneState.transitionDuration * 1000,
    from: serializeState(),
    to: targetState
  };
}

function applyState(state) {
  global.bpm = state.bpm;
  layerManager.loadFromJSON(state.layers);
  modManager.loadFromJSON(state.modulators || []);
  mappingEngine.loadFromJSON(state.mappings || []);
  Object.assign(compositor.postSettings, state.postFX || {});
  ui.refresh();
  statusBadge.update();
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowRight') app.nextScene();
  if (event.code === 'ArrowLeft') app.prevScene();
  if (event.code === 'Space') modManager.triggerEnvelope(true);
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') modManager.triggerEnvelope(false);
});

const clock = new Clock();
let prevTime = 0;
function tick() {
  requestAnimationFrame(tick);
  const elapsed = clock.getElapsedTime();
  const dt = Math.max(0.001, elapsed - prevTime);
  prevTime = elapsed;

  if (transition) {
    const p = (performance.now() - transition.start) / transition.duration;
    const t = Math.min(1, Math.max(0, p));
    const eased = t * t * (3 - 2 * t);
    const blendState = lerpSceneState(transition.from, transition.to, eased);
    applyState(blendState);
    if (t >= 1) {
      applyState(transition.to);
      transition = null;
    }
  }

  modManager.update(elapsed, dt);
  mappingEngine.apply(layerManager, modManager);
  statusBadge.update();

  const globals = { time: elapsed, bpm: global.bpm, resolution: new Vector2(window.innerWidth, window.innerHeight), generators };
  compositor.render(layerManager.layers, globals);
}

tick();

window.addEventListener('resize', () => {
  renderCtx.resize();
  compositor.resize(window.innerWidth, window.innerHeight);
});
compositor.resize(window.innerWidth, window.innerHeight);
