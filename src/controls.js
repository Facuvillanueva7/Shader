import GUI from 'lil-gui';

const BLEND_MODE_OPTIONS = {
  normal: 0,
  add: 1,
  screen: 2
};

/**
 * Construye la UI con sliders, pickers, TAP tempo y acciones de textura.
 * En simple: todas las "perillas" y botones para experimentar sin tocar código.
 */
export function createControls(settings, onChange, onUploadImage) {
  const gui = new GUI({ title: 'Pulse Ring Controls' });

  // Array de timestamps para promediar los últimos taps y estimar BPM real.
  const tapTimes = [];

  // Input de archivo oculto: lo disparamos desde un botón de la GUI.
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUploadImage(file);
    fileInput.value = '';
  });

  const bpmController = gui.add(settings, 'bpm', 40, 220, 1).name('BPM').onChange(onChange);
  bpmController.listen();

  gui.add(settings, 'pulseStrength', 0, 2, 0.01).name('Pulse Strength').onChange(onChange);
  gui.add(settings, 'ringRadius', 0.05, 0.6, 0.005).name('Ring Radius').onChange(onChange);
  gui.add(settings, 'ringSoftness', 0.005, 0.25, 0.005).name('Ring Thickness/Softness').onChange(onChange);

  gui.addColor(settings, 'colorA').name('Color A').onChange(onChange);
  gui.addColor(settings, 'colorB').name('Color B').onChange(onChange);

  gui
    .add(settings, 'blendMode', Object.keys(BLEND_MODE_OPTIONS))
    .name('Blend Mode')
    .onChange((value) => {
      settings.blendModeIndex = BLEND_MODE_OPTIONS[value];
      onChange();
    });

  gui.add(settings, 'noiseAmount', 0, 0.35, 0.005).name('Grain/Noise Amount').onChange(onChange);
  gui.add(settings, 'vignetteAmount', 0, 1, 0.01).name('Vignette Amount').onChange(onChange);
  gui.add(settings, 'animate').name('Animate').onChange(onChange);

  gui.add(settings, 'useTexture').name('Use Texture').onChange(onChange);
  gui.add(settings, 'distortionAmount', 0, 1.5, 0.01).name('Distortion Amount').onChange(onChange);
  gui.add(settings, 'rippleSpeed', 0.1, 6, 0.05).name('Ripple Speed').onChange(onChange);
  gui
    .add(settings, 'chromaticAberration', 0, 0.05, 0.001)
    .name('Chromatic Aberration')
    .onChange(onChange);
  gui.add(settings, 'showRing').name('Show Ring').onChange(onChange);

  const actions = {
    uploadImage: () => fileInput.click(),
    tapTempo: () => {
      const now = performance.now();
      tapTimes.push(now);

      // Conservamos solo los últimos 6 taps para evitar ruido excesivo.
      if (tapTimes.length > 6) tapTimes.shift();
      if (tapTimes.length < 2) return;

      const intervals = [];
      for (let i = 1; i < tapTimes.length; i += 1) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }

      // Promedio en ms entre taps -> BPM = 60000 / promedio.
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const nextBpm = Math.round(60000 / avgInterval);
      settings.bpm = Math.min(220, Math.max(40, nextBpm));

      bpmController.updateDisplay();
      onChange();
    }
  };

  gui.add(actions, 'uploadImage').name('Upload Image');
  gui.add(actions, 'tapTempo').name('TAP Tempo');

  return gui;
}
