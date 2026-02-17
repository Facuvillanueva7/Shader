# Pulse Ring Shader (WebGL + GLSL + Textura)

Mini-app hecha con **Vite + Three.js + lil-gui** para renderizar un shader tipo halo/ring glow con pulso por BPM, distorsión de imagen y controles en vivo.

## Estructura del proyecto

```text
.
├─ index.html
├─ package.json
├─ README.md
└─ src
   ├─ controls.js
   ├─ main.js
   ├─ renderer.js
   ├─ shader.glsl
   └─ style.css
```

## Ejecutar (5 pasos)

1. `npm install`
2. `npm run dev`
3. Abrí la URL que aparece en terminal (normalmente `http://localhost:5173`)
4. Cargá una imagen con **Upload Image** (opcional)
5. Mové sliders y probá **TAP Tempo** para sincronizar el pulso

## Cómo cargar una imagen

1. Abrí el panel de `lil-gui`.
2. Click en **Upload Image**.
3. Elegí un archivo (`image/*`, por ejemplo PNG/JPG).
4. La textura se aplica automáticamente al shader.
5. Si no cargás ninguna imagen, la app usa un **placeholder degradado** para evitar fondo negro.

## Qué controla cada slider / toggle

- **BPM**: velocidad del pulso musical (beats por minuto).
- **Pulse Strength**: cuánto "respira" el halo en cada beat.
- **Ring Radius**: tamaño del anillo (más chico o más grande).
- **Ring Thickness/Softness**: grosor y suavidad del borde del anillo.
- **Color A / Color B**: colores del gradiente del halo.
- **Blend Mode**: mezcla del halo con el fondo (`normal`, `add`, `screen`).
- **Grain/Noise Amount**: cantidad de grano/ruido para textura visual.
- **Vignette Amount**: oscurece bordes como efecto de lente.
- **Animate**: pausa/reanuda animación.
- **Use Texture**: prende/apaga el uso de la textura en el fondo.
- **Distortion Amount**: intensidad de la distorsión UV (ripple + micro-warp).
- **Ripple Speed**: velocidad de ondas radiales de la distorsión.
- **Chromatic Aberration**: separación de canales RGB para efecto óptico.
- **Show Ring**: muestra/oculta la capa del halo por encima de la textura.
- **Upload Image**: botón para cargar imagen desde tu equipo.
- **TAP Tempo**: calcula BPM promedio en base a tus últimos taps.

## Qué hace cada archivo

- `src/shader.glsl`: toda la lógica visual del halo, textura y distorsiones.
- `src/renderer.js`: inicializa WebGL (Three.js), fullscreen quad, uniforms y textura placeholder.
- `src/controls.js`: crea la UI (sliders, selectores, colores, upload y TAP tempo).
- `src/main.js`: conecta renderer + controles y corre el loop.

## Cómo editar el shader sin romper nada

1. **No renombres uniforms** (`u_time`, `u_bpm`, `u_tex`, etc.) sin actualizar `main.js` y `renderer.js`.
2. Si querés cambios seguros, empezá tocando multiplicadores pequeños (`0.02`, `1.25`, etc.).
3. Si desaparece la imagen, revisá que `uvWarp` y los `clamp(..., 0.0, 1.0)` sigan presentes.
4. Si el halo no aparece, revisá `u_showRing` y el bloque de `ring` (`outer`, `inner`, `ring`).
5. Mantené `gl_FragColor = vec4(clamp(mixedColor, 0.0, 1.0), 1.0);` para evitar colores inválidos.
