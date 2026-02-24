precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bpm;
uniform float u_pulseStrength;
uniform float u_ringRadius;
uniform float u_ringSoftness;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_blendMode;
uniform float u_noiseAmount;
uniform float u_vignetteAmount;
uniform float u_animate;
uniform sampler2D u_tex;
uniform float u_useTexture;
uniform float u_distortionAmount;
uniform float u_rippleSpeed;
uniform float u_chromaticAberration;
uniform float u_showRing;

// hash simple: genera un pseudo-random liviano para agregar grano/micro-warp
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  // Coordenadas normalizadas centradas (0,0) en el medio de pantalla.
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 centered = uv - 0.5;

  // Mantiene el círculo "redondo" incluso en pantallas anchas.
  centered.x *= u_resolution.x / u_resolution.y;

  // Distancia al centro: como una regla que mide qué tan lejos está cada pixel del medio.
  float dist = length(centered);

  // BPM -> beats por segundo. Esta frecuencia define el ritmo del pulso.
  float beatsPerSecond = u_bpm / 60.0;
  float time = u_time * u_animate;

  // Pulso estable entre 0 y 1 usando coseno (máximo en cada beat).
  float beatPhase = time * beatsPerSecond * 6.28318530718;
  float pulse = pow(0.5 + 0.5 * cos(beatPhase), 3.0);

  // Distorsión UV radial (ripple): como empujar una sábana desde el centro al ritmo del beat.
  float rippleWave = sin(dist * 40.0 - time * u_rippleSpeed * 6.28318530718);
  float ripplePush = rippleWave * pulse * u_distortionAmount * 0.02;
  vec2 uvRipple = uv + normalize(centered + 0.0001) * ripplePush;

  // Micro-warp barato con hash: vibración pequeña para que no se vea "plano".
  float microX = (hash(uv * 480.0 + time * 12.0) - 0.5) * u_distortionAmount * 0.01;
  float microY = (hash(uv.yx * 360.0 - time * 9.0) - 0.5) * u_distortionAmount * 0.01;
  vec2 uvWarp = clamp(uvRipple + vec2(microX, microY), 0.0, 1.0);

  // Aberración cromática: separa ligeramente canales RGB como un efecto de lente.
  vec2 chromaOffset = normalize(centered + 0.0001) * u_chromaticAberration;
  float texR = texture2D(u_tex, clamp(uvWarp + chromaOffset, 0.0, 1.0)).r;
  float texG = texture2D(u_tex, uvWarp).g;
  float texB = texture2D(u_tex, clamp(uvWarp - chromaOffset, 0.0, 1.0)).b;
  vec3 textureColor = vec3(texR, texG, texB);

  // Placeholder procedural: sirve de fondo cuando no queremos usar textura real.
  vec3 placeholder = mix(vec3(0.08, 0.12, 0.22), vec3(0.32, 0.18, 0.40), uv.y + uv.x * 0.35);

  // Use Texture alterna entre placeholder y textura muestreada (que por defecto también tiene un gradiente).
  vec3 bg = mix(placeholder, textureColor, u_useTexture);

  // Este valor "infla" o "desinfla" el halo según la fuerza del pulso.
  float pulsedRadius = u_ringRadius + pulse * u_pulseStrength * 0.2;

  // Ring suave: diferencia entre dos smoothstep para tener borde interno/externo difuminado.
  float halfSoft = max(u_ringSoftness, 0.001);
  float outer = smoothstep(pulsedRadius + halfSoft, pulsedRadius, dist);
  float inner = smoothstep(pulsedRadius, pulsedRadius - halfSoft, dist);
  float ring = clamp(outer * inner, 0.0, 1.0);

  // Gradiente radial suave desde el centro hacia afuera.
  float radialGradient = smoothstep(0.0, 1.0, 1.0 - dist * 1.8);

  vec3 baseColor = mix(u_colorA, u_colorB, clamp(dist * 1.4 + pulse * 0.25, 0.0, 1.0));
  vec3 ringColor = baseColor * (ring + radialGradient * 0.35);

  // Blend mode aproximado en shader.
  vec3 colorNormal = mix(bg, ringColor, ring);
  vec3 colorAdd = bg + ringColor * 1.25;
  vec3 colorScreen = 1.0 - (1.0 - bg) * (1.0 - ringColor);

  vec3 ringLayer = colorNormal;
  if (u_blendMode < 0.5) {
    ringLayer = colorNormal;
  } else if (u_blendMode < 1.5) {
    ringLayer = colorAdd;
  } else {
    ringLayer = colorScreen;
  }

  // Show Ring permite prender/apagar el halo encima de la textura.
  vec3 mixedColor = mix(bg, ringLayer, u_showRing);

  // Grano liviano para dar textura (sin Perlin, súper barato).
  float grain = (hash(gl_FragCoord.xy + u_time * 120.0) - 0.5) * u_noiseAmount;
  mixedColor += grain;

  // Viñeta: oscurece bordes como lente/cámara.
  float vignette = smoothstep(0.95, 0.2, length(centered));
  mixedColor *= mix(1.0, vignette, u_vignetteAmount);

  gl_FragColor = vec4(clamp(mixedColor, 0.0, 1.0), 1.0);
}
