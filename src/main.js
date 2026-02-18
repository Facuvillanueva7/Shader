import { Clock, Color } from 'three';
import { createRenderer } from './renderer';
import { createControls } from './controls';
import './style.css';

/**
 * Estado global editable desde UI.
 * Pensalo como el panel de "perillas" que alimenta uniforms del shader.
 */
const settings = {
  bpm: 120,
  pulseStrength: 0.8,
  ringRadius: 0.24,
  ringSoftness: 0.06,
  colorA: '#8b5cf6',
  colorB: '#22d3ee',
  blendMode: 'screen',
  blendModeIndex: 2,
  noiseAmount: 0.05,
  vignetteAmount: 0.45,
  animate: true
};

const app = document.querySelector('#app');
const { renderer, scene, camera, uniforms, resize } = createRenderer(settings);
app.appendChild(renderer.domElement);

/**
 * Pasa los valores de UI al shader.
 * Es el "puente" entre controles humanos y matemática GLSL.
 */
function syncUniforms() {
  uniforms.u_bpm.value = settings.bpm;
  uniforms.u_pulseStrength.value = settings.pulseStrength;
  uniforms.u_ringRadius.value = settings.ringRadius;
  uniforms.u_ringSoftness.value = settings.ringSoftness;
  uniforms.u_colorA.value = new Color(settings.colorA);
  uniforms.u_colorB.value = new Color(settings.colorB);
  uniforms.u_blendMode.value = settings.blendModeIndex;
  uniforms.u_noiseAmount.value = settings.noiseAmount;
  uniforms.u_vignetteAmount.value = settings.vignetteAmount;
  uniforms.u_animate.value = settings.animate ? 1 : 0;
}

createControls(settings, syncUniforms);
syncUniforms();

const clock = new Clock();

/**
 * Loop de render continuo.
 * Si animate está apagado, el tiempo visual queda congelado y el halo se mantiene estable.
 */
function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (settings.animate) {
    uniforms.u_time.value = clock.getElapsedTime();
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', resize);
renderLoop();
