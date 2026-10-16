import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const MORPH_SECONDS = 2.5;
const HOLD_SECONDS = 2;
const VIEWPORT_MARGIN = 0.05;
const MOBILE_BREAKPOINT = 700;
const MOBILE_TEXT_AREA = 0.34;
const PIXEL_RATIO = Math.min(window.devicePixelRatio, 2);
const { randFloat, clamp, smoothstep } = THREE.MathUtils;

const hydraCanvas = document.getElementById('hydra-canvas');
const source = document.getElementById('source');
const threeCanvas = document.createElement('canvas');

const palettes = [
  ['#3fd0e0', '#9b3df0', '#ff6ad5'],
  ['#5b8cff', '#b04cff', '#ff9ad8'],
  ['#20e3b2', '#4a5cff', '#d23cff'],
  ['#ffb36b', '#ff4fa3', '#6a3dff'],
  ['#7af0ff', '#6d5bff', '#ff3ca6']
];
let paletteIndex = 0;

const renderer = new THREE.WebGLRenderer({
  canvas: threeCanvas,
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setPixelRatio(PIXEL_RATIO);

const backgroundCanvas = document.createElement('canvas');
backgroundCanvas.width = backgroundCanvas.height = 512;
const backgroundTexture = new THREE.CanvasTexture(backgroundCanvas);
backgroundTexture.colorSpace = THREE.SRGBColorSpace;

const paintBackground = stops => {
  const context = backgroundCanvas.getContext('2d');
  const gradient = context.createRadialGradient(150, 60, 0, 150, 60, 640);
  stops.forEach((stop, index) => gradient.addColorStop(index / (stops.length - 1), stop));
  context.fillStyle = gradient;
  context.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  backgroundTexture.needsUpdate = true;
};

const scene = new THREE.Scene();
scene.background = backgroundTexture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

const base = new THREE.IcosahedronGeometry(1, 0);
base.deleteAttribute('normal');
base.deleteAttribute('uv');
const geometry = mergeVertices(base);
const positionAttribute = geometry.getAttribute('position');
const directions = Array.from({ length: positionAttribute.count }, (_, index) =>
  new THREE.Vector3().fromBufferAttribute(positionAttribute, index).normalize());
const colorAttribute = new THREE.BufferAttribute(new Float32Array(directions.length * 3), 3);
geometry.setAttribute('color', colorAttribute);

const material = new THREE.MeshPhysicalMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.35,
  metalness: 0.1,
  clearcoat: 1,
  clearcoatRoughness: 0.2,
  emissive: 0x220044,
  emissiveIntensity: 0.5
});

const crystal = new THREE.Mesh(geometry, material);
crystal.rotation.z = 0.25;
scene.add(crystal);

