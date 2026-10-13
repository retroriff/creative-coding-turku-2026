const canvas = document.getElementById('hydra-canvas');

if (typeof CodeMirror === 'function') {
  CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: 'javascript',
    theme: 'tomorrow-night-eighties',
    lineWrapping: true,
    readOnly: true,
    viewportMargin: Infinity,
    tabSize: 2
  });
}

if (typeof Hydra === 'function') {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  canvas.width = viewportWidth;
  canvas.height = viewportHeight;

  const hydra = new Hydra({
    canvas,
    width: viewportWidth,
    height: viewportHeight,
    detectAudio: false
  });

  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width !== canvas.width || height !== canvas.height) {
      hydra.setResolution(width, height);
    }
  });

  osc(42, 0.025, 0)
    .modulate(noise(2.4, 0.12), 0.18)
    .rotate(-0.35, 0.009)
    .color(0.15, 1.255, 1.1)
    .add(osc(21, -0.018, 0)
      .rotate(0.9)
      .modulate(noise(3, 0.118), 0.137)
      .color(0.75, 0.12, 0.8), 0.35)
    .mult(gradient(0.213)
      .color(0.6, 0.6, 0.8)
      .add(solid(0.25, 0.25, 0.25)))
    .brightness(-0.176)
    .saturate(0)
    .contrast(2)
    .brightness(0.5)
    .color(0.18, 0.46, 1)
    .layer(src(s0))
    .out(o0);

  render(o0);
}
