# Synesthesia MVP Shader Tool (Vite + Three.js + lil-gui)

Editor visual tipo VJ con **layers + generators + modulators + scenes + post-FX**.

## Run
1. `npm install`
2. `npm run dev`
3. Abrí la URL de Vite.

## Arquitectura
- `src/render/renderer.js`: renderer fullscreen + render targets.
- `src/render/compositor.js`: composición por capas (blend/opacity) + post-FX global.
- `src/layers/layerManager.js`: stack de capas (add/remove/duplicate/reorder/visibility).
- `src/generators/*`: biblioteca de generadores shader (Pulse Ring + 6 adicionales).
- `src/modulators/*`: LFO, Envelope ADSR, Audio FFT (low/mid/high + beat).
- `src/mapping/mappingEngine.js`: mapea moduladores a parámetros de capas.
- `src/scenes/sceneStore.js`: save/load/export/import + 5 demos.
- `src/ui/gui.js`: UI lil-gui para Layers, Modulators, Mappings, Scenes y PostFX.

## Workflow rápido
- **Layers**: Add Layer, cambiar Generator, blend mode, opacity, up/down, duplicate, delete.
- **Modulators**: crear LFO/Envelope/Audio, ajustar params.
- **Mappings**: vincular `modulator -> layer:param` con amount/min/max/curve.
- **Scenes**: Save, Load, Next/Prev, Export JSON, Import JSON.
- **Transiciones**: crossfade por `Crossfade Sec` + atajos `←/→`.
- **Audio**: botón `Enable Mic` para activar FFT.
- **Envelope**: tecla `Space` para trigger gate.

## Generators incluidos
1. Pulse Ring (migrado del shader original)
2. SDF Circle
3. SDF Rounded Box
4. SDF Star
5. Stripes + Checker
6. Noise Warp (fbm + displacement)
7. Rays

## Post FX global (MVP)
- Vignette
- Grain
- Chromatic aberration
- Brightness / Contrast / Saturation
- Fake bloom (threshold blur aproximado)

