import * as THREE from 'three';
import fragmentShader from './shader.glsl?raw';

/**
 * Crea una textura placeholder con gradiente para evitar pantalla negra.
 * Es como tener una "imagen de respaldo" lista por si todavía no cargaste una foto.
 */
function createPlaceholderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#141c2f');
  gradient.addColorStop(0.5, '#2f3f6a');
  gradient.addColorStop(1, '#7a4f89');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Crea el renderer WebGL, escena y material shader en fullscreen.
 * En simple: arma el "motor visual" para dibujar el shader ocupando toda la ventana.
 */
export function createRenderer(settings) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const geometry = new THREE.PlaneGeometry(2, 2);
  const initialTexture = createPlaceholderTexture();

  const uniforms = {
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_time: { value: 0 },
    u_bpm: { value: settings.bpm },
    u_pulseStrength: { value: settings.pulseStrength },
    u_ringRadius: { value: settings.ringRadius },
    u_ringSoftness: { value: settings.ringSoftness },
    u_colorA: { value: new THREE.Color(settings.colorA) },
    u_colorB: { value: new THREE.Color(settings.colorB) },
    u_blendMode: { value: settings.blendModeIndex },
    u_noiseAmount: { value: settings.noiseAmount },
    u_vignetteAmount: { value: settings.vignetteAmount },
    u_animate: { value: settings.animate ? 1 : 0 },
    u_tex: { value: initialTexture },
    u_useTexture: { value: settings.useTexture ? 1 : 0 },
    u_distortionAmount: { value: settings.distortionAmount },
    u_rippleSpeed: { value: settings.rippleSpeed },
    u_chromaticAberration: { value: settings.chromaticAberration },
    u_showRing: { value: settings.showRing ? 1 : 0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader
  });

  scene.add(new THREE.Mesh(geometry, material));

  /**
   * Reemplaza la textura actual por una imagen subida por el usuario.
   * Analogía: cambiás el "papel de fondo" sobre el que se aplica la distorsión del shader.
   */
  function setTextureFromImage(image) {
    const texture = new THREE.Texture(image);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    if (uniforms.u_tex.value) {
      uniforms.u_tex.value.dispose();
    }

    uniforms.u_tex.value = texture;
  }

  /**
   * Ajusta el canvas al tamaño real de pantalla y actualiza u_resolution.
   * Analogía: si cambia el "marco" (pantalla), le avisamos al shader su nuevo tamaño.
   */
  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  }

  return { renderer, scene, camera, uniforms, resize, setTextureFromImage };
}