scene.add(new THREE.HemisphereLight(0x8a7dff, 0x4a1070, 1.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(-3, 4, 5);
scene.add(keyLight);
const cyanLight = new THREE.PointLight(0x40e0ff, 40);
const pinkLight = new THREE.PointLight(0xff40d0, 40);
scene.add(cyanLight, pinkLight);

const samplePalette = (palette, t) => {
  const position = t * (palette.length - 1);
  const index = Math.min(Math.floor(position), palette.length - 2);
  return new THREE.Color(palette[index]).lerp(new THREE.Color(palette[index + 1]), position - index);
};

const pickPalette = () => {
  paletteIndex = (paletteIndex + 1 + Math.floor(Math.random() * (palettes.length - 1))) % palettes.length;
  return palettes[paletteIndex];
};

const paintShape = (positions, palette) => {
  const axis = new THREE.Vector3().randomDirection();
  return {
    positions,
    colors: directions.map(direction => samplePalette(palette, (direction.dot(axis) + 1) / 2))
  };
};

const randomShape = palette => {
  const stretch = new THREE.Vector3(randFloat(0.8, 1.05), randFloat(1.15, 1.6), randFloat(0.8, 1.05));
  return paintShape(directions.map(direction => direction.clone()
    .multiplyScalar(randFloat(0.7, 1.2))
    .add(new THREE.Vector3().randomDirection().multiplyScalar(randFloat(0, 0.2)))
    .multiply(stretch)), palette);
};

const current = {
  positions: directions.map(() => new THREE.Vector3()),
  colors: directions.map(() => new THREE.Color())
};
const snapshot = () => ({
  positions: current.positions.map(position => position.clone()),
  colors: current.colors.map(color => color.clone())
});

const shifted = new THREE.Color();
const settings = {
  rotateX: 0,
  rotateY: 0,
  speed: 1,
  hue: 0,
  drift: 0.35,
  colors: palettes[0],
  background: ['#000000', '#161616', '#333333']
};
paintBackground(settings.background);
const target = { rotateX: 0, rotateY: 0 };
const written = {};
let baseSpeed = 1;
let speedBoost = 0;
let lastPointer;
let writeSettings = () => {};

const formatSetting = value => Array.isArray(value)
  ? `[${value.map(color => `'${color}'`).join(', ')}]`
  : value.toFixed(2);

const isPalette = value => Array.isArray(value) && value.length >= 2 &&
  value.every(color => typeof color === 'string' && CSS.supports('color', color));

const setCrystal = params => {
  Object.entries(params).forEach(([key, value]) => {
    if (!(key in settings)) return;
    if (Array.isArray(settings[key]) ? !isPalette(value) : typeof value !== 'number') return;
    if (formatSetting(value) === written[key]) return;
    if (key === 'colors') {
      if (formatSetting(value) !== formatSetting(settings.colors)) startMorph(crystalTime, [...value]);
    } else if (key === 'background') {
      settings.background = [...value];
      paintBackground(settings.background);
    } else if (key === 'speed') {
      baseSpeed = value;
      speedBoost = 0;
    } else if (key === 'hue' || key === 'drift') {
      settings[key] = value;
    } else {
      target[key] = value;
    }
  });
};

const updateSettings = delta => {
  const blend = 1 - Math.exp(-delta / 0.25);
  settings.rotateX += (target.rotateX - settings.rotateX) * blend;
  settings.rotateY += (target.rotateY - settings.rotateY) * blend;
  speedBoost = speedBoost < 0.005 ? 0 : speedBoost * Math.exp(-delta / 0.8);
  settings.speed = Math.max(0, baseSpeed + speedBoost);
};

let from = randomShape(settings.colors);
let to = from;
let morphStart = 0;

const startMorph = (now, palette) => {
  from = snapshot();
  settings.colors = palette ?? pickPalette();
  to = palette ? paintShape(from.positions, palette) : randomShape(settings.colors);
  morphStart = now;
};

const updateShape = now => {
  if (now - morphStart > MORPH_SECONDS + HOLD_SECONDS) startMorph(now);
  const progress = smoothstep(clamp((now - morphStart) / MORPH_SECONDS, 0, 1), 0, 1);
  current.positions.forEach((position, index) => {
    position.lerpVectors(from.positions[index], to.positions[index], progress);
    positionAttribute.setXYZ(index, position.x, position.y, position.z);
  });
  current.colors.forEach((color, index) => {
    color.lerpColors(from.colors[index], to.colors[index], progress);
    shifted.copy(color).offsetHSL(settings.hue, 0, 0);
    colorAttribute.setXYZ(index, shifted.r, shifted.g, shifted.b);
  });
  positionAttribute.needsUpdate = true;
  colorAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
};

const resize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  renderer.setSize(width, height, false);
  camera.aspect = aspect;
  camera.position.z = aspect < 0.8 ? 4.6 / aspect : 5.8;
  camera.updateProjectionMatrix();
};
resize();

const bounds = new THREE.Box3();

const placeCrystal = elapsed => {
  crystal.position.set(0, 0, 0);
  crystal.scale.setScalar(1);
  crystal.updateMatrixWorld();
  bounds.setFromObject(crystal, true);
  const distance = camera.position.z - bounds.max.z;
  const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (1 - VIEWPORT_MARGIN);
  const halfWidth = halfHeight * camera.aspect;
  const top = window.innerWidth <= MOBILE_BREAKPOINT ? halfHeight * (1 - 2 * MOBILE_TEXT_AREA) : halfHeight;
  const centerY = (top - halfHeight) / 2;
  const halfRegion = (top + halfHeight) / 2;
  const scale = Math.min(
    1,
    halfWidth / Math.max(-bounds.min.x, bounds.max.x),
    halfRegion / Math.max(-bounds.min.y, bounds.max.y)
  );
  crystal.scale.setScalar(scale);
  crystal.position.set(
    clamp(Math.sin(elapsed * 0.09) * halfWidth * settings.drift, -halfWidth - bounds.min.x * scale, halfWidth - bounds.max.x * scale),
    centerY + clamp(Math.sin(elapsed * 0.13 + 1) * halfRegion * settings.drift * 0.7, -halfRegion - bounds.min.y * scale, halfRegion - bounds.max.y * scale),
    0
  );
};

const clock = new THREE.Clock();
let crystalTime = 0;
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  updateSettings(delta);
  crystalTime += delta * settings.speed;
  updateShape(crystalTime);
  crystal.rotation.set(
    settings.rotateX + Math.sin(crystalTime * 0.2) * 0.3,
    settings.rotateY + crystalTime * 0.15,
    0.25
  );
  placeCrystal(clock.elapsedTime);
  cyanLight.color.setHex(0x40e0ff).offsetHSL(settings.hue, 0, 0);
  pinkLight.color.setHex(0xff40d0).offsetHSL(settings.hue, 0, 0);
  cyanLight.position.set(Math.cos(crystalTime * 0.3) * 4, 2.5, Math.sin(crystalTime * 0.3) * 4);
  pinkLight.position.set(-Math.cos(crystalTime * 0.23) * 4, -2.5, -Math.sin(crystalTime * 0.23) * 4);
  writeSettings();
  renderer.render(scene, camera);
});

