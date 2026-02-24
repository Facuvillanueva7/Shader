import * as THREE from 'three';

const vertexShader = `varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position,1.0);} `;
const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_rayCount;
uniform float u_speed;
uniform float u_width;

void main(){
  vec2 p=vUv-0.5;
  p.x*=u_resolution.x/u_resolution.y;
  float ang=atan(p.y,p.x);
  float radius=length(p);
  float rays=0.5+0.5*cos(ang*u_rayCount + u_time*u_speed*6.2831853);
  float mask=smoothstep(u_width,0.0,abs(rays-0.5))*smoothstep(0.9,0.05,radius);
  vec3 col=mix(u_colorA,u_colorB,rays);
  gl_FragColor=vec4(col*mask,mask);
}
`;

export const raysGenerator = {
  id: 'rays',
  name: 'Rays',
  defaultParams: { colorA: '#e879f9', colorB: '#38bdf8', rayCount: 20, speed: 0.8, width: 0.18 },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },
    { key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'rayCount', type: 'number', min: 4, max: 64, step: 1, label: 'Ray Count' },
    { key: 'speed', type: 'number', min: 0, max: 4, step: 0.05, label: 'Speed' },
    { key: 'width', type: 'number', min: 0.02, max: 0.45, step: 0.01, label: 'Width' }
  ],
  buildMaterial(params) {
    return new THREE.ShaderMaterial({ transparent: true, vertexShader, fragmentShader, uniforms: {
      u_resolution: { value: new THREE.Vector2(1,1)}, u_time:{value:0}, u_colorA:{value:new THREE.Color(params.colorA)}, u_colorB:{value:new THREE.Color(params.colorB)}, u_rayCount:{value:params.rayCount}, u_speed:{value:params.speed}, u_width:{value:params.width}
    }});
  },
  updateUniforms(material, params, globals) {
    material.uniforms.u_resolution.value.copy(globals.resolution);
    material.uniforms.u_time.value = globals.time;
    material.uniforms.u_colorA.value.set(params.colorA);
    material.uniforms.u_colorB.value.set(params.colorB);
    material.uniforms.u_rayCount.value = params.rayCount;
    material.uniforms.u_speed.value = params.speed;
    material.uniforms.u_width.value = params.width;
  }
};
