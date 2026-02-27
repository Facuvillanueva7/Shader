import * as THREE from 'three';

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeom = new THREE.PlaneGeometry(2, 2);

  function makePass(material) {
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(quadGeom, material);
    scene.add(mesh);
    return { scene, mesh };
  }

  function createTarget() {
    const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false
    });
    return target;
  }

  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  return { renderer, camera, makePass, createTarget, resize, getSize: () => new THREE.Vector2(window.innerWidth, window.innerHeight) };
}
