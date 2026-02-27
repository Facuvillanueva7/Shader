export function createStatusBadge(app) {
  const badge = document.createElement('div');
  badge.className = 'status-badge';

  const title = document.createElement('strong');
  title.textContent = 'Synesthesia Lite (NEW ARCH)';

  const info = document.createElement('span');
  info.textContent = 'Layer Stack activo';

  const addLayerButton = document.createElement('button');
  addLayerButton.type = 'button';
  addLayerButton.textContent = '+ Add Layer';
  addLayerButton.addEventListener('click', () => {
    app.layerManager.addLayer('sdfCircle');
    app.onStateChanged();
  });

  badge.append(title, info, addLayerButton);
  document.body.appendChild(badge);

  return {
    update() {
      info.textContent = `${app.layerManager.layers.length} layers activas`;
    }
  };
}
