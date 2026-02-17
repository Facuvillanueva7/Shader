# Pulse Ring Shader (WebGL + GLSL)

Mini-app hecha con **Vite + Three.js + lil-gui** para renderizar un shader tipo halo/ring glow con pulso por BPM y controles en vivo.

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
4. Mové sliders y pickers en el panel derecho
5. Usá **TAP Tempo** para capturar BPM con clicks

## Qué hace cada archivo

- `src/shader.glsl`: toda la lógica visual del halo/pulso (fragment shader).
- `src/renderer.js`: inicializa WebGL (Three.js), canvas fullscreen y uniforms.
- `src/controls.js`: crea la UI (sliders, selectores, colores, TAP tempo).
- `src/main.js`: conecta renderer + controles y corre el loop.

## Cómo editar el shader sin romper nada

1. **No renombres uniforms** (`u_time`, `u_bpm`, etc.) a menos que también actualices `main.js`/`renderer.js`.
2. Cambiá valores de look en la parte de `ring`, `radialGradient`, `grain` y `vignette` de forma gradual.
3. Si la imagen desaparece, revisá `clamp(mixedColor, 0.0, 1.0)` y que `gl_FragColor` siga asignándose.
4. Para cambios seguros, tocá primero constantes chicas (ej. multiplicadores `1.2`, `0.35`) y probá.
5. Si querés experimentar, duplicá una sección y comentá la anterior para poder volver rápido.
