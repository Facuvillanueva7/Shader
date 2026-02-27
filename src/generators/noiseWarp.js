import * as THREE from 'three';

const vertexShader = `varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position,1.0);} `;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_scale;
uniform float u_warp;
uniform float u_speed;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv=vUv;
  vec2 p=(uv-0.5);
  p.x*=u_resolution.x/u_resolution.y;
  vec2 q = p * u_scale;
  float n = fbm(q + u_time*u_speed);
  vec2 warp = vec2(fbm(q + vec2(4.0,1.5) + u_time*u_speed), fbm(q + vec2(-2.0,3.2) - u_time*u_speed));
  n = fbm(q + (warp-0.5)*u_warp*2.0);
  vec3 col=mix(u_colorA,u_colorB,n);
  gl_FragColor=vec4(col,0.45+0.55*n);
}
`;

export const noiseWarpGenerator = {
  id: 'noiseWarp',
  name: 'Noise Warp',
  defaultParams: { colorA: '#0ea5e9', colorB: '#f97316', scale: 3.2, warp: 1.2, speed: 0.2 },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },
    { key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'scale', type: 'number', min: 0.5, max: 10, step: 0.1, label: 'Scale' },
    { key: 'warp', type: 'number', min: 0, max: 4, step: 0.05, label: 'Warp' },
    { key: 'speed', type: 'number', min: 0, max: 2, step: 0.02, label: 'Speed' }
  ],
  buildMaterial(params) {
    return new THREE.ShaderMaterial({
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_time: { value: 0 },
        u_colorA: { value: new THREE.Color(params.colorA) },
        u_colorB: { value: new THREE.Color(params.colorB) },
        u_scale: { value: params.scale },
        u_warp: { value: params.warp },
        u_speed: { value: params.speed }
      }
    });
  },
  updateUniforms(material, params, globals) {
    material.uniforms.u_resolution.value.copy(globals.resolution);
    material.uniforms.u_time.value = globals.time;
    material.uniforms.u_colorA.value.set(params.colorA);
    material.uniforms.u_colorB.value.set(params.colorB);
    material.uniforms.u_scale.value = params.scale;
    material.uniforms.u_warp.value = params.warp;
    material.uniforms.u_speed.value = params.speed;
  }
};
