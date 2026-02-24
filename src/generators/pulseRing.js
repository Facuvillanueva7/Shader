import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bpm;
uniform float u_noiseAmount;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_pulseStrength;
uniform float u_ringRadius;
uniform float u_ringSoftness;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  centered.x *= u_resolution.x / u_resolution.y;
  float dist = length(centered);

  float beatsPerSecond = u_bpm / 60.0;
  float beatPhase = u_time * beatsPerSecond * 6.2831853;
  float pulse = pow(0.5 + 0.5 * cos(beatPhase), 3.0);
  float pulsedRadius = u_ringRadius + pulse * u_pulseStrength * 0.2;

  float halfSoft = max(u_ringSoftness, 0.001);
  float outer = smoothstep(pulsedRadius + halfSoft, pulsedRadius, dist);
  float inner = smoothstep(pulsedRadius, pulsedRadius - halfSoft, dist);
  float ring = clamp(outer * inner, 0.0, 1.0);

  float radialGradient = smoothstep(0.0, 1.0, 1.0 - dist * 1.8);
  vec3 baseColor = mix(u_colorA, u_colorB, clamp(dist * 1.4 + pulse * 0.25, 0.0, 1.0));
  vec3 color = baseColor * (ring + radialGradient * 0.35);
  float grain = (hash(gl_FragCoord.xy + u_time * 120.0) - 0.5) * u_noiseAmount;
  color += grain;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), clamp(max(ring, radialGradient * 0.8), 0.0, 1.0));
}
`;

export const pulseRingGenerator = {
  id: 'pulseRing',
  name: 'Pulse Ring',
  defaultParams: {
    colorA: '#8b5cf6',
    colorB: '#22d3ee',
    pulseStrength: 0.8,
    ringRadius: 0.24,
    ringSoftness: 0.06,
    noiseAmount: 0.05
  },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },
    { key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'pulseStrength', type: 'number', min: 0, max: 2, step: 0.01, label: 'Pulse Strength' },
    { key: 'ringRadius', type: 'number', min: 0.05, max: 0.6, step: 0.005, label: 'Ring Radius' },
    { key: 'ringSoftness', type: 'number', min: 0.005, max: 0.25, step: 0.005, label: 'Softness' },
    { key: 'noiseAmount', type: 'number', min: 0, max: 0.4, step: 0.005, label: 'Noise' }
  ],
  buildMaterial(params) {
    return new THREE.ShaderMaterial({
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_time: { value: 0 },
        u_bpm: { value: 120 },
        u_colorA: { value: new THREE.Color(params.colorA) },
        u_colorB: { value: new THREE.Color(params.colorB) },
        u_pulseStrength: { value: params.pulseStrength },
        u_ringRadius: { value: params.ringRadius },
        u_ringSoftness: { value: params.ringSoftness },
        u_noiseAmount: { value: params.noiseAmount }
      }
    });
  },
  updateUniforms(material, params, globals) {
    material.uniforms.u_resolution.value.copy(globals.resolution);
    material.uniforms.u_time.value = globals.time;
    material.uniforms.u_bpm.value = globals.bpm;
    material.uniforms.u_colorA.value.set(params.colorA);
    material.uniforms.u_colorB.value.set(params.colorB);
    material.uniforms.u_pulseStrength.value = params.pulseStrength;
    material.uniforms.u_ringRadius.value = params.ringRadius;
    material.uniforms.u_ringSoftness.value = params.ringSoftness;
    material.uniforms.u_noiseAmount.value = params.noiseAmount;
  }
};
