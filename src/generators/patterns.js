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
uniform float u_speed;
uniform float u_mixMode;
void main(){
  vec2 uv=vUv;
  vec2 p=uv-0.5;
  p.x*=u_resolution.x/u_resolution.y;
  float stripes=0.5+0.5*sin((p.x*u_scale+u_time*u_speed)*6.2831853);
  vec2 c=floor((uv+u_time*0.03*u_speed)*u_scale*1.5);
  float checker=mod(c.x+c.y,2.0);
  float mask=mix(stripes,checker,u_mixMode);
  vec3 col=mix(u_colorA,u_colorB,mask);
  gl_FragColor=vec4(col,0.35+mask*0.65);
}
`;

export const stripesCheckerGenerator = {
  id: 'stripesChecker',
  name: 'Stripes + Checker',
  defaultParams: { colorA: '#00f5d4', colorB: '#f15bb5', scale: 8, speed: 0.6, mixMode: 0.3 },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },
    { key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'scale', type: 'number', min: 2, max: 30, step: 1, label: 'Scale' },
    { key: 'speed', type: 'number', min: 0, max: 4, step: 0.05, label: 'Speed' },
    { key: 'mixMode', type: 'number', min: 0, max: 1, step: 0.01, label: 'Checker Mix' }
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
        u_speed: { value: params.speed },
        u_mixMode: { value: params.mixMode }
      }
    });
  },
  updateUniforms(material, params, globals) {
    material.uniforms.u_resolution.value.copy(globals.resolution);
    material.uniforms.u_time.value = globals.time;
    material.uniforms.u_colorA.value.set(params.colorA);
    material.uniforms.u_colorB.value.set(params.colorB);
    material.uniforms.u_scale.value = params.scale;
    material.uniforms.u_speed.value = params.speed;
    material.uniforms.u_mixMode.value = params.mixMode;
  }
};