window.addEventListener('pointerdown', event => {
  if (event.target.closest('.CodeMirror, textarea, a')) return;
  startMorph(crystalTime);
});

window.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  const x = clamp(event.clientX / window.innerWidth, 0, 1);
  const y = clamp(event.clientY / window.innerHeight, 0, 1);
  if (lastPointer) {
    const distance = Math.hypot(x - lastPointer.x, y - lastPointer.y);
    speedBoost = Math.min(speedBoost + distance * 6, 5);
    settings.hue = (settings.hue + distance * 0.15) % 1;
  }
  lastPointer = { x, y };
  target.rotateX = (y - 0.5) * Math.PI * 0.6;
  target.rotateY = (x - 0.5) * Math.PI;
});

if (typeof Hydra === 'function') {
  hydraCanvas.width = window.innerWidth * PIXEL_RATIO;
  hydraCanvas.height = window.innerHeight * PIXEL_RATIO;
  const hydra = new Hydra({
    canvas: hydraCanvas,
    width: window.innerWidth * PIXEL_RATIO,
    height: window.innerHeight * PIXEL_RATIO,
    detectAudio: false
  });
  s0.init({ src: threeCanvas, dynamic: true }, { min: 'linear', mag: 'linear' });

  window.addEventListener('resize', () => {
    resize();
    hydra.setResolution(window.innerWidth * PIXEL_RATIO, window.innerHeight * PIXEL_RATIO);
    s0.init({ src: threeCanvas, dynamic: true }, { min: 'linear', mag: 'linear' });
  });

  const editor = window.flyerEditor;
  const getCode = () => editor ? editor.getValue() : source.value;
  const settingPattern = /^(\s*)(rotateX|rotateY|speed|hue|drift|colors|background): (-?\d*\.?\d+|\[[^\]]*\])(,?)\s*$/;
  let runTimer;
  let editPending = false;

  if (editor) {
    writeSettings = () => {
      if (editPending) return;
      const changed = Object.keys(settings).filter(key => formatSetting(settings[key]) !== written[key]);
      if (!changed.length) return;
      editor.operation(() => {
        for (let index = 0; index < editor.lineCount(); index++) {
          const text = editor.getLine(index);
          const match = text.match(settingPattern);
          if (!match || !changed.includes(match[2])) continue;
          written[match[2]] = formatSetting(settings[match[2]]);
          const line = `${match[1]}${match[2]}: ${written[match[2]]}${match[4]}`;
          if (line !== text) {
            editor.replaceRange(line, { line: index, ch: 0 }, { line: index, ch: text.length }, 'controls');
          }
        }
      });
    };
  }

  const runCode = () => {
    editPending = false;
    try {
      new Function('crystal', getCode())(setCrystal);
    } catch (error) {
      console.warn(error);
    }
  };

  const handleEdit = () => {
    editPending = true;
    clearTimeout(runTimer);
    runTimer = setTimeout(runCode, 400);
  };

  if (editor) {
    editor.on('changes', (_, changes) => {
      if (!changes.every(change => change.origin === 'controls')) handleEdit();
    });
  } else {
    source.addEventListener('input', handleEdit);
  }

  runCode();
} else {
  threeCanvas.id = 'hydra-canvas';
  hydraCanvas.replaceWith(threeCanvas);
  source.closest('main').hidden = true;
  window.addEventListener('resize', resize);
}

requestAnimationFrame(() => requestAnimationFrame(() => {
  document.getElementById('hydra-canvas').classList.add('is-ready');
}));
