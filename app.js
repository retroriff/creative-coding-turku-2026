const canvas = document.getElementById('hydra-canvas');
const source = document.getElementById('source');
let editor;

if (typeof CodeMirror === 'function') {
  editor = CodeMirror.fromTextArea(source, {
    mode: 'javascript',
    theme: 'tomorrow-night-eighties',
    lineWrapping: true,
    readOnly: true,
    viewportMargin: Infinity,
    tabSize: 2
  });
}

if (typeof Hydra === 'function') {
  const controls = { noiseScale: 2.4, modulation: 0.18 };
  const target = { ...controls };
  const modulationLine = editor?.getValue().split('\n')
    .findIndex(line => line.includes('.modulate(noise(2.4, 0.12), 0.18)'));
  let pendingFrame = false;
  let lastFrameTime;

  const updateControls = now => {
    const blend = 1 - Math.exp(-(now - lastFrameTime) / 250);
    lastFrameTime = now;

    controls.noiseScale += (target.noiseScale - controls.noiseScale) * blend;
    controls.modulation += (target.modulation - controls.modulation) * blend;

    if (Math.abs(target.noiseScale - controls.noiseScale) < 0.005) {
      controls.noiseScale = target.noiseScale;
    }
    if (Math.abs(target.modulation - controls.modulation) < 0.0005) {
      controls.modulation = target.modulation;
    }

    const line = `\t.modulate(noise(${controls.noiseScale.toFixed(2)}, 0.12), ${controls.modulation.toFixed(3)})`;
    if (editor && modulationLine >= 0 && editor.getLine(modulationLine) !== line) {
      editor.replaceRange(line,
        { line: modulationLine, ch: 0 },
        { line: modulationLine, ch: editor.getLine(modulationLine).length });
    }
    source.value = source.value.replace(/^\t\.modulate\(noise\([^\n]+/m, line);

    if (controls.noiseScale !== target.noiseScale || controls.modulation !== target.modulation) {
      requestAnimationFrame(updateControls);
    } else {
      pendingFrame = false;
    }
  };

  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const x = Math.max(0, Math.min(1, event.clientX / window.innerWidth));
    const y = Math.max(0, Math.min(1, event.clientY / window.innerHeight));
    target.noiseScale = 0.8 + x * 4.7;
    target.modulation = 0.05 + y * 0.55;
    if (pendingFrame) return;
    pendingFrame = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(updateControls);
  });

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
    .modulate(noise(() => controls.noiseScale, 0.12), () => controls.modulation)
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
