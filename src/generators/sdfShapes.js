import * as THREE from 'three';

const vertexShader = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,1.0);} `;

function makeMaterial(fragment, params) {
  return new THREE.ShaderMaterial({
    transparent: true,
    vertexShader,
    fragmentShader: fragment,
    uniforms: {
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_time: { value: 0 },
      u_colorA: { value: new THREE.Color(params.colorA) },
      u_colorB: { value: new THREE.Color(params.colorB) },
      u_size: { value: params.size },
      u_softness: { value: params.softness },
      u_roundness: { value: params.roundness ?? 0.1 },
      u_sides: { value: params.sides ?? 5 },
      u_points: { value: params.points ?? 5 }
    }
  });
}

const common = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_size;
uniform float u_softness;
uniform float u_roundness;
uniform float u_sides;
uniform float u_points;
vec2 centeredUv(){ vec2 p=vUv-0.5; p.x*=u_resolution.x/u_resolution.y; return p; }
`;

const circleFrag = `${common}
void main(){
  vec2 p=centeredUv();
  float d=length(p)-u_size;
  float m=1.0-smoothstep(0.0,u_softness,d);
  vec3 c=mix(u_colorA,u_colorB,clamp(length(p)*2.0,0.0,1.0));
  gl_FragColor=vec4(c*m,m);
}`;

const roundedBoxFrag = `${common}
float sdRoundBox(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r; }
void main(){
  vec2 p=centeredUv();
  float d=sdRoundBox(p, vec2(u_size*1.4,u_size), u_roundness);
  float m=1.0-smoothstep(0.0,u_softness,d);
  vec3 c=mix(u_colorA,u_colorB,clamp((p.y+0.5),0.0,1.0));
  gl_FragColor=vec4(c*m,m);
}`;

const starFrag = `${common}
float sdStar(vec2 p,float r,int n,float m){
  float an=3.141593/float(n);
  float en=6.2831853/m;
  vec2 acs=vec2(cos(an),sin(an));
  vec2 ecs=vec2(cos(en),sin(en));
  float bn=mod(atan(p.x,p.y),2.0*an)-an;
  p=length(p)*vec2(cos(bn),abs(sin(bn)));
  p-=r*acs;
  p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);
  return length(p)*sign(p.x);
}
void main(){
  vec2 p=centeredUv();
  float d=sdStar(p, u_size, int(clamp(u_points,3.0,10.0)), 2.5);
  float m=1.0-smoothstep(0.0,u_softness,d);
  vec3 c=mix(u_colorA,u_colorB,clamp(0.5+atan(p.y,p.x)/6.2831853,0.0,1.0));
  gl_FragColor=vec4(c*m,m);
}`;

function update(material, params, globals) {
  material.uniforms.u_resolution.value.copy(globals.resolution);
  material.uniforms.u_time.value = globals.time;
  material.uniforms.u_colorA.value.set(params.colorA);
  material.uniforms.u_colorB.value.set(params.colorB);
  material.uniforms.u_size.value = params.size;
  material.uniforms.u_softness.value = params.softness;
  if (material.uniforms.u_roundness) material.uniforms.u_roundness.value = params.roundness ?? 0.1;
  if (material.uniforms.u_points) material.uniforms.u_points.value = params.points ?? 5;
}

export const sdfCircleGenerator = {
  id: 'sdfCircle', name: 'SDF Circle',
  defaultParams: { colorA: '#ff7a18', colorB: '#ffd200', size: 0.22, softness: 0.06 },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },{ key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'size', type: 'number', min: 0.05, max: 0.45, step: 0.005, label: 'Size' },
    { key: 'softness', type: 'number', min: 0.001, max: 0.2, step: 0.002, label: 'Softness' }
  ],
  buildMaterial: (params) => makeMaterial(circleFrag, params), updateUniforms: update
};

export const sdfRoundedBoxGenerator = {
  id: 'sdfRoundedBox', name: 'Rounded Box',
  defaultParams: { colorA: '#34d399', colorB: '#3b82f6', size: 0.2, softness: 0.05, roundness: 0.12 },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },{ key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'size', type: 'number', min: 0.05, max: 0.4, step: 0.005, label: 'Size' },
    { key: 'softness', type: 'number', min: 0.001, max: 0.2, step: 0.002, label: 'Softness' },
    { key: 'roundness', type: 'number', min: 0, max: 0.25, step: 0.005, label: 'Roundness' }
  ],
  buildMaterial: (params) => makeMaterial(roundedBoxFrag, params), updateUniforms: update
};

export const sdfStarGenerator = {
  id: 'sdfStar', name: 'Star',
  defaultParams: { colorA: '#a78bfa', colorB: '#f472b6', size: 0.24, softness: 0.04, points: 6 },
  uiSchema: [
    { key: 'colorA', type: 'color', label: 'Color A' },{ key: 'colorB', type: 'color', label: 'Color B' },
    { key: 'size', type: 'number', min: 0.05, max: 0.4, step: 0.005, label: 'Size' },
    { key: 'softness', type: 'number', min: 0.001, max: 0.2, step: 0.002, label: 'Softness' },
    { key: 'points', type: 'number', min: 3, max: 10, step: 1, label: 'Points' }
  ],
  buildMaterial: (params) => makeMaterial(starFrag, params), updateUniforms: update
};
