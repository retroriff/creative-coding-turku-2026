const canvas = document.getElementById('hydra-canvas');
const source = document.getElementById('source');
const sourceLink = document.querySelector('.source-link a');
const modulatePattern = /^(\s*)\.modulate\(noise\((-?\d*\.?\d+), (-?\d*\.?\d+)\), (-?\d*\.?\d+)\)/m;
const linkCode = decodeURIComponent(atob(new URL(sourceLink.href).searchParams.get('code')));
const linkSuffix = linkCode.slice(linkCode.indexOf('(() => {'));
let editor;
let runCode = () => {};
let runTimer;

if (typeof CodeMirror === 'function') {
  editor = CodeMirror.fromTextArea(source, {
    mode: 'javascript',
    theme: 'tomorrow-night-eighties',
    lineWrapping: true,
    viewportMargin: Infinity,
    tabSize: 2
  });
}

const getCode = () => editor ? editor.getValue() : source.value;

const updateLink = () => {
  const code = `\n${getCode()}\n\n\n${linkSuffix}`;
  sourceLink.href = `https://hydra.ojack.xyz/?code=${encodeURIComponent(btoa(encodeURIComponent(code)))}`;
};

const handleEdit = () => {
  updateLink();
  clearTimeout(runTimer);
  runTimer = setTimeout(() => runCode(), 400);
};

if (editor) {
  editor.on('changes', (_, changes) => {
    if (changes.every(change => change.origin === 'controls')) {
      updateLink();
    } else {
      handleEdit();
    }
  });
} else {
  source.addEventListener('input', handleEdit);
}

if (typeof Hydra === 'function') {
  const controls = { noiseScale: 2.4, modulation: 0.18 };
  const target = { ...controls };
  let pendingFrame = false;
  let lastFrameTime;

  const formatModulate = (indent, amount) =>
    `${indent}.modulate(noise(${controls.noiseScale.toFixed(2)}, ${amount}), ${controls.modulation.toFixed(3)})`;

  const writeControls = () => {
    if (!editor) {
      source.value = source.value.replace(modulatePattern, (_, indent, scale, amount) => formatModulate(indent, amount));
      updateLink();
      return;
    }
    for (let index = 0; index < editor.lineCount(); index++) {
      const text = editor.getLine(index);
      const match = text.match(modulatePattern);
      if (!match) continue;
      const line = formatModulate(match[1], match[3]);
      if (text !== line) {
        editor.replaceRange(line, { line: index, ch: 0 }, { line: index, ch: text.length }, 'controls');
      }
      return;
    }
  };

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

    writeControls();

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

  runCode = () => {
    const code = getCode();
    const match = code.match(modulatePattern);
    if (match) {
      controls.noiseScale = target.noiseScale = Number(match[2]);
      controls.modulation = target.modulation = Number(match[4]);
    }
    const liveCode = code.replace(modulatePattern, (_, indent, scale, amount) =>
      `${indent}.modulate(noise(() => controls.noiseScale, ${amount}), () => controls.modulation)`);
    try {
      new Function('controls', liveCode)(controls);
    } catch (error) {
      console.warn(error);
    }
  };

  runCode();
}
