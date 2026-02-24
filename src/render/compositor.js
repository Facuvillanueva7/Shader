import * as THREE from 'three';
import { generatorMap } from '../generators';

const blendModes = { normal: 0, add: 1, screen: 2, multiply: 3, overlay: 4 };

const vertexShader = `varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position,1.0);} `;
const blendFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D u_base;
uniform sampler2D u_layer;
uniform float u_mode;
uniform float u_opacity;
vec3 overlay(vec3 b, vec3 l){ return mix(2.0*b*l, 1.0-2.0*(1.0-b)*(1.0-l), step(0.5,b)); }
void main(){
  vec4 b=texture2D(u_base,vUv);
  vec4 l=texture2D(u_layer,vUv);
  vec3 lm=l.rgb;
  vec3 outCol=b.rgb;
  if(u_mode<0.5){ outCol = mix(b.rgb,lm,l.a*u_opacity); }
  else if(u_mode<1.5){ outCol = b.rgb + lm*l.a*u_opacity; }
  else if(u_mode<2.5){ outCol = 1.0-(1.0-b.rgb)*(1.0-lm*l.a*u_opacity); }
  else if(u_mode<3.5){ outCol = b.rgb * mix(vec3(1.0), lm, l.a*u_opacity); }
  else { outCol = mix(b.rgb, overlay(b.rgb,lm), l.a*u_opacity); }
  gl_FragColor=vec4(clamp(outCol,0.0,1.0),1.0);
}`;

const postFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_vignette;
uniform float u_grain;
uniform float u_aberration;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_bloom;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
vec3 sat(vec3 c,float s){ float l=dot(c,vec3(0.2126,0.7152,0.0722)); return mix(vec3(l),c,s); }
void main(){
  vec2 dir=(vUv-0.5)*u_aberration;
  float r=texture2D(u_tex,clamp(vUv+dir,0.0,1.0)).r;
  float g=texture2D(u_tex,vUv).g;
  float b=texture2D(u_tex,clamp(vUv-dir,0.0,1.0)).b;
  vec3 col=vec3(r,g,b);
  vec2 px=1.0/u_resolution;
  vec3 blur=vec3(0.0);
  blur += texture2D(u_tex, vUv + vec2(px.x,0.0)).rgb;
  blur += texture2D(u_tex, vUv - vec2(px.x,0.0)).rgb;
  blur += texture2D(u_tex, vUv + vec2(0.0,px.y)).rgb;
  blur += texture2D(u_tex, vUv - vec2(0.0,px.y)).rgb;
  blur *= 0.25;
  vec3 bloom=max(blur-0.55,0.0)*u_bloom;
  col += bloom;
  col = (col - 0.5) * max(u_contrast, 0.01) + 0.5;
  col *= u_brightness;
  col = sat(col, u_saturation);
  float vign=smoothstep(0.95,0.18,length(vUv-0.5));
  col *= mix(1.0,vign,u_vignette);
  col += (hash(gl_FragCoord.xy+u_time*100.0)-0.5)*u_grain;
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

export class Compositor {
  constructor(renderCtx) {
    this.ctx = renderCtx;
    this.layerTargets = new Map();
    this.layerPasses = new Map();
    this.accA = renderCtx.createTarget();
    this.accB = renderCtx.createTarget();

    this.blendMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: blendFragment,
      uniforms: { u_base: { value: null }, u_layer: { value: null }, u_mode: { value: 0 }, u_opacity: { value: 1 } }
    });
    this.blendPass = renderCtx.makePass(this.blendMaterial);

    this.postSettings = { vignette: 0.35, grain: 0.04, aberration: 0.004, brightness: 1, contrast: 1.05, saturation: 1.05, bloom: 0.4 };
    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: postFragment,
      uniforms: {
        u_tex: { value: null }, u_resolution: { value: new THREE.Vector2(1, 1) }, u_time: { value: 0 },
        u_vignette: { value: this.postSettings.vignette }, u_grain: { value: this.postSettings.grain }, u_aberration: { value: this.postSettings.aberration },
        u_brightness: { value: this.postSettings.brightness }, u_contrast: { value: this.postSettings.contrast }, u_saturation: { value: this.postSettings.saturation }, u_bloom: { value: this.postSettings.bloom }
      }
    });
    this.postPass = renderCtx.makePass(this.postMaterial);
  }

  ensureLayerResources(layer) {
    if (!this.layerTargets.has(layer.id)) this.layerTargets.set(layer.id, this.ctx.createTarget());
    const existing = this.layerPasses.get(layer.id);
    if (!existing || existing.generatorId !== layer.generatorId) {
      existing?.material?.dispose();
      const gen = generatorMap[layer.generatorId];
      const material = gen.buildMaterial(layer.params);
      const pass = this.ctx.makePass(material);
      this.layerPasses.set(layer.id, { ...pass, material, generatorId: layer.generatorId });
    }
  }

  prune(layers) {
    const ids = new Set(layers.map((l) => l.id));
    [...this.layerTargets.keys()].forEach((id) => { if (!ids.has(id)) { this.layerTargets.get(id).dispose(); this.layerTargets.delete(id); } });
    [...this.layerPasses.keys()].forEach((id) => { if (!ids.has(id)) { this.layerPasses.get(id).material.dispose(); this.layerPasses.delete(id); } });
  }

  resize(w, h) {
    this.accA.setSize(w, h); this.accB.setSize(w, h);
    for (const rt of this.layerTargets.values()) rt.setSize(w, h);
    this.postMaterial.uniforms.u_resolution.value.set(w, h);
  }

  render(layers, globals, transitionMix = 0, targetLayers = null) {
    const renderer = this.ctx.renderer;
    this.prune(layers);
    renderer.setRenderTarget(this.accA);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, true, true);

    const renderLayerStack = (stack) => {
      let read = this.accA;
      let write = this.accB;
      for (const layer of stack) {
        if (!layer.visible) continue;
        this.ensureLayerResources(layer);
        const target = this.layerTargets.get(layer.id);
        const pass = this.layerPasses.get(layer.id);
        generatorMap[layer.generatorId].updateUniforms(pass.material, layer.params, globals);
        renderer.setRenderTarget(target);
        renderer.setClearColor(0x000000, 0);
        renderer.clear(true, true, true);
        renderer.render(pass.scene, this.ctx.camera);

        this.blendMaterial.uniforms.u_base.value = read.texture;
        this.blendMaterial.uniforms.u_layer.value = target.texture;
        this.blendMaterial.uniforms.u_mode.value = blendModes[layer.blendMode] ?? 0;
        this.blendMaterial.uniforms.u_opacity.value = layer.opacity;

        renderer.setRenderTarget(write);
        renderer.clear(true, true, true);
        renderer.render(this.blendPass.scene, this.ctx.camera);
        [read, write] = [write, read];
      }
      return read.texture;
    };

    const baseTexture = renderLayerStack(layers);
    let finalTexture = baseTexture;

    if (targetLayers) {
      renderer.setRenderTarget(this.accB);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, true, true);
      [this.accA, this.accB] = [this.accB, this.accA];
      const toTexture = renderLayerStack(targetLayers);
      this.blendMaterial.uniforms.u_base.value = baseTexture;
      this.blendMaterial.uniforms.u_layer.value = toTexture;
      this.blendMaterial.uniforms.u_mode.value = 0;
      this.blendMaterial.uniforms.u_opacity.value = transitionMix;
      renderer.setRenderTarget(this.accA);
      renderer.clear(true, true, true);
      renderer.render(this.blendPass.scene, this.ctx.camera);
      finalTexture = this.accA.texture;
    }

    this.postMaterial.uniforms.u_tex.value = finalTexture;
    this.postMaterial.uniforms.u_time.value = globals.time;
    this.postMaterial.uniforms.u_vignette.value = this.postSettings.vignette;
    this.postMaterial.uniforms.u_grain.value = this.postSettings.grain;
    this.postMaterial.uniforms.u_aberration.value = this.postSettings.aberration;
    this.postMaterial.uniforms.u_brightness.value = this.postSettings.brightness;
    this.postMaterial.uniforms.u_contrast.value = this.postSettings.contrast;
    this.postMaterial.uniforms.u_saturation.value = this.postSettings.saturation;
    this.postMaterial.uniforms.u_bloom.value = this.postSettings.bloom;

    renderer.setRenderTarget(null);
    renderer.render(this.postPass.scene, this.ctx.camera);
  }
}
