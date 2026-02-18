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
  animate: true,
  useTexture: true,
  distortionAmount: 0.35,
  rippleSpeed: 1.5,
  chromaticAberration: 0.008,
  showRing: true
};

const app = document.querySelector('#app');
const { renderer, scene, camera, uniforms, resize, setTextureFromImage } = createRenderer(settings);
app.appendChild(renderer.domElement);

/**
 * Crea un panel visual fijo para cargar imagen con botón, drag&drop y pegar desde portapapeles.
 * Esto responde al caso "no sé dónde subir/pegar la foto" con un lugar visible en pantalla.
 */
function createImageUploadPanel() {
  const panel = document.createElement('section');
  panel.className = 'upload-panel';

  const title = document.createElement('h2');
  title.className = 'upload-panel__title';
  title.textContent = 'Imagen para editar';

  const button = document.createElement('button');
  button.className = 'upload-panel__button';
  button.type = 'button';
  button.textContent = 'Subir foto';

  const dropzone = document.createElement('div');
  dropzone.className = 'upload-panel__dropzone';
  dropzone.textContent = 'Arrastrá una imagen acá o pegala con Ctrl/Cmd + V';

  const status = document.createElement('p');
  status.className = 'upload-panel__status';
  status.textContent = 'Si no cargás imagen, se usa un placeholder automáticamente.';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.hidden = true;

  panel.append(title, button, dropzone, status, input);
  document.body.appendChild(panel);

  function setStatus(message) {
    status.textContent = message;
  }

  function processFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Ese archivo no es una imagen. Probá con PNG o JPG.');
      return;
    }

    handleImageUpload(file, setStatus);
  }

  button.addEventListener('click', () => input.click());
  dropzone.addEventListener('click', () => input.click());

  input.addEventListener('change', (event) => {
    processFile(event.target.files?.[0]);
    input.value = '';
  });

  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-drag-over');
  });

  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-drag-over');
    processFile(event.dataTransfer?.files?.[0]);
  });

  window.addEventListener('paste', (event) => {
    const imageItem = [...(event.clipboardData?.items ?? [])].find((item) =>
      item.type.startsWith('image/')
    );

    if (!imageItem) return;

    event.preventDefault();
    processFile(imageItem.getAsFile());
  });
}

/**
 * Convierte el archivo subido en una imagen y actualiza la textura del shader.
 * Analogía: tomamos tu foto, la "pegamos" como fondo y la empezamos a deformar con el pulso.
 */
function handleImageUpload(file, onStatusChange = () => {}) {
  const reader = new FileReader();

  reader.onerror = () => {
    onStatusChange('No se pudo leer el archivo. Intentá con otra imagen.');
  };

  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      setTextureFromImage(image);
      settings.useTexture = true;
      syncUniforms();
      onStatusChange(`Imagen cargada: ${file.name}`);
    };
    image.onerror = () => {
      onStatusChange('La imagen parece dañada o no compatible.');
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
}

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
  uniforms.u_useTexture.value = settings.useTexture ? 1 : 0;
  uniforms.u_distortionAmount.value = settings.distortionAmount;
  uniforms.u_rippleSpeed.value = settings.rippleSpeed;
  uniforms.u_chromaticAberration.value = settings.chromaticAberration;
  uniforms.u_showRing.value = settings.showRing ? 1 : 0;
}

createControls(settings, syncUniforms, handleImageUpload);
createImageUploadPanel();
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
