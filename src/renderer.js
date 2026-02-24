import * as THREE from 'three';
import fragmentShader from './shader.glsl?raw';

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
    u_animate: { value: settings.animate ? 1 : 0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 v_uv;
      void main() {
        v_uv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader
  });

  scene.add(new THREE.Mesh(geometry, material));

  /**
   * Ajusta el canvas al tamaño real de pantalla y actualiza u_resolution.
   * Analogía: si cambia el "marco" (pantalla), le avisamos al shader su nuevo tamaño.
   */
  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  }

  return { renderer, scene, camera, uniforms, resize };
}
