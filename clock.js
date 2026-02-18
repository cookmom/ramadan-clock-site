import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ── CONTAINER MODE ──
// If window._clockContainer is set, render into that element instead of fullscreen
const CONTAINER = window._clockContainer || null;
const CONTAINED = !!CONTAINER;
if(CONTAINED) console.log('[clock] CONTAINED mode, container:', CONTAINER.clientWidth, 'x', CONTAINER.clientHeight);

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
const DIALS = {
  tennis: {bg:0x68b890, lume:0xf0f0e8, hand:0xf0f0e8, sec:0xffffff, text:'#f0f0e8', surah:'Ar-Raḥmān'},       // pistachio sorbet
  white:  {bg:0xe8e4dc, lume:0xd4708c, hand:0xd4708c, sec:0xd4708c, text:'#d4708c', surah:'An-Nūr'},           // Nurjaan's dial — white + rose pink everything
  salmon: {bg:0xd8988c, lume:0xf8f0ec, hand:0xf8f0ec, sec:0xffffff, text:'#f8f0ec', surah:'Ash-Shams'},        // peach sorbet
  slate:  {bg:0x585860, lume:0xe8e0c8, hand:0xd0d0d4, sec:0xff6633, text:'#e8e0c8', surah:'Al-Layl'},          // grey + cream + orange sec — the anchor
  sky:    {bg:0x82b8d8, lume:0xf0f4f8, hand:0xf0f4f8, sec:0xffffff, text:'#f0f4f8', surah:'Al-Burūj'},         // blueberry sorbet
  kawthar:{bg:0xf2dce0, lume:0xc88898, hand:0xc88898, sec:0xc88898, text:'#9a6878', surah:'Al-Kawthar'},        // strawberry + rose gold
  dhuha:  {bg:0xf08040, lume:0xffffff, hand:0xffffff, sec:0xffffff, text:'#ffffff', surah:'Aḍ-Ḍuḥā'},           // bright orange sorbet
  najm:   {bg:0x384870, lume:0xe0e8f4, hand:0xe0e8f4, sec:0xffffff, text:'#e0e8f4', surah:'An-Najm'},          // blueberry sorbet — softer midnight
  qamar:  {bg:0xc0c4cc, lume:0x2a2a30, hand:0x1a1a20, sec:0x2a4070, text:'#2a2a30', surah:'Al-Qamar'},         // silver — the neutral
  ward:   {bg:0xd89098, lume:0xf8f0f0, hand:0xf8f0f0, sec:0xffffff, text:'#f8f0f0', surah:'Al-Wāqiʿah'},       // raspberry sorbet
  lilas:  {bg:0x8878a8, lume:0xf0ecf4, hand:0xf0ecf4, sec:0xffffff, text:'#f0ecf4', surah:'Al-Mulk'},           // lavender sorbet
  rainbow:{bg:0x1a1a1a, lume:0xc8a878, hand:0xc8a878, sec:0xc8a878, text:'#c8a878', surah:'Al-Insān', bezel:true}, // Rolex Rainbow — black dial + rose gold
};
// Night lume palettes — modeled after real SuperLuminova variants
// Each matches the daytime lume character but amplified for glow
const NIGHT_LUME = {
  tennis: { emissive: 0x88ff30 },  // C1 — vivid green, gardens glowing at night
  white:  { emissive: 0xffa0c0 },  // Nurjaan — soft rose pink lume
  salmon: { emissive: 0xffc070 },  // Old radium — warm amber, sunset afterglow
  slate:  { emissive: 0xc8e8a0 },  // C3 — classic green-cream, the iconic lume
  sky:    { emissive: 0x80d0ff },  // BGW9 — ice blue constellations
  kawthar:{ emissive: 0xffa0c0 },  // Soft pink glow
  dhuha:  { emissive: 0xffc040 },  // Warm golden sunrise
  najm:   { emissive: 0x90b8ff },  // Cool stellar blue
  qamar:  { emissive: 0xe8f0ff },  // Bright ice-silver moonbeam
  ward:   { emissive: 0xff80a8 },  // Warm rose glow
  lilas:  { emissive: 0xc090ff },  // Purple lume
  rainbow:{ emissive: 0xf0d8a0 },  // Warm champagne
};
const DIAL_NAMES = Object.keys(DIALS);
const ARABIC = ['١٢','١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١'];

// ── Lateef Arabic numeral glyph paths (extracted via opentype.js, centered at origin) ──
// Keys: twelve(12), two(2), four_roman(4/IV), eight_roman(8/VIII), ten(10) — NOMOS Campus layout with Roman at 4 & 8
const NUMERAL_PATHS = {"four_roman":{"a":"IV","w":75.55,"h":52.49,"c":[["M",-37.78,26.24],["L",-37.78,-26.24],["L",-24.24,-26.24],["L",-24.24,26.24],["L",-37.78,26.24],["Z"],["M",2.2,26.24],["L",-17.24,-26.24],["L",-3.64,-26.24],["L",10.28,12.5],["L",24.17,-26.24],["L",37.78,-26.24],["L",18.33,26.24],["L",2.2,26.24],["Z"]]},"eight_roman":{"a":"VIII","w":129.09,"h":52.49,"c":[["M",-45.11,26.24],["L",-64.55,-26.24],["L",-50.94,-26.24],["L",-37.02,12.5],["L",-23.13,-26.24],["L",-9.53,-26.24],["L",-28.97,26.24],["L",-45.11,26.24],["Z"],["M",-2.57,26.24],["L",-2.57,-26.24],["L",10.97,-26.24],["L",10.97,26.24],["L",-2.57,26.24],["Z"],["M",24.22,26.24],["L",24.22,-26.24],["L",37.76,-26.24],["L",37.76,26.24],["L",24.22,26.24],["Z"],["M",51.01,26.24],["L",51.01,-26.24],["L",64.55,-26.24],["L",64.55,26.24],["L",51.01,26.24],["Z"]]},"twelve":{"a":"١٢","w":35.37,"h":39.76,"c":[["M",-17.68,-10.42],["L",-17.68,-10.42],["L",-15.54,-19.88],["Q",-9.35,-11.87,-7.1,-1.86],["Q",-4.85,8.14,-7.56,19.88],["L",-7.56,19.88],["L",-8.09,19.88],["Q",-8.37,11.76,-10.51,3.9],["Q",-12.66,-3.96,-17.68,-10.42],["Z"],["M",17.16,-19.35],["L",17.68,-19.35],["Q",17.68,-15.56,16.66,-12.43],["Q",15.64,-9.3,13.83,-7.44],["Q",12.02,-5.57,9.67,-5.57],["L",9.67,-5.57],["Q",7.84,-5.57,5.84,-6.84],["L",5.84,-6.84],["L",4.04,-15.35],["Q",5.06,-13.66,6.5,-12.78],["Q",7.95,-11.9,9.53,-11.9],["L",9.53,-11.9],["Q",11.74,-11.9,13.85,-13.71],["Q",15.96,-15.52,17.16,-19.35],["L",17.16,-19.35],["Z"],["M",-1.2,-10.42],["L",-1.2,-10.42],["L",0.95,-19.88],["Q",7.14,-11.87,9.39,-1.86],["Q",11.64,8.14,8.93,19.88],["L",8.93,19.88],["L",8.4,19.88],["Q",8.12,11.76,5.98,3.9],["Q",3.83,-3.96,-1.2,-10.42],["Z"]]},"two":{"a":"٢","w":18.88,"h":39.76,"c":[["M",8.91,-19.35],["L",9.44,-19.35],["Q",9.44,-15.56,8.42,-12.43],["Q",7.4,-9.3,5.59,-7.44],["Q",3.78,-5.57,1.42,-5.57],["L",1.42,-5.57],["Q",-0.4,-5.57,-2.41,-6.84],["L",-2.41,-6.84],["L",-4.2,-15.35],["Q",-3.18,-13.66,-1.74,-12.78],["Q",-0.3,-11.9,1.28,-11.9],["L",1.28,-11.9],["Q",3.5,-11.9,5.61,-13.71],["Q",7.72,-15.52,8.91,-19.35],["L",8.91,-19.35],["Z"],["M",-9.44,-10.42],["L",-9.44,-10.42],["L",-7.29,-19.88],["Q",-1.11,-11.87,1.14,-1.86],["Q",3.39,8.14,0.69,19.88],["L",0.69,19.88],["L",0.16,19.88],["Q",-0.12,11.76,-2.27,3.9],["Q",-4.41,-3.96,-9.44,-10.42],["Z"]]},"four":{"a":"٤","w":19.23,"h":38.43,"c":[["M",9.62,13.34],["L",9.62,13.34],["L",7.86,19.21],["Q",6.98,19.11,5.08,18.67],["Q",3.18,18.23,0.9,17.54],["Q",-1.39,16.86,-3.5,16.01],["Q",-5.61,15.17,-6.96,14.24],["Q",-8.31,13.31,-8.31,12.39],["L",-8.31,12.39],["Q",-8.31,11.23,-7.28,9.58],["Q",-6.24,7.93,-4.9,6.29],["Q",-3.57,4.66,-2.53,3.45],["Q",-1.49,2.23,-1.49,1.92],["L",-1.49,1.92],["Q",-1.49,1.49,-2.72,1],["Q",-3.96,0.51,-5.55,-0.14],["Q",-7.15,-0.79,-8.38,-1.6],["Q",-9.62,-2.41,-9.62,-3.46],["L",-9.62,-3.46],["Q",-9.62,-4.59,-8.6,-6.5],["Q",-7.58,-8.42,-5.94,-10.6],["Q",-4.31,-12.78,-2.5,-14.75],["Q",-0.69,-16.72,0.95,-17.96],["Q",2.58,-19.21,3.6,-19.21],["L",3.6,-19.21],["L",1.85,-11.87],["Q",0.02,-11.72,-1.83,-10.86],["Q",-3.67,-10,-4.9,-9.02],["Q",-6.13,-8.03,-6.13,-7.54],["L",-6.13,-7.54],["Q",-6.13,-7.01,-4.68,-6.42],["Q",-3.22,-5.82,-1.3,-5.1],["Q",0.62,-4.38,2.07,-3.5],["Q",3.53,-2.62,3.53,-1.49],["L",3.53,-1.49],["Q",3.53,-0.83,2.44,0.47],["Q",1.35,1.78,-0.07,3.29],["Q",-1.49,4.8,-2.58,6.12],["Q",-3.67,7.44,-3.67,8.17],["L",-3.67,8.17],["Q",-3.67,8.91,-2.2,9.7],["Q",-0.72,10.49,1.49,11.23],["Q",3.71,11.97,5.92,12.52],["Q",8.14,13.06,9.62,13.34],["Z"]]},"eight":{"a":"٨","w":25.42,"h":38.95,"c":[["M",-0.47,-19.48],["L",-0.47,-19.48],["L",0.05,-19.48],["Q",1.39,-8.05,4.9,-0.12],["Q",8.42,7.8,12.71,11.99],["L",12.71,11.99],["L",11.65,19.48],["Q",8.31,16.14,6.06,12.55],["Q",3.81,8.96,2.27,4.38],["Q",0.72,-0.21,-0.58,-6.47],["L",-0.58,-6.47],["L",-0.4,-6.54],["Q",-1.53,-0.11,-2.9,4.68],["Q",-4.27,9.46,-6.54,13.03],["Q",-8.81,16.59,-12.71,19.48],["L",-12.71,19.48],["L",-11.65,11.99],["Q",-8.35,9.18,-6.01,4.17],["Q",-3.67,-0.84,-2.27,-7.01],["Q",-0.86,-13.18,-0.47,-19.48],["Z"]]},"ten":{"a":"١٠","w":25.91,"h":39.76,"c":[["M",-12.96,-10.42],["L",-12.96,-10.42],["L",-10.81,-19.88],["Q",-4.62,-11.87,-2.37,-1.86],["Q",-0.12,8.14,-2.83,19.88],["L",-2.83,19.88],["L",-3.36,19.88],["Q",-3.64,11.76,-5.78,3.9],["Q",-7.93,-3.96,-12.96,-10.42],["Z"],["M",8.28,-3.74],["L",8.28,-3.74],["Q",8.56,-3.74,9.32,-3.11],["Q",10.07,-2.48,10.92,-1.58],["Q",11.76,-0.69,12.36,0.11],["Q",12.96,0.9,12.96,1.21],["L",12.96,1.21],["Q",12.96,1.53,12.38,2.36],["Q",11.79,3.18,10.97,4.11],["Q",10.14,5.04,9.39,5.7],["Q",8.63,6.35,8.28,6.35],["L",8.28,6.35],["Q",8,6.35,7.24,5.7],["Q",6.49,5.04,5.63,4.15],["Q",4.76,3.25,4.15,2.43],["Q",3.53,1.6,3.53,1.28],["L",3.53,1.28],["Q",3.53,0.9,4.15,0.09],["Q",4.76,-0.72,5.63,-1.62],["Q",6.49,-2.51,7.24,-3.13],["Q",8,-3.74,8.28,-3.74],["Z"]]}};

// Convert opentype path commands → Three.js Shapes
// Arabic glyphs have multiple separate strokes — each is its own shape, NOT holes.
// Holes only exist when one contour is CW inside a CCW contour (or vice versa).
function pathToShapes(pathData, scale) {
  const contours = [];
  let pts = [];
  for (const cmd of pathData.c) {
    switch(cmd[0]) {
      case 'M':
        if (pts.length > 2) contours.push(pts);
        pts = [{x: cmd[1]*scale, y: -cmd[2]*scale}];
        break;
      case 'L':
        pts.push({x: cmd[1]*scale, y: -cmd[2]*scale});
        break;
      case 'Q': {
        // Approximate quadratic bezier with line segments
        const prev = pts[pts.length-1];
        for (let t = 0.25; t <= 1; t += 0.25) {
          const mt = 1-t;
          pts.push({
            x: mt*mt*prev.x + 2*mt*t*(cmd[1]*scale) + t*t*(cmd[3]*scale),
            y: mt*mt*prev.y + 2*mt*t*(-cmd[2]*scale) + t*t*(-cmd[4]*scale)
          });
        }
        break;
      }
      case 'C': {
        const prev = pts[pts.length-1];
        for (let t = 0.2; t <= 1; t += 0.2) {
          const mt = 1-t;
          pts.push({
            x: mt*mt*mt*prev.x + 3*mt*mt*t*(cmd[1]*scale) + 3*mt*t*t*(cmd[3]*scale) + t*t*t*(cmd[5]*scale),
            y: mt*mt*mt*prev.y + 3*mt*mt*t*(-cmd[2]*scale) + 3*mt*t*t*(-cmd[4]*scale) + t*t*t*(-cmd[6]*scale)
          });
        }
        break;
      }
      case 'Z':
        if (pts.length > 2) contours.push(pts);
        pts = [];
        break;
    }
  }
  if (pts.length > 2) contours.push(pts);
  
  // Compute signed area for each contour (positive = CCW, negative = CW)
  const measured = contours.map(pts => {
    let area = 0;
    for (let j = 0; j < pts.length; j++) {
      const k = (j+1) % pts.length;
      area += pts[j].x * pts[k].y - pts[k].x * pts[j].y;
    }
    return { pts, area: area/2 };
  }).filter(m => Math.abs(m.area) > 0.5); // skip degenerate
  
  if (!measured.length) return [];
  
  // Simple approach: all contours become independent shapes
  // (Arabic numerals don't have traditional holes like Latin 'O' or '4')
  return measured.map(m => {
    const shape = new THREE.Shape();
    shape.moveTo(m.pts[0].x, m.pts[0].y);
    for (let i = 1; i < m.pts.length; i++) {
      shape.lineTo(m.pts[i].x, m.pts[i].y);
    }
    shape.closePath();
    return shape;
  });
}

// URL params
const _P = new URLSearchParams(location.search);
const EMBED = _P.has('embed') || CONTAINED;
let currentDial = (_P.get('dial') && DIALS[_P.get('dial')]) ? _P.get('dial') : 'slate';
const NIGHT_START = _P.has('night');
let modeBlend = NIGHT_START ? 1 : 0, modeTarget = NIGHT_START ? 1 : 0;
let _lastBgHex = '';
let PD = null;
function pM(s){if(!s)return 0;const[h,m]=s.split(':').map(Number);return h*60+m;}

// ══════════════════════════════════════════
// RENDERER — direct render, no post-processing
// ══════════════════════════════════════════
let W = CONTAINED ? CONTAINER.clientWidth : window.innerWidth;
let H = CONTAINED ? CONTAINER.clientHeight : window.innerHeight;
const R = 80; // world-space radius

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference:'high-performance', alpha: EMBED && !NIGHT_START && !CONTAINED });
renderer.samples = 4;
renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, CONTAINED ? 2 : 1), 2));
renderer.setSize(W, H);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.825;
renderer.outputColorSpace = THREE.SRGBColorSpace;
(CONTAINED ? CONTAINER : document.body).appendChild(renderer.domElement);
if(CONTAINED) {
  renderer.domElement.style.cssText='width:100%;height:100%;display:block';
  console.log('[clock] canvas appended, size:', W, 'x', H, 'pixelRatio:', renderer.getPixelRatio());
}

// ── Grain normal map — proper PBR surface grain (not CSS overlay) ──
// Sobel-derived normal map from bauhaus vermicular texture
let _grainNormalTex = null;
new THREE.TextureLoader().load('grain-normal-512.png', (t) => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4); // 512px tiled 4x = fine isotropic sandblast grain
  _grainNormalTex = t;
  console.log('[clock] grain normal map loaded');
  if (typeof buildAll === 'function') try { buildAll(); } catch(e) {}
});

let _grainRoughnessTex = null;
new THREE.TextureLoader().load('grain-roughness-512.png', (t) => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  _grainRoughnessTex = t;
});

const scene = new THREE.Scene();

// ── Perspective camera (slight top-down angle for depth)
// Adjust camera distance based on aspect ratio so clock fits both portrait and landscape
const aspect = W/H;
const camZ = 280;
const cam = new THREE.PerspectiveCamera(32, aspect, 1, 2000);
cam.position.set(0, -3, camZ);
cam.lookAt(0, 0, 0);

// ══════════════════════════════════════════
// BLOOM POST-PROCESSING
// ══════════════════════════════════════════
// Bloom — full resolution, with adaptive fallback if GPU process OOMs
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(W, H),
  0.0,   // strength — will animate with modeBlend
  0.4,   // radius — soft spread
  0.85   // threshold — only bright emissives bloom
);
composer.addPass(bloomPass);
let _bloomFailed = false; // fallback if GPU OOM kills framebuffers
let _bloomRetryAt = 0;    // timestamp to retry bloom after failure

// ══════════════════════════════════════════
// LIGHTING — NOMOS-style watch photography
// Low-intensity HDRI for hand reflections. Env rotates with tilt.
// Dial stays calm (BasicMaterial). Hands catch sweeping softbox light.
// ══════════════════════════════════════════
const { RectAreaLightUniformsLib } = await import('three/addons/lights/RectAreaLightUniformsLib.js');
RectAreaLightUniformsLib.init();

// ── Studio HDRI at controlled intensity ──
let studioEnvMap;
{
  const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const hdrTex = await new Promise((resolve, reject) => {
    new RGBELoader().load('studio.hdr', resolve, undefined, reject);
  });
  const envRT = pmrem.fromEquirectangular(hdrTex);
  studioEnvMap = envRT.texture;
  scene.environment = studioEnvMap;
  scene.environmentIntensity = 1.0; // grain needs env light to be visible through normal map
  scene.environmentRotation = new THREE.Euler(0.15, 2.8, 0); // start offset — softbox pre-positioned for hand reflections at rest
  hdrTex.dispose();
  pmrem.dispose();
}

// Ambient — minimal shadow fill
const ambLight = new THREE.AmbientLight(0xffffff, 0.12);
scene.add(ambLight);

// Key light — soft rect from upper-left (warm, even illumination)
const keyLight = new THREE.RectAreaLight(0xfff8f0, 2.5, 300, 300);
keyLight.position.set(-80, 180, 250);
keyLight.lookAt(0, 0, 0);
scene.add(keyLight);

// Strip light — narrow rect for hand specular streaks
const stripLight = new THREE.RectAreaLight(0xffffff, 4.0, 20, 200);
stripLight.position.set(40, 80, 200);
stripLight.lookAt(0, 0, 0);
scene.add(stripLight);

// Spec point — accent highlight on hands, boosted
const specPoint = new THREE.PointLight(0xffffff, 6, 350, 2);
specPoint.position.set(30, 60, 180);
scene.add(specPoint);

// Counter spec — opposite warmth for depth
const counterSpec = new THREE.PointLight(0xfff0e0, 1.5, 400, 2);
counterSpec.position.set(-40, -30, 200);
scene.add(counterSpec);

// Raking light — grazing angle across dial to reveal grain texture
const rakeLight = new THREE.DirectionalLight(0xffffff, 3.0);
rakeLight.position.set(-150, 40, 20); // very low z = strong grazing angle across dial face
scene.add(rakeLight);

// Subdial spot — wider cone for glass sparkle, boosted
const subSpot = new THREE.SpotLight(0xffffff, 20, 400, Math.PI/8, 0.5, 1.5);
subSpot.position.set(5, -R*0.5 + 20, 150);
subSpot.target.position.set(0, -R*0.5, 0);
scene.add(subSpot);
scene.add(subSpot.target);


// ══════════════════════════════════════════
// MATERIALS (PBR)
// ══════════════════════════════════════════

// ── Procedural grain texture (NOMOS-style sandblasted dial finish) ──
// Generates a roughness map with fine per-pixel noise so the dial
// responds subtly to tilt as HDRI sweeps across the micro-texture.
function makeGrainTexture(size = 512, baseVal = 235, spread = 20) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.max(0, Math.min(255, baseVal + (Math.random() - 0.5) * spread));
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2); // tile for finer grain
  return tex;
}
const dialGrainTex = makeGrainTexture(512, 235, 20);     // standard dials: high roughness grain
const metalGrainTex = makeGrainTexture(256, 140, 15);    // qamar/kawthar: subtler, lower roughness grain

// ── Procedural bump map for applied numerals ──
// Renders numeral outlines to a canvas, used as bumpMap to fake depth
function makeNumeralBumpMap(numerals, font, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  // Numerals will be painted white = raised
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const R = size * 0.42; // numeral ring radius
  const cx = size / 2, cy = size / 2;
  const positions = { // hour -> angle (0=12 o'clock, clockwise)
    12: 0, 2: 60, 10: 300, // Arabic numerals
    // 4 (IV) and 8 (VIII) handled as Roman — skip for bump (they're separate meshes)
  };
  ctx.font = `bold ${size * 0.09}px Inter, sans-serif`;
  for (const [hour, angleDeg] of Object.entries(positions)) {
    const a = (angleDeg - 90) * Math.PI / 180;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R;
    ctx.fillText(hour.toString(), x, y);
  }
  // Roman numerals
  ctx.font = `${size * 0.07}px Inter, sans-serif`;
  const romans = { 'VIII': 240, 'IV': 120 };
  for (const [text, angleDeg] of Object.entries(romans)) {
    const a = (angleDeg - 90) * Math.PI / 180;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R;
    ctx.fillText(text, x, y);
  }
  // Stick markers at odd hours (1,3,5,7,9,11)
  const stickHours = [1, 3, 5, 7, 9, 11];
  for (const h of stickHours) {
    if (h === 6) continue; // subdial
    const a = (h * 30 - 90) * Math.PI / 180;
    const inner = R - size * 0.03;
    const outer = R + size * 0.015;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = size * 0.006;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
const numeralBumpTex = makeNumeralBumpMap();

// ── Procedural NOMOS-style sandblasted dial texture ──
// Reference: NOMOS Campus closeup shows uniform fine-grain matte finish.
// Sandblasted/galvanized surface — tiny random micro-bumps that scatter
// light evenly, giving that velvety matte quality.
function makeDialTextures() {
  const sz = 1024;
  const nCvs = document.createElement('canvas'); nCvs.width = nCvs.height = sz;
  const nCtx = nCvs.getContext('2d');
  const nData = nCtx.createImageData(sz, sz);
  const rCvs = document.createElement('canvas'); rCvs.width = rCvs.height = sz;
  const rCtx = rCvs.getContext('2d');
  const rData = rCtx.createImageData(sz, sz);
  
  let seed = 42;
  function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }
  
  for (let i = 0; i < sz * sz; i++) {
    const idx = i * 4;
    const nx = (rand() - 0.5) * 0.10;
    const ny = (rand() - 0.5) * 0.10;
    nData.data[idx]     = Math.floor((nx + 0.5) * 255);
    nData.data[idx + 1] = Math.floor((ny + 0.5) * 255);
    nData.data[idx + 2] = 255;
    nData.data[idx + 3] = 255;
    
    const rv = 0.88 + rand() * 0.06;
    const rvByte = Math.floor(rv * 255);
    rData.data[idx] = rvByte;
    rData.data[idx + 1] = rvByte;
    rData.data[idx + 2] = rvByte;
    rData.data[idx + 3] = 255;
  }
  
  nCtx.putImageData(nData, 0, 0);
  rCtx.putImageData(rData, 0, 0);
  
  const normalMap = new THREE.CanvasTexture(nCvs);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(4, 4);
  
  const roughnessMap = new THREE.CanvasTexture(rCvs);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(4, 4);
  
  return { normalMap, roughnessMap };
}
const dialTextures = makeDialTextures();

function dialMat(color) {
  const cd = currentDial;
  const special = {
    kawthar: { roughness:0.6, metalness:0.15, sheen:0.8, sheenColor:0xd4909a, sheenRoughness:0.3, clearcoat:0.6, clearcoatRoughness:0.3 },
    qamar:   { roughness:0.35, metalness:0.4, sheen:0, sheenColor:0x000000, sheenRoughness:0.8, clearcoat:0.2, clearcoatRoughness:0.2 },
  };
  // metalness 0.6 + roughness 0.45 = semi-metallic that shows grain in specular breakup
  const s = special[cd] || { roughness:0.45, metalness:0.6, sheen:0, sheenColor:0x000000, sheenRoughness:0.8, clearcoat:0.15, clearcoatRoughness:0.3 };
  // Dial = PBR with NOMOS galvanized/sandblasted finish
  // Grain via proper normal map (Sobel-derived from vermicular texture) + roughness map
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: s.roughness,
    metalness: s.metalness,
    clearcoat: s.clearcoat,
    clearcoatRoughness: s.clearcoatRoughness,
    // Grain normal map for micro-surface detail
    normalMap: _grainNormalTex || dialTextures.normalMap,
    normalScale: new THREE.Vector2(2.0, 2.0),
    // Roughness variation — catches light differently across grain
    roughnessMap: _grainRoughnessTex || dialTextures.roughnessMap,
  });
  if (s.sheen > 0) { m.sheen = s.sheen; m.sheenColor = new THREE.Color(s.sheenColor); m.sheenRoughness = s.sheenRoughness; }
  m.envMapIntensity = 1.5; // high — grain needs strong env reflection to be visible
  return m;
}
function metalMat(color) {
  const precious = ['kawthar','dhuha','qamar','rainbow'].includes(currentDial);
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: precious ? 0.02 : 0.04,
    metalness: 1.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.02,
    reflectivity: 1.0,
    ior: 2.33,
  });
  m.envMapIntensity = precious ? 4.0 : 3.5;
  return m;
}
// Brushed aluminum — directional anisotropic highlights along hand length
function brushedHandMat(color) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color).lerp(new THREE.Color(0xD6D6D6), 0.3), // aluminum tint
    roughness: 0.33,        // brushed aluminum: split the difference
    metalness: 1.0,
    anisotropy: 0.8,        // strong directional brushing
    anisotropyRotation: 0,  // brushing along hand length (Y axis)
    clearcoat: 0.15,        // subtle protective coat
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    polygonOffset: true,     // prevent z-fighting with lume channel
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  m.envMapIntensity = 2.15;
  return m;
}
function lumeMat(color) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.0, emissive: color, emissiveIntensity: 0 }); m.envMapIntensity = 0; return m; // lume = paint, no reflections
}
function secMat(color) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.4, emissive: color, emissiveIntensity: 0 }); m.envMapIntensity = 3.0; return m; // second hand — glossy lacquer finish
}

// ══════════════════════════════════════════
// GEOMETRY HELPERS
// ══════════════════════════════════════════
function extrudedPill(w, h, depth) {
  const s = new THREE.Shape();
  const r = w/2;
  s.moveTo(-r, -h/2+r); s.quadraticCurveTo(-r,-h/2, 0,-h/2);
  s.quadraticCurveTo(r,-h/2, r,-h/2+r); s.lineTo(r,h/2-r);
  s.quadraticCurveTo(r,h/2, 0,h/2); s.quadraticCurveTo(-r,h/2, -r,h/2-r);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled:true, bevelThickness:0.3, bevelSize:0.2, bevelSegments:2 });
}

function extrudedLeaf(len, maxW, tailLen, depth, baseScale=1.0) {
  const s = new THREE.Shape(), hw=maxW/2, bw=hw*baseScale;
  s.moveTo(-bw*0.5, -tailLen);
  s.quadraticCurveTo(-bw, len*0.15, -bw, len*0.3);
  s.quadraticCurveTo(-hw*0.25, len*0.75, 0, len);
  s.quadraticCurveTo(hw*0.25, len*0.75, bw, len*0.3);
  s.quadraticCurveTo(bw, len*0.15, bw*0.5, -tailLen);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled:true, bevelThickness:0.4, bevelSize:0.3, bevelSegments:3 });
}

// NOMOS Club Campus hands — straight parallel baton, tiny pointed tip
function nomosHand(len, baseW, tailLen, depth) {
  const s = new THREE.Shape();
  const hw = baseW / 2;
  const tipStart = len * 0.96;  // parallel for 96%, point only at very end
  s.moveTo(-hw * 0.55, -tailLen);
  s.lineTo(-hw, 0);
  s.lineTo(-hw, tipStart);       // perfectly straight parallel sides
  s.lineTo(0, len);              // short sharp point
  s.lineTo(hw, tipStart);
  s.lineTo(hw, 0);
  s.lineTo(hw * 0.55, -tailLen);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.15, bevelSegments: 2 });
}

// Lume channel — thin recessed center strip, parallel like the hand
function nomosLume(len, baseW, depth) {
  const s = new THREE.Shape();
  const hw = baseW * 0.22;
  const startY = len * 0.12;
  const endY = len * 0.93;
  s.moveTo(-hw, startY);
  s.lineTo(-hw, endY);
  s.lineTo(hw, endY);
  s.lineTo(hw, startY);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false });
}

function makeTextSprite(text, font, size, color) {
  const dpr = 3;
  const w = size*Math.max(text.length,1)*1.3, h = size*1.6;
  const cv = document.createElement('canvas');
  cv.width = w*dpr; cv.height = h*dpr;
  const ctx = cv.getContext('2d');
  ctx.font = font.replace(/(\d+)px/,(_,n)=>(n*dpr)+'px');
  ctx.fillStyle = color;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, cv.width/2, cv.height/2);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({map:tex, transparent:true, depthTest:false});
  const sp = new THREE.Sprite(mat);
  sp.scale.set(w, h, 1);
  return sp;
}

// ══════════════════════════════════════════
// GYROSCOPE PARALLAX
// ══════════════════════════════════════════
let gx=0, gy=0, tgx=0, tgy=0;
let gyroGranted = false;
function initGyro(){
  if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
    // iOS 13+: requires explicit permission via user gesture
    async function requestGyro(){
      if(gyroGranted) return;
      try {
        const s = await DeviceOrientationEvent.requestPermission();
        if(s==='granted'){
          gyroGranted=true;
          window.addEventListener('deviceorientation',onG);
          console.log('[gyro] iOS permission granted');
        } else {
          console.log('[gyro] iOS permission denied:', s);
        }
      } catch(err) {
        console.log('[gyro] iOS permission error:', err);
      }
    }
    // Attach to both click and touchend — covers all iOS gestures
    document.addEventListener('click', requestGyro, {once:false});
    document.addEventListener('touchend', requestGyro, {once:false});
    // Also try immediately in case already granted from a previous session
    DeviceOrientationEvent.requestPermission().then(s=>{
      if(s==='granted'){
        gyroGranted=true;
        window.addEventListener('deviceorientation',onG);
        console.log('[gyro] iOS already granted');
      }
    }).catch(()=>{}); // Expected to fail without gesture — that's fine
  } else if(typeof DeviceOrientationEvent!=='undefined') {
    // Android + non-iOS — just listen
    window.addEventListener('deviceorientation',onG);
    // Verify events actually fire
    let gotEvent = false;
    function checkGyro(e) {
      if(!gotEvent && e.gamma !== null) {
        gotEvent = true;
        console.log('[gyro] Events firing, gamma:', e.gamma);
      }
    }
    window.addEventListener('deviceorientation', checkGyro);
  }
  window.addEventListener('mousemove',e=>{tgx=((e.clientX/W)-0.5)*2;tgy=((e.clientY/H)-0.5)*2;});
}
// gyro debug removed
function onG(e){
  if(e.gamma===null)return;
  // gyro logging removed
  // Auto-calibrate: first few readings establish the user's natural hold angle
  if(!window._gyroCal) { window._gyroCal = { samples:[], done:false }; }
  if(!window._gyroCal.done) {
    window._gyroCal.samples.push({ g: e.gamma, b: e.beta });
    if(window._gyroCal.samples.length >= 15) {
      const avg = window._gyroCal.samples.reduce((a,s) => ({ g:a.g+s.g, b:a.b+s.b }), {g:0,b:0});
      window._gyroCal.restGamma = avg.g / window._gyroCal.samples.length;
      window._gyroCal.restBeta = avg.b / window._gyroCal.samples.length;
      window._gyroCal.done = true;
      console.log('[gyro] Calibrated rest position — gamma:', window._gyroCal.restGamma.toFixed(1), 'beta:', window._gyroCal.restBeta.toFixed(1));
    }
    return; // don't move until calibrated
  }
  const cal = window._gyroCal;
  tgx=Math.max(-1,Math.min(1,((e.gamma||0) - cal.restGamma)/25));
  tgy=Math.max(-1,Math.min(1,((e.beta||0) - cal.restBeta)/25));
  // Compass heading for qibla
  if(e.webkitCompassHeading !== undefined) {
    targetCompassHeading = e.webkitCompassHeading;
    hasCompassData = true;
  } else if(e.alpha !== null) {
    targetCompassHeading = (360 - e.alpha) % 360;
    hasCompassData = true;
  }
}
initGyro();

// ══════════════════════════════════════════
// BUILD CLOCK
// ══════════════════════════════════════════
// Background plane (fills screen, matches dial color)
// Background surround plane — flush with dial face, hole cut for gap
let isFullscreen = false;
let CLOCK_SCALE = CONTAINED ? 0.95 : (EMBED ? 0.65 : 0.50);
const bgCutoutR = R * 1.12 * CLOCK_SCALE; // flush with dial edge, no gap
// Background plane — MeshBasicMaterial (unlit) so it always matches scene.background exactly
const bgPlaneMat = new THREE.MeshBasicMaterial({ color: 0x18181e });
const bgShape = new THREE.Shape();
bgShape.moveTo(-5000, -5000); bgShape.lineTo(5000, -5000); bgShape.lineTo(5000, 5000); bgShape.lineTo(-5000, 5000); bgShape.closePath();
const bgHole = new THREE.Path();
bgHole.absarc(0, 0, bgCutoutR, 0, Math.PI*2, true);
bgShape.holes.push(bgHole);
const bgPlaneGeo = new THREE.ShapeGeometry(bgShape, 64);
const bgPlane = new THREE.Mesh(bgPlaneGeo, bgPlaneMat);
bgPlane.position.z = -3 * CLOCK_SCALE; // flush with dial front face in world space
if(!EMBED || NIGHT_START || CONTAINED) scene.add(bgPlane);
if(EMBED && !NIGHT_START && !CONTAINED) { renderer.setClearColor(0x000000, 0); }

// Fullscreen API for landing page
window._clockSetFullscreen = function(on, snapNight) {
  isFullscreen = on;
  if(on) {
    CLOCK_SCALE = 0.50;
    // No bgPlane in fullscreen — scene.background fills the screen seamlessly
    if(scene.children.includes(bgPlane)) scene.remove(bgPlane);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
  } else {
    CLOCK_SCALE = 0.95;
    // Snap day/night blend instantly on exit — no lerp
    if(snapNight !== undefined) { modeTarget = snapNight ? 1 : 0; modeBlend = modeTarget; }
    if(!scene.children.includes(bgPlane)) scene.add(bgPlane);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
  }
  // Update bgPlane cutout
  const newCutoutR = R * 1.12 * CLOCK_SCALE;
  bgPlane.position.z = -3 * CLOCK_SCALE;
  clockGroup.scale.setScalar(CLOCK_SCALE);
  onResize();
  buildAll();
};

const clockGroup = new THREE.Group(); // everything lives here for parallax
clockGroup.scale.setScalar(CLOCK_SCALE);
scene.add(clockGroup);

// Dial face
let dialMesh;
let dialLowerMesh;
const DIAL_THICKNESS = 0.5; // thin disc — no more cutout walls clipping hands
const DIAL_GAP = 0.5; // minimal gap — thin disc means no visible cutout walls
let cutoutR = R*0.38;
let mainCrystalMesh = null;
function buildDial() {
  if(dialMesh) clockGroup.remove(dialMesh);
  if(dialLowerMesh) clockGroup.remove(dialLowerMesh);
  if(mainCrystalMesh) clockGroup.remove(mainCrystalMesh);
  
  const subY = -R*0.5;
  cutoutR = R*0.38;
  
  // Lower disc — solid, darker, recessed
  const lowerGeo = new THREE.CylinderGeometry(caseR, caseR, DIAL_THICKNESS, 128);
  const lowerColor = new THREE.Color(DIALS[currentDial].bg).multiplyScalar(0.75);
  const lowerMat = new THREE.MeshBasicMaterial({color:lowerColor}); // unlit // recessed dial — barely there
  dialLowerMesh = new THREE.Mesh(lowerGeo, lowerMat);
  dialLowerMesh.rotation.x = Math.PI/2;
  dialLowerMesh.position.z = -(DIAL_THICKNESS/2 + DIAL_GAP + DIAL_THICKNESS);
  dialLowerMesh.receiveShadow = true;
  clockGroup.add(dialLowerMesh);
  
  // Upper disc — flat circle with subdial cutout
  const dialShape = new THREE.Shape();
  dialShape.absarc(0, 0, caseR, 0, Math.PI*2, false);
  // Cut hole for subdial
  const holePath = new THREE.Path();
  holePath.absarc(0, subY, cutoutR, 0, Math.PI*2, true);
  dialShape.holes.push(holePath);
  const geo = new THREE.ShapeGeometry(dialShape, 128);
  dialMesh = new THREE.Mesh(geo, dialMat(DIALS[currentDial].bg));
  dialMesh.position.z = 0; // flat at origin
  clockGroup.add(dialMesh);
  
  // Main crystal removed — caused visible edge ring on mobile
}

// Case ring removed — using dial circle edge only
const caseR = R * 1.12;

// ── Scroll indicator disc (landing page only) ──
let scrollIndicator = null;
let scrollIndicatorTarget = 0; // 0=home (12 o'clock), -1=hidden
let scrollIndicatorCurrent = {x:0, y:0, opacity:0};
const SCROLL_HOUR_MAP = [0, 1, 2, 3, 4, 5, 7]; // sections → hour positions (skip 6=subdial)

function buildScrollIndicator() {
  if(scrollIndicator) { clockGroup.remove(scrollIndicator); scrollIndicator=null; }
  if(!CONTAINED) return; // only on landing page
  const c = DIALS[currentDial];
  const dotR = R * 0.022;
  console.log('[clock] buildScrollIndicator, target:', scrollIndicatorTarget, 'CONTAINED:', CONTAINED);
  const geo = new THREE.CircleGeometry(dotR, 16);
  const lumeCol = c.lume || c.hand;
  const mat = new THREE.MeshStandardMaterial({
    color: lumeCol, roughness: 0.3, metalness: 0.4,
    emissive: lumeCol, emissiveIntensity: modeBlend > 0.3 ? 1.5 : 0.3,
    transparent: true, opacity: 1
  });
  mat.envMapIntensity = 0.2;
  scrollIndicator = new THREE.Mesh(geo, mat);
  scrollIndicator.position.z = 4; // above markers
  const trackR = R * 0.72;
  const hourPos = SCROLL_HOUR_MAP[scrollIndicatorTarget] ?? 0;
  const ang = Math.PI/2 - (hourPos/12) * Math.PI * 2;
  const sx = scrollIndicatorCurrent.x || Math.cos(ang) * trackR;
  const sy = scrollIndicatorCurrent.y || Math.sin(ang) * trackR;
  scrollIndicator.position.x = sx;
  scrollIndicator.position.y = sy;
  scrollIndicator.material.opacity = scrollIndicatorCurrent.opacity ?? 1;
  clockGroup.add(scrollIndicator);
}

function updateScrollIndicator() {
  if(!scrollIndicator) return;
  const trackR = R * 0.72;
  let targetOpacity = 0;
  let tx = scrollIndicatorCurrent.x, ty = scrollIndicatorCurrent.y;
  if(scrollIndicatorTarget >= 0) {
    const hourPos = SCROLL_HOUR_MAP[scrollIndicatorTarget] ?? scrollIndicatorTarget;
    const ang = Math.PI/2 - (hourPos/12) * Math.PI * 2;
    tx = Math.cos(ang) * trackR;
    ty = Math.sin(ang) * trackR;
    targetOpacity = 1;
  }
  scrollIndicatorCurrent.x = tx;
  scrollIndicatorCurrent.y = ty;
  scrollIndicatorCurrent.opacity = targetOpacity;
  scrollIndicator.position.x = scrollIndicatorCurrent.x;
  scrollIndicator.position.y = scrollIndicatorCurrent.y;
  scrollIndicator.material.opacity = scrollIndicatorCurrent.opacity;
  const lumeGlow = modeBlend > 0.3 ? 1.5 : 0.3;
  scrollIndicator.material.emissiveIntensity = lumeGlow + Math.sin(Date.now()*0.003)*0.15;
}

// Hour markers (extruded pills — actual 3D)
let markerMeshes = [], lumeMeshes = [];
function buildMarkers() {
  markerMeshes.forEach(m=>clockGroup.remove(m));
  lumeMeshes.forEach(m=>clockGroup.remove(m));
  markerMeshes=[]; lumeMeshes=[];
  
  const c = DIALS[currentDial];
  const isKawthar = currentDial === 'kawthar';
  const isRainbow = currentDial === 'rainbow';
  
  for(let i=0;i<60;i++){
    const ang = Math.PI/2 - (i/60)*Math.PI*2; // CW from 12
    const isHour = i%5===0;
    const hourIdx = i/5;
    // Skip 6 o'clock (qibla cutout) for hour markers
    const isNumeralPos = isHour && [0,2,4,6,8,10].includes(hourIdx);
    
    if(isKawthar) {
      // ── KAWTHAR: playful — chunky pastel circles, each hour its own color ──
      if(isHour && hourIdx !== 6) {
        const dotR = (hourIdx === 0) ? R*0.065 : R*0.05;
        const depth = 3;
        // Chunky rose gold candy buttons
        const geo = new THREE.CylinderGeometry(dotR, dotR, depth, 32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: c.hand, roughness: 0.1, metalness: 0.8,
          clearcoat: 0.8, clearcoatRoughness: 0.1,
          emissive: c.hand, emissiveIntensity: 0
        });
        const mesh = new THREE.Mesh(geo, mat);
        const midR = R * 0.85;
        mesh.position.x = Math.cos(ang)*midR;
        mesh.position.y = Math.sin(ang)*midR;
        mesh.position.z = depth/2;
        mesh.rotation.x = Math.PI/2;
        clockGroup.add(mesh); markerMeshes.push(mesh);
        mesh.userData.kawtharButton = true;
        lumeMeshes.push(mesh); // they all glow at night
      } else if(!isHour) {
        // Simple small dots — rose gold
        const geo = new THREE.CircleGeometry(0.6, 10);
        const mat = new THREE.MeshStandardMaterial({
          color: c.lume, roughness: 0.12, metalness: 0.5,
          emissive: c.lume, emissiveIntensity: 0
        }); mat.envMapIntensity = 3.0; // applied markers — polished metal, visible tilt response
        const mesh = new THREE.Mesh(geo, mat);
        const midR = R * 0.95;
        mesh.position.x = Math.cos(ang)*midR;
        mesh.position.y = Math.sin(ang)*midR;
        mesh.position.z = 1.5;
        clockGroup.add(mesh); markerMeshes.push(mesh);
      }
    } else if(isRainbow) {
      // ── RAINBOW: sorbet gem minute markers — every minute gets a pastel gem ──
      const hue = (i/60);
      const gemColor = new THREE.Color().setHSL(hue, 0.55, 0.72); // sorbet: lower sat, higher lightness
      const isH = isHour && (i/5) !== 6;
      const bW = isH ? R*0.04 : R*0.025;
      const bH = isH ? R*0.09 : R*0.04;
      const depth = isH ? 3 : 2;
      const geo = new THREE.BoxGeometry(bW, bH, depth);
      const mat = new THREE.MeshPhysicalMaterial({
        color: gemColor, roughness: 0.08, metalness: 0.0,
        clearcoat: 1.0, clearcoatRoughness: 0.03,
        transmission: 0.15, thickness: 1.5, ior: 1.77,
        emissive: gemColor, emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      const midR = isH ? R*0.87 : R*0.93;
      mesh.position.x = Math.cos(ang)*midR;
      mesh.position.y = Math.sin(ang)*midR;
      mesh.position.z = depth/2;
      mesh.rotation.z = ang + Math.PI/2;
      clockGroup.add(mesh); markerMeshes.push(mesh);
      lumeMeshes.push(mesh);
    } else {
      // ── STANDARD: tick marks + rectangular hour markers ──
      // Always draw a minute tick
      {
        const tH=R*0.036, tW=0.675, depth=1.5;
        const geo = new THREE.BoxGeometry(tW, tH, depth);
        const mat = lumeMat(c.lume); // minute ticks = lume paint (SuperLuminova)
        const mesh = new THREE.Mesh(geo, mat);
        const midR = (R - R*0.04 - tH/2) * 1.03;
        mesh.position.x = Math.cos(ang)*midR;
        mesh.position.y = Math.sin(ang)*midR;
        mesh.position.z = 2;
        mesh.rotation.z = ang + Math.PI/2;
        clockGroup.add(mesh);
        markerMeshes.push(mesh);
        lumeMeshes.push(mesh); // glow at night
      }
      // Also draw hour marker at non-numeral hour positions
      // NOMOS proportion: applied metal base + lume top (two-layer index)
      if(isHour && !isNumeralPos){
        const mH=R*0.16, mW=R*0.03, depth=3;
        const midR = (R - R*0.04 - mH/2) * 0.92;
        const px = Math.cos(ang)*midR, py = Math.sin(ang)*midR;
        // Layer 1: wider lume base plate
        const baseGeo = new THREE.BoxGeometry(mW*1.6, mH*1.05, depth*0.5);
        const baseMesh = new THREE.Mesh(baseGeo, lumeMat(c.lume));
        baseMesh.position.set(px, py, depth*0.3);
        baseMesh.rotation.z = ang + Math.PI/2;
        baseMesh.castShadow = true;
        clockGroup.add(baseMesh); markerMeshes.push(baseMesh);
        lumeMeshes.push(baseMesh);
        // Layer 2: lume on top
        const lumeGeo = new THREE.BoxGeometry(mW, mH, depth*0.6);
        const lumeMesh = new THREE.Mesh(lumeGeo, lumeMat(c.lume));
        lumeMesh.position.set(px, py, depth*0.5 + 0.5);
        lumeMesh.rotation.z = ang + Math.PI/2;
        clockGroup.add(lumeMesh); markerMeshes.push(lumeMesh);
        lumeMeshes.push(lumeMesh);
      }
    }
  }
}

// Arabic numerals — extruded 3D geometry (real depth, NOMOS-quality applied)
let numeralSprites = [];
let numeralMats = [];
const NUMERAL_KEY_MAP = {0:'twelve', 2:'two', 4:'four', 8:'eight', 10:'ten'};
const EXTRUDE_DEPTH = 3; // depth of extruded numerals — matches hand height

function buildNumerals() {
  numeralSprites.forEach(s=>clockGroup.remove(s));
  numeralSprites=[]; numeralMats=[];
  if(currentDial === 'kawthar' || currentDial === 'rainbow') return; // special marker dials — no numerals
  const c = DIALS[currentDial];
  const NUMERAL_POS = [0,2,4,8,10]; // 12, 2, 4, 8, 10 (no 6 — qibla)
  const targetH = R * 0.16; // NOMOS proportion — compact, not dominant
  
  for(const i of NUMERAL_POS){
    const key = NUMERAL_KEY_MAP[i];
    const pd = NUMERAL_PATHS[key];
    if (!pd) continue;
    
    const ang = Math.PI/2 - (i/12)*Math.PI*2; // CW from 12
    const r = R - R*0.18; // numeral ring radius
    const maxW = R * 0.22; // max numeral width to prevent overflow
    const scaleH = targetH / pd.h;
    const scaleW = maxW / pd.w;
    const scale = Math.min(scaleH, scaleW); // fit within both constraints
    
    const shapes = pathToShapes(pd, scale);
    if (!shapes.length) continue;
    
    const extrudeSettings = {
      depth: EXTRUDE_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.15,
      bevelOffset: 0,
      bevelSegments: 3,
    };
    
    const geo = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
    geo.computeVertexNormals();
    
    // Same lume paint finish as minute markers (SuperLuminova)
    const faceMat = lumeMat(c.lume);
    
    const nx = Math.cos(ang) * r, ny = Math.sin(ang) * r;
    
    // Center geometry at its visual midpoint for proper two-layer alignment
    geo.computeBoundingBox();
    const gbb = geo.boundingBox;
    const gcx = (gbb.max.x + gbb.min.x) / 2;
    const gcy = (gbb.max.y + gbb.min.y) / 2;
    geo.translate(-gcx, -gcy, 0);
    
    // Layer 1: lume base — clone, scale 110% from center, sits behind
    const baseGeo = geo.clone();
    const baseFaceMat = lumeMat(c.lume);
    const baseMesh = new THREE.Mesh(baseGeo, baseFaceMat);
    baseMesh.position.set(nx, ny, 3.3);
    baseMesh.scale.setScalar(1.1);
    baseMesh.castShadow = true;
    clockGroup.add(baseMesh);
    numeralSprites.push(baseMesh);
    numeralMats.push(baseFaceMat);
    
    // Layer 2: lume on top
    const mesh = new THREE.Mesh(geo, faceMat);
    mesh.position.set(nx, ny, 3.5);
    clockGroup.add(mesh);
    numeralSprites.push(mesh);
    numeralMats.push(faceMat);
  }
}

// Brand text — "A GIFT OF TIME" extruded 3D, two-layer metal+lume like numerals
let brandMeshes = [];
let brandLumeMats = [];
let _brandFont = null;
const _brandFontP = import('three/addons/loaders/FontLoader.js').then(({FontLoader})=>{
  return new Promise(resolve=>{
    new FontLoader().load('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_regular.typeface.json', f=>{
      _brandFont=f; resolve(f);
      // Rebuild brand text now that font is available
      try { buildBrandText(); } catch(e) { console.warn('brand rebuild:', e); }
    }, undefined, ()=>resolve(null));
  });
});

function buildBrandText() {
  brandMeshes.forEach(m => clockGroup.remove(m));
  brandMeshes = []; brandLumeMats = [];
  if(currentDial === 'rainbow') return;
  if(!_brandFont) return;
  
  const c = DIALS[currentDial];
  
  // Canvas-based text rendering — supports Arabic glyphs with proper RTL/shaping
  function makeCanvasLine(text, fontSpec, yPos, planeW, planeH, alpha) {
    const dpr = 3;
    const cW = 512, cH = 128;
    const cvs = document.createElement('canvas');
    cvs.width = cW * dpr; cvs.height = cH * dpr;
    const ctx = cvs.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cW, cH);
    
    // Use lume color for text
    const lumeCol = '#' + new THREE.Color(c.lume).getHexString();
    ctx.fillStyle = lumeCol;
    ctx.globalAlpha = alpha !== undefined ? alpha : 1;
    ctx.font = fontSpec;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cW / 2, cH / 2);
    
    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(planeW, planeH);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
      side: THREE.FrontSide
    });
    mat._isBrandTex = true; // flag for night mode color updates
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, yPos, 4);
    clockGroup.add(mesh);
    brandMeshes.push(mesh);
    // Store canvas+ctx for night mode redraws
    mesh.userData.brandCanvas = { cvs, ctx, text, fontSpec, alpha, cW, cH, dpr };
    brandLumeMats.push(mat);
  }
  
  const pw = R * 1.2; // plane width
  // Main: Arabic brand name — هدية الوقت (A Gift of Time)
  makeCanvasLine('هدية الوقت', "600 52px 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif", R * 0.33, pw, pw * 0.25, 1);
  
  // Arched subtitle: "AGIFTOFTIME.APP" below 6 o'clock (like NOMOS "MADE IN GERMANY")
  // Use individual letter sprites placed along a world-space arc — no canvas mapping issues
  {
    const text = 'AGIFTOFTIME.APP';
    const lumeCol = new THREE.Color(c.lume);
    // Arc center = dial center (0,0), radius outside minute markers
    const arcCX = 0, arcCY = 0;
    const arcRadius = R * 1.02; // outside minute markers, near dial rim
    const totalAngle = 0.55; // radians — tighter arc
    // Letters arc along bottom of dial, reading left-to-right
    // At 6 o'clock (bottom): first letter on the LEFT side, last on the RIGHT
    // Angles: 0=right, π/2=top, π=left, -π/2=bottom (standard math)
    // Left of 6 o'clock = angles between -π/2 and -π (3rd quadrant)
    // Right of 6 o'clock = angles between -π/2 and 0 (4th quadrant)
    // Sweep from left (-π/2 - half) to right (-π/2 + half) = clockwise visually
    const midAngle = -Math.PI / 2; // 6 o'clock
    const startAngle = midAngle - totalAngle / 2; // left of 6
    
    for (let i = 0; i < text.length; i++) {
      const t = text.length === 1 ? 0.5 : i / (text.length - 1);
      const ang = startAngle + t * totalAngle; // sweep left-to-right (increasing angle)
      const wx = arcCX + Math.cos(ang) * arcRadius;
      const wy = arcCY + Math.sin(ang) * arcRadius;
      
      // Tiny canvas per letter
      const dpr = 3;
      const cS = 64;
      const cvs = document.createElement('canvas');
      cvs.width = cS * dpr; cvs.height = cS * dpr;
      const ctx = cvs.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#' + lumeCol.getHexString();
      ctx.globalAlpha = 0.45;
      ctx.font = "700 28px Inter, system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text[i], cS / 2, cS / 2);
      
      const tex = new THREE.CanvasTexture(cvs);
      const sz = R * 0.06;
      const geo = new THREE.PlaneGeometry(sz, sz);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wx, wy, 4);
      // Rotate letter to follow arc tangent
      mesh.rotation.z = ang + Math.PI / 2; // tops point outward — standard bottom-arc watch text
      clockGroup.add(mesh);
      brandMeshes.push(mesh);
      mesh.userData.brandLetter = { cvs, ctx, ch: text[i], cS, dpr };
      brandLumeMats.push(mat);
    }
  }
}

// Hands (NOMOS Club Campus sword style — real 3D with lume channel)
let hourGroup, minGroup, secGroup;
let hourMat_, minMat_, secMat_, hLumeMat_, mLumeMat_;

function buildHands() {
  if(hourGroup) clockGroup.remove(hourGroup);
  if(minGroup) clockGroup.remove(minGroup);
  if(secGroup) clockGroup.remove(secGroup);
  
  const c = DIALS[currentDial];
  
  // Hour — NOMOS Club Campus sword hand (slimmed to match reference)
  hourGroup = new THREE.Group();
  const hL=R*0.72, hW=R*0.064, hT=R*0.035, hD=4;
  const hGeo = nomosHand(hL, hW, hT, hD);
  hourMat_ = brushedHandMat(c.hand);
  const hMesh = new THREE.Mesh(hGeo, hourMat_);
  hMesh.castShadow = true;
  hourGroup.add(hMesh);
  // Lume channel recessed into hand
  const hlGeo = nomosLume(hL, hW, hD);
  hLumeMat_ = lumeMat(c.lume);
  const hlMesh = new THREE.Mesh(hlGeo, hLumeMat_);
  hlMesh.position.z = 4.5; // above hand body top face (depth=4) to prevent z-fighting
  hourGroup.add(hlMesh);
  hourGroup.position.z = 15;
  clockGroup.add(hourGroup);
  
  // Minute — NOMOS Club Campus sword hand (slimmed to match reference)
  minGroup = new THREE.Group();
  const mL=R*0.9, mW=R*0.056, mT=R*0.05, mD=5;
  const mGeo = nomosHand(mL, mW, mT, mD);
  minMat_ = brushedHandMat(c.hand);
  const mMesh = new THREE.Mesh(mGeo, minMat_);
  mMesh.castShadow = true;
  minGroup.add(mMesh);
  const mlGeo = nomosLume(mL, mW, mD);
  mLumeMat_ = lumeMat(c.lume);
  const mlMesh = new THREE.Mesh(mlGeo, mLumeMat_);
  mlMesh.position.z = 5.5; // above hand body top face (depth=5) to prevent z-fighting
  minGroup.add(mlMesh);
  minGroup.position.z = 17;
  clockGroup.add(minGroup);
  
  // Second hand
  secGroup = new THREE.Group();
  const sL=R*0.96, sT=R*0.16, sD=2;
  const ss = new THREE.Shape();
  ss.moveTo(-0.5,-sT); ss.lineTo(-0.25,sL); ss.lineTo(0.25,sL); ss.lineTo(0.5,-sT); ss.closePath();
  const sGeo = new THREE.ExtrudeGeometry(ss,{depth:sD,bevelEnabled:true,bevelThickness:0.2,bevelSize:0.15,bevelSegments:1});
  secMat_ = secMat(c.sec);
  const sMesh = new THREE.Mesh(sGeo, secMat_);
  sMesh.castShadow = true;
  secGroup.add(sMesh);
  // Counterweight
  const cwGeo = new THREE.CylinderGeometry(R*0.015, R*0.015, sD+1, 16);
  const cwMesh = new THREE.Mesh(cwGeo, secMat_);
  cwMesh.rotation.x = Math.PI/2;
  cwMesh.position.y = -sT*0.55;
  secGroup.add(cwMesh);
  secGroup.position.z = 23;  // must clear minute hand (z=17 + depth 5 = z=22)
  clockGroup.add(secGroup);
  
  // Center cap (3D cylinder) — must sit ON TOP of all hands including second hand
  const capGeo = new THREE.CylinderGeometry(R*0.04, R*0.04, 8, 32);
  const capMesh = new THREE.Mesh(capGeo, brushedHandMat(c.hand));
  capMesh.rotation.x = Math.PI/2;
  capMesh.position.z = 26;  // above second hand (z=23 + depth 2 = z=25)
  capMesh.castShadow = true;
  clockGroup.add(capMesh);
  markerMeshes.push(capMesh); // for cleanup
}

// ══════════════════════════════════════════
// QIBLA ORBITAL COMPASS — Ressence-inspired
// ══════════════════════════════════════════
let qiblaGroup, qiblaRotor, qiblaInnerRotor;
let hasCompassData = false;
let compassHeading = 0, targetCompassHeading = 0;
let qiblaBearing = 0; // degrees from north
let qiblaAligned = false; // hysteresis state
let userLat = null, userLng = null;

// Kaaba coordinates
const KAABA_LAT = 21.4225, KAABA_LNG = 39.8262;

function calcQiblaBearing(lat, lng) {
  const φ1 = lat * Math.PI/180, φ2 = KAABA_LAT * Math.PI/180;
  const Δλ = (KAABA_LNG - lng) * Math.PI/180;
  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
  return ((Math.atan2(x, y) * 180/Math.PI) + 360) % 360;
}

function initQiblaLocation() {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      qiblaBearing = calcQiblaBearing(userLat, userLng);
    }, () => {
      // Fallback: LA
      userLat = 34.05; userLng = -118.24;
      qiblaBearing = calcQiblaBearing(userLat, userLng);
    });
  }
}
initQiblaLocation();

function buildQibla() {
  if(qiblaGroup) clockGroup.remove(qiblaGroup);
  qiblaGroup = new THREE.Group();
  qiblaGroup.position.y = -R*0.5;
  qiblaGroup.position.z = 0; // flush with dial — cutout prevents z-fighting
  
  const gaugeR = cutoutR - 1.5;
  const d = DIALS[currentDial];
  
  // Base disc — brushed metallic, subtle contrast from dial
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(d.bg).multiplyScalar(0.82),
    roughness: 0.35, metalness: 0.5,
    clearcoat: 0.4, envMapIntensity: 3.5,
    roughnessMap: metalGrainTex,
  });
  const baseDisc = new THREE.Mesh(new THREE.CircleGeometry(gaugeR, 64), baseMat);
  qiblaGroup.add(baseDisc);
  
  // ── Moon phase (Hijri calendar) ──
  // Ramadan 2026: Feb 17 – Mar 18 (approx)
  const RAMADAN_START = new Date(2026, 1, 17); // Feb 17
  const RAMADAN_DAYS = 30;
  const now = new Date();
  const dayOfRamadan = Math.max(0, Math.min(RAMADAN_DAYS, Math.floor((now - RAMADAN_START) / 86400000) + 1));
  const moonPhase = dayOfRamadan / RAMADAN_DAYS; // 0→1 over the month
  window._hijriMoonPhase = moonPhase;
  
  // Moon disc — bright circle
  const moonR = gaugeR * 0.42;
  const moonMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8f4e8, roughness: 0.6, metalness: 0.05,
    emissive: 0xf8f4e8, emissiveIntensity: 0.05,
    envMapIntensity: 0.1
  });
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(moonR, 64), moonMat);
  moonDisc.position.z = 0.1;
  qiblaGroup.add(moonDisc);
  
  // Shadow overlay — creates crescent shape via canvas texture
  const moonCv = document.createElement('canvas');
  moonCv.width = 256; moonCv.height = 256;
  const mCtx = moonCv.getContext('2d');
  const cx = 128, cy = 128, mr = 120;
  
  // Draw shadow side
  mCtx.fillStyle = 'rgba(0,0,0,0)';
  mCtx.clearRect(0, 0, 256, 256);
  
  // Hijri moon: day 1 = thin crescent (right lit), day 15 = full, day 29 = thin crescent (left lit)
  // Phase 0→0.5 = waxing (right to full), 0.5→1 = waning (full to left crescent)
  const p = moonPhase;
  mCtx.save();
  mCtx.beginPath();
  mCtx.arc(cx, cy, mr, 0, Math.PI*2);
  mCtx.clip();
  
  // Dark background (shadow)
  const bgCol = new THREE.Color(d.bg).multiplyScalar(0.5);
  mCtx.fillStyle = `rgb(${bgCol.r*255|0},${bgCol.g*255|0},${bgCol.b*255|0})`;
  mCtx.fillRect(0, 0, 256, 256);
  
  // Lit portion — draw as crescent/gibbous
  // p=0: new moon (dark), p=0.5: full moon, p=1: new moon again
  // Hijri month: day 1 ≈ thin crescent, day 15 ≈ full, day 29 ≈ thin crescent
  mCtx.fillStyle = '#f8f4e8';
  mCtx.beginPath();
  if(p <= 0.5) {
    // Waxing: right side grows from nothing to full
    const illum = p * 2; // 0→1
    // Right semicircle always lit
    mCtx.arc(cx, cy, mr, -Math.PI/2, Math.PI/2);
    // Terminator edge: controls how much of left side is lit/dark
    // illum 0→0.5: concave (crescent), 0.5→1: convex (gibbous)
    const termX = mr * (1 - illum * 2); // mr→-mr as illum 0→1
    mCtx.ellipse(cx, cy, Math.abs(termX), mr, 0, Math.PI/2, -Math.PI/2, illum < 0.5);
  } else {
    // Waning: left side shrinks from full to nothing
    const illum = (1 - p) * 2; // 1→0
    // Left semicircle always lit
    mCtx.arc(cx, cy, mr, Math.PI/2, -Math.PI/2);
    // Terminator
    const termX = mr * (1 - illum * 2);
    mCtx.ellipse(cx, cy, Math.abs(termX), mr, 0, -Math.PI/2, Math.PI/2, illum < 0.5);
  }
  mCtx.fill();
  mCtx.restore();
  
  // Soft edge
  const grad = mCtx.createRadialGradient(cx, cy, mr*0.9, cx, cy, mr);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,1)');
  mCtx.fillStyle = grad;
  mCtx.fillRect(0, 0, 256, 256);
  
  const moonTex = new THREE.CanvasTexture(moonCv);
  const moonOverlay = new THREE.Mesh(
    new THREE.CircleGeometry(moonR, 64),
    new THREE.MeshBasicMaterial({map: moonTex, transparent: true})
  );
  moonOverlay.position.z = 0.15;
  qiblaGroup.add(moonOverlay);
  
  // ── Fasting arc (Fajr → Maghrib daily progress) ──
  if(PD && PD.Fajr && PD.Maghrib) {
    const fajrMin = pM(PD.Fajr);
    const maghribMin = pM(PD.Maghrib);
    const nowMin = now.getHours()*60 + now.getMinutes();
    const fastDuration = maghribMin - fajrMin;
    const fastProgress = Math.max(0, Math.min(1, (nowMin - fajrMin) / fastDuration));
    
    // Fasting progress — placeholder removed, revisiting later
  }
  
  // Outer rotor — the main Ressence-style rotating disc
  qiblaRotor = new THREE.Group();
  qiblaRotor.position.z = 0.5;
  
  // Rotor disc — slightly smaller, different tone
  const rotorR = gaugeR - 2;
  const rotorMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(d.bg).multiplyScalar(0.75),
    roughness: 0.2, metalness: 0.6,
    clearcoat: 0.6, envMapIntensity: 3.0,
  });
  const rotorDisc = new THREE.Mesh(new THREE.CircleGeometry(rotorR, 64), rotorMat);
  qiblaRotor.add(rotorDisc);
  
  // Cardinal tick marks on rotor rim (N, E, S, W as subtle lines)
  const tickLen = gaugeR * 0.12;
  const tickW = 0.4;
  for(let i = 0; i < 4; i++) {
    const ang = (i/4) * Math.PI * 2; // 0=N(up), π/2=E, π=S, 3π/2=W
    const isNorth = i === 0;
    const tGeo = new THREE.BoxGeometry(tickW, isNorth ? tickLen*1.4 : tickLen, 0.3);
    const tColor = isNorth ? 0xf0f0f0 : new THREE.Color(d.lume).multiplyScalar(0.8);
    const tMat = new THREE.MeshPhysicalMaterial({
      color: tColor, roughness: 0.2, metalness: 0.3, envMapIntensity: 1.5
    });
    const tick = new THREE.Mesh(tGeo, tMat);
    const tr = rotorR - tickLen*0.55;
    tick.position.set(Math.sin(ang)*tr, Math.cos(ang)*tr, 0.2);
    tick.rotation.z = -ang;
    qiblaRotor.add(tick);
  }
  
  // 8 minor ticks (every 45°, skip cardinals)
  for(let i = 0; i < 8; i++) {
    if(i % 2 === 0) continue; // skip cardinals
    const ang = (i/8) * Math.PI * 2;
    const mtGeo = new THREE.BoxGeometry(0.3, tickLen*0.5, 0.2);
    const mtMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(d.lume).multiplyScalar(0.5),
      roughness: 0.3, metalness: 0.2, envMapIntensity: 1.0,
    });
    const mt = new THREE.Mesh(mtGeo, mtMat);
    const mtr = rotorR - tickLen*0.3;
    mt.position.set(Math.sin(ang)*mtr, Math.cos(ang)*mtr, 0.2);
    mt.rotation.z = -ang;
    qiblaRotor.add(mt);
  }
  
  qiblaGroup.add(qiblaRotor);
  
  // Subdial rings removed — clean subdial face
  window._subdialRings = [];
  
  // Inner rotor — smaller orbiting disc (Ressence double-orbit)
  qiblaInnerRotor = new THREE.Group();
  qiblaInnerRotor.position.z = 1;
  
  const innerR = gaugeR * 0.28;
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(d.bg).multiplyScalar(0.65),
    roughness: 0.08, metalness: 0.8,
    clearcoat: 0.8, envMapIntensity: 4.0,
  });
  const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(innerR, 48), innerMat);
  qiblaInnerRotor.add(innerDisc);
  
  // Qibla marker — NOMOS subdial hand: thin tapered needle + filled circle counterweight
  const needleLen = innerR * 1.25;
  const needleW = innerR * 0.05;
  const pipR = innerR * 0.1;          // small filled circle at tail
  const triLume = d.lume || d.hand;
  const triMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(triLume),
    roughness: 0.15, metalness: 0.5,
    emissive: new THREE.Color(triLume), emissiveIntensity: 0.15,
    envMapIntensity: 2.0,
  });
  // Tapered needle — gradual taper matching main hands
  const nhw = needleW / 2;
  const needleShape = new THREE.Shape();
  needleShape.moveTo(-nhw, 0);
  needleShape.lineTo(-nhw * 0.15, needleLen * 0.9);
  needleShape.lineTo(0, needleLen);
  needleShape.lineTo(nhw * 0.15, needleLen * 0.9);
  needleShape.lineTo(nhw, 0);
  needleShape.closePath();
  const needleGeo = new THREE.ExtrudeGeometry(needleShape, {depth:0.5, bevelEnabled:false});
  const triMesh = new THREE.Mesh(needleGeo, triMat);
  triMesh.position.set(0, 0, 0.3);
  qiblaInnerRotor.add(triMesh);
  // Filled circle counterweight at tail
  const pipGeo = new THREE.CylinderGeometry(pipR, pipR, 0.5, 24);
  const counterMesh = new THREE.Mesh(pipGeo, triMat);
  counterMesh.rotation.x = Math.PI / 2;
  counterMesh.position.set(0, -pipR * 2.5, 0.35);
  qiblaInnerRotor.add(counterMesh);
  window._qiblaTriMat = triMat;
  
  // Position inner rotor offset from center (orbiting)
  qiblaInnerRotor.position.y = gaugeR * 0.38;
  qiblaRotor.add(qiblaInnerRotor);
  
  clockGroup.add(qiblaGroup);
  
  // ── Glass sapphire crystal dome over subdial ──
  // Research: real sapphire crystal = IOR 1.77, very low roughness,
  // slight dispersion for chromatic aberration at edges,
  // transmission ~0.98 (nearly perfectly clear).
  // Key insight: don't use opacity — use transmission only.
  // opacity + transmission = muddy. transmission alone = physically correct.
  const glassR = cutoutR - 0.5;
  const glassDome = new THREE.SphereGeometry(
    glassR, 64, 32,
    0, Math.PI*2,
    0, Math.PI*0.12   // subtle dome (~22° cap) — watch crystal, not fishbowl
  );
  // ── Liquid Glass effect ──
  // Two-layer approach: transmission for devices that support it,
  // graceful fallback via low opacity + high env reflections.
  // Based on ektogamat/apple-liquid-glass (MIT) recipe.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.0,
    transmission: 0.95,    // near-full transmission
    thickness: 1.5,        // subtle refraction — don't obliterate subdial readability
    ior: 1.5,              // standard glass — more predictable across devices than 1.8
    dispersion: 3,         // moderate chromatic shimmer (not as aggressive as ektogamat's 12)
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,     // fallback: if transmission fails, opacity kicks in
    opacity: 0.15,         // very subtle — only visible if transmission doesn't work
    iridescence: 0.6,      // partial thin-film — subtle rainbow, not overpowering
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [200, 400],
    envMapIntensity: 3.0,
    specularIntensity: 1.5,
    specularColor: new THREE.Color(0xffffff),
  });
  const glassMesh = new THREE.Mesh(glassDome, glassMat);
  glassMesh.position.y = -R*0.5;
  glassMesh.position.z = 2;
  glassMesh.rotation.x = 0;
  glassMesh.renderOrder = 10;
  glassMesh.material.depthWrite = false;
  glassMesh.visible = true;
  clockGroup.add(glassMesh);
  bezelMeshes.push(glassMesh);
}

// Rebuild subdial every 60s to update fasting arc
let lastSubdialRebuild = 0;
function updateQibla() {
  if(!qiblaRotor) return;
  const now = Date.now();
  if(now - lastSubdialRebuild > 60000) { lastSubdialRebuild = now; buildQibla(); }
  // No compass → everything at rest on the 12-6 centerline
  if(!hasCompassData) {
    qiblaRotor.rotation.z += (0 - qiblaRotor.rotation.z) * 0.12;
    qiblaInnerRotor.rotation.z += (0 - qiblaInnerRotor.rotation.z) * 0.12;
    return;
  }
  
  // Smooth compass heading
  compassHeading += ((targetCompassHeading - compassHeading + 540) % 360 - 180) * 0.6;
  
  // Check alignment — hysteresis to prevent jitter (enter at 15°, exit at 25°)
  const qiblaOffset = ((qiblaBearing - compassHeading) % 360 + 360) % 360;
  const offDeg = Math.min(qiblaOffset, 360 - qiblaOffset);
  if(offDeg < 15) qiblaAligned = true;
  if(offDeg > 25) qiblaAligned = false;
  const aligned = qiblaAligned;
  
  // Outer rotor: compass direction — but eases to 0 when aligned so inner rotor
  // sits on the 12-6 centerline (triangle tip → 12, base → 6)
  const compassRad = -(compassHeading * Math.PI/180);
  const targetOuterRot = aligned ? 0 : compassRad;
  const snapSpeed = aligned ? 0.3 : 0.5;
  qiblaRotor.rotation.z += (targetOuterRot - qiblaRotor.rotation.z) * snapSpeed;
  
  // Inner rotor: triangle points toward Qibla relative to user
  // When aligned + outer eased to 0: inner rotation = 0 → triangle at exact 12
  const desiredWorld = aligned ? 0 : -(qiblaBearing - compassHeading) * Math.PI / 180;
  const targetInnerRot = desiredWorld - qiblaRotor.rotation.z;
  qiblaInnerRotor.rotation.z += (targetInnerRot - qiblaInnerRotor.rotation.z) * snapSpeed;
}

// Split-flap at 12 o'clock
let flapSprite, flapCanvas, flapTexture;
let flapPrevChars=[], flapCharAnims=[];
const FLAP_DUR=350, FLAP_STAGGER=60;

function buildFlap() {
  if(flapSprite) clockGroup.remove(flapSprite);
  const cw=1024, ch=384;
  flapCanvas=document.createElement('canvas');
  flapCanvas.width=cw; flapCanvas.height=ch;
  flapTexture=new THREE.CanvasTexture(flapCanvas);
  flapTexture.minFilter=THREE.LinearFilter;
  const geo=new THREE.PlaneGeometry(R*0.55, R*0.2);
  flapSprite=new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map:flapTexture,transparent:true,depthTest:false}));
  flapSprite.position.y=R*0.32;
  flapSprite.position.z=5;
  flapSprite.visible = false;
  clockGroup.add(flapSprite);
}

// Stars (Surah Yusuf 12:4) — 11 stars in a sujud (prostration) arc above the clock
// "I saw eleven stars and the sun and the moon — I saw them prostrating to me."
const STARS=[];
{
  // Arc from left to right above the clock, bowing downward (sujud toward the dial)
  const arcCenterY = R * 0.95;  // raised — outer stars near viewport edge
  const arcRadius = R * 0.7;    // wide spread
  const arcDepth = R * 0.12;    // concave bow — lowest point clears dial face
  for(let i = 0; i < 11; i++) {
    const t = i / 10; // 0 to 1
    const ang = Math.PI * 0.15 + t * Math.PI * 0.7; // ~27° to ~153° — spread across top
    const x = -Math.cos(ang) * arcRadius;
    const y = arcCenterY - Math.sin(ang) * arcDepth; // concave: middle stars bow DOWN toward dial
    const size = 0.55 + Math.sin(i * 1.7 + 0.5) * 0.2; // tiny twinkling points
    STARS.push({
      px: x, py: y,
      r: size,
      speed: 0.0008 + i * 0.00006,
      offset: i * 0.57,
      bright: 0.75 + Math.sin(i * 2.3) * 0.2
    });
  }
}
let starMeshes=[];
let moonGroup, moonMesh, moonGlowMesh;

function buildStars(){
  starMeshes.forEach(m=>scene.remove(m)); starMeshes=[];
  STARS.forEach(s=>{
    const m=new THREE.Mesh(new THREE.CircleGeometry(s.r, 16), new THREE.MeshBasicMaterial({color:0xfffff0, transparent:true, opacity:0}));
    m.position.x = s.px;
    m.position.y = s.py;
    m.position.z = -10; m.userData=s; scene.add(m); starMeshes.push(m);
  });
  
  // 3D Moon — rises during night transition
  if(moonGroup) scene.remove(moonGroup);
  moonGroup = new THREE.Group();
  
  const moonR = 4.5;
  
  // ── Procedural moon texture with craters + Hijri phase shadow ──
  const moonCvN = document.createElement('canvas');
  moonCvN.width = 256; moonCvN.height = 256;
  const mxN = moonCvN.getContext('2d');
  const mcx = 128, mcy = 128, mcr = 124;
  
  // Clip everything to circle — no debris outside the moon disc
  mxN.save();
  mxN.beginPath(); mxN.arc(mcx, mcy, mcr, 0, Math.PI*2); mxN.clip();
  
  // Base moon color — warm lunar grey
  mxN.fillStyle = '#e8e4d8';
  mxN.fillRect(0, 0, 256, 256);
  
  // Subtle surface variation (maria/highlands)
  const surfGrad = mxN.createRadialGradient(100, 90, 10, mcx, mcy, mcr);
  surfGrad.addColorStop(0, 'rgba(180,175,160,0.3)');
  surfGrad.addColorStop(0.5, 'rgba(200,195,180,0.15)');
  surfGrad.addColorStop(1, 'rgba(220,215,200,0)');
  mxN.fillStyle = surfGrad;
  mxN.beginPath(); mxN.arc(mcx, mcy, mcr, 0, Math.PI*2); mxN.fill();
  
  // Craters — seeded pseudo-random
  const craters = [
    {x:95, y:80, r:18, d:0.12},   // Tycho-like
    {x:155, y:105, r:22, d:0.10},  // Copernicus-like  
    {x:130, y:155, r:15, d:0.08},
    {x:75, y:135, r:12, d:0.10},
    {x:165, y:65, r:10, d:0.07},
    {x:110, y:60, r:8, d:0.09},
    {x:145, y:180, r:14, d:0.06},
    {x:85, y:170, r:9, d:0.08},
    {x:170, y:145, r:7, d:0.07},
    {x:120, y:120, r:6, d:0.05},
  ];
  craters.forEach(c => {
    // Shadow inside crater
    const cGrad = mxN.createRadialGradient(c.x - c.r*0.2, c.y - c.r*0.2, 0, c.x, c.y, c.r);
    cGrad.addColorStop(0, `rgba(140,135,120,${c.d})`);
    cGrad.addColorStop(0.6, `rgba(160,155,140,${c.d * 0.5})`);
    cGrad.addColorStop(1, 'rgba(200,195,180,0)');
    mxN.fillStyle = cGrad;
    mxN.beginPath(); mxN.arc(c.x, c.y, c.r, 0, Math.PI*2); mxN.fill();
    // Rim highlight
    mxN.strokeStyle = `rgba(245,240,230,${c.d * 0.4})`;
    mxN.lineWidth = 0.8;
    mxN.beginPath(); mxN.arc(c.x, c.y, c.r * 0.9, -0.5, 1.2); mxN.stroke();
  });
  
  // ── Hijri moon phase shadow ──
  // Calculate independently — buildStars may run before buildQibla
  // Synodic month calculation — works year-round, not just Ramadan
  // Known new moon: Jan 29, 2026 12:36 UTC (astronomical)
  const KNOWN_NEW_MOON = new Date(Date.UTC(2026, 0, 29, 12, 36));
  const SYNODIC = 29.53059; // days
  const daysSinceNew = (Date.now() - KNOWN_NEW_MOON.getTime()) / 86400000;
  const phase = ((daysSinceNew % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC; // 0→1
  // Phase rendering — pixel-based for reliability
  // phase 0 = new moon (dark), 0.5 = full moon, 1.0 = dark again
  // illumination: 0→1→0 over the month
  const illum = phase <= 0.5 ? phase * 2 : (1 - phase) * 2; // 0→1→0
  const waxing = phase <= 0.5; // right side lit first (Northern hemisphere Hijri)
  
  // Draw shadow overlay using compositing
  const shadowCv = document.createElement('canvas');
  shadowCv.width = 256; shadowCv.height = 256;
  const sx = shadowCv.getContext('2d');
  
  // Fill with shadow
  sx.fillStyle = 'rgba(5,5,10,0.93)';
  sx.beginPath(); sx.arc(mcx, mcy, mcr + 1, 0, Math.PI * 2); sx.fill();
  
  // Cut out the illuminated portion
  sx.globalCompositeOperation = 'destination-out';
  sx.fillStyle = '#fff';
  sx.beginPath();
  
  if(illum < 0.01) {
    // New moon — all dark, cut nothing
  } else if(illum > 0.99) {
    // Full moon — cut everything
    sx.arc(mcx, mcy, mcr + 1, 0, Math.PI * 2);
    sx.fill();
  } else {
    // Crescent/gibbous — half circle + terminator ellipse
    const litSide = waxing ? 1 : -1; // +1 = right lit, -1 = left lit
    // Always draw the lit half-circle
    const startAng = litSide > 0 ? -Math.PI/2 : Math.PI/2;
    const endAng = litSide > 0 ? Math.PI/2 : -Math.PI/2;
    sx.arc(mcx, mcy, mcr, startAng, endAng);
    // Terminator: ellipse width controls crescent shape
    // illum 0→0.5: crescent (terminator on lit side), 0.5→1: gibbous (terminator on dark side)
    const tWidth = Math.abs(illum * 2 - 1) * mcr;
    const ccw = illum < 0.5; // crescent: cut less, gibbous: cut more
    sx.ellipse(mcx, mcy, tWidth || 0.5, mcr, 0, endAng, startAng, ccw);
    sx.closePath();
    sx.fill();
  }
  
  // Apply shadow to moon
  mxN.drawImage(shadowCv, 0, 0);
  
  // Soft limb darkening — edge of moon sphere
  const limbGrad = mxN.createRadialGradient(mcx, mcy, mcr * 0.7, mcx, mcy, mcr);
  limbGrad.addColorStop(0, 'rgba(0,0,0,0)');
  limbGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
  mxN.fillStyle = limbGrad;
  mxN.beginPath(); mxN.arc(mcx, mcy, mcr, 0, Math.PI*2); mxN.fill();
  mxN.restore(); // release global moon clip
  
  const moonTexN = new THREE.CanvasTexture(moonCvN);
  
  // Moon mesh with texture
  const moonGeo = new THREE.CircleGeometry(moonR, 48);
  const moonMat = new THREE.MeshBasicMaterial({
    map: moonTexN,
    color: new THREE.Color(1.15, 1.12, 1.05), // barely HDR — moon glows, doesn't blast
    transparent: true, opacity: 0, depthWrite: false,
  });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);
  
  // Soft radial glow — larger, subtle
  const glowGeo = new THREE.CircleGeometry(moonR * 2.5, 48);
  // Radial gradient texture for soft atmospheric falloff
  const glowCv = document.createElement('canvas');
  glowCv.width = 128; glowCv.height = 128;
  const gCtx = glowCv.getContext('2d');
  const grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,250,240,1)');
  grad.addColorStop(0.15, 'rgba(255,245,230,0.6)');
  grad.addColorStop(0.4, 'rgba(255,240,220,0.2)');
  grad.addColorStop(0.7, 'rgba(255,235,210,0.05)');
  grad.addColorStop(1, 'rgba(255,230,200,0)');
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowCv);
  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: new THREE.Color(1.5, 1.4, 1.2),
    transparent: true, opacity: 0, depthWrite: false,
  });
  moonGlowMesh = new THREE.Mesh(glowGeo, glowMat);
  moonGlowMesh.position.z = -0.5;
  moonGroup.add(moonGlowMesh);
  
  moonGroup.position.set(0, -60, -15);
  moonGroup.visible = false;
  scene.add(moonGroup);
}

// ══════════════════════════════════════════
// BUILD ALL
// ══════════════════════════════════════════
function updateSurah() {
  if(CONTAINED) return;
  const el = document.getElementById('surah');
  if(el) {
    const d = DIALS[currentDial];
    el.textContent = d.surah || '';
    el.style.color = d.text || '#ffffff';
  }
  const toggle = document.getElementById('modeToggle');
  if(toggle) toggle.style.color = DIALS[currentDial].text || '#ffffff';
  updateModeIcon();
}
// ══════════════════════════════════════════
// RAINBOW BEZEL — Rolex Daytona Rainbow tribute
// ══════════════════════════════════════════
let bezelMeshes = [];
function buildBezel() {
  bezelMeshes.forEach(m => clockGroup.remove(m));
  bezelMeshes = [];
  if(!DIALS[currentDial].bezel) return;
  
  // 36 sapphires around the bezel — rainbow gradient
  const GEMS = 36;
  const bezelR = caseR + 2;
  const gemSize = R * 0.04;
  
  for(let i = 0; i < GEMS; i++) {
    const ang = Math.PI/2 - (i/GEMS) * Math.PI * 2;
    const hue = (i/GEMS); // 0→1 around the rainbow
    const color = new THREE.Color().setHSL(hue, 0.85, 0.55);
    
    // Gem: small extruded octagon for faceted look
    const shape = new THREE.Shape();
    const sides = 8;
    for(let s = 0; s < sides; s++) {
      const a = (s/sides) * Math.PI * 2;
      const x = Math.cos(a) * gemSize;
      const y = Math.sin(a) * gemSize;
      if(s === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 2.5,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.4,
      bevelSegments: 3
    });
    
    const mat = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.05,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      transmission: 0.3,
      thickness: 2,
      ior: 1.77, // sapphire IOR
      emissive: color,
      emissiveIntensity: 0.1
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = Math.cos(ang) * bezelR;
    mesh.position.y = Math.sin(ang) * bezelR;
    mesh.position.z = 0;
    mesh.rotation.z = ang;
    clockGroup.add(mesh);
    bezelMeshes.push(mesh);
  }
  
  // Gold bezel ring underneath the gems
  const ringGeo = new THREE.TorusGeometry(bezelR, gemSize * 0.8, 16, 128);
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8a850,
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.z = -0.5;
  clockGroup.add(ring);
  bezelMeshes.push(ring);
}

function buildAll(){
  if(CONTAINED) console.log('[clock] buildAll, dial:', currentDial, 'scale:', clockGroup.scale.x);
  while(clockGroup.children.length) clockGroup.remove(clockGroup.children[0]);
  const dialBg = new THREE.Color(DIALS[currentDial].bg);
  bgPlaneMat.color.copy(dialBg);
  if(!EMBED || CONTAINED || isFullscreen) scene.background = dialBg.clone();
  // Ensure bgPlane is hidden in fullscreen
  if(isFullscreen && scene.children.includes(bgPlane)) scene.remove(bgPlane);
  // Initial bg — animation loop readPixels will correct on first frame
  if(!CONTAINED) document.documentElement.style.backgroundColor = document.body.style.backgroundColor = '#' + dialBg.getHexString();
  const steps = [['dial',buildDial],['bezel',buildBezel],['markers',buildMarkers],['numerals',buildNumerals],['brand',buildBrandText],['hands',buildHands],['qibla',buildQibla],['flap',buildFlap],['stars',buildStars],['scrollIndicator',buildScrollIndicator],['surah',updateSurah]];
  for(const [name,fn] of steps) { try { fn(); } catch(e) { console.error(`buildAll: ${name} failed:`, e); } }
  if(!CONTAINED) {
    // Update dial info panel
    const c = DIALS[currentDial];
    const dn = document.getElementById('dialName');
    const ds = document.getElementById('dialSurah');
    const lb = document.getElementById('listenBtn');
    if(dn) { dn.textContent = currentDial.charAt(0).toUpperCase() + currentDial.slice(1); dn.style.color = c.text; }
    if(ds) { ds.textContent = c.surah || ''; ds.style.color = c.text; }
    if(lb) { lb.style.color = c.text; }
    // Update prayer times color
    const pt = document.getElementById('prayerTimes');
    if(pt) pt.style.color = c.text;
  }
}
// Debug — expose internals
window._clockDebug = { scene, cam, clockGroup, renderer, composer, bgPlane, getAnimCount: () => _animCount };
// Expose spatial audio data for landing page verse/surah playback
window._spatialQibla = () => ({ qiblaAngle: adhanQiblaAngle, deviceHeading: adhanDeviceHeading, hasCompass: adhanHasCompass });
// Expose controls for landing page
window._clockSwitchDial = function(name){ if(DIALS[name]){currentDial=name;buildAll();} };
window._clockSetNight = function(on, snap){ modeTarget=on?1:0; if(snap) modeBlend=modeTarget; };
window._clockGetDial = function(){ return currentDial; };

// Lock compass at 12 o'clock (resting state) — for dial showcase
let _compassLocked = false;
window._clockLockCompass = function(on){ _compassLocked = on; if(on) hasCompassData = false; };
window._clockSetScrollSection = function(idx){ scrollIndicatorTarget = idx; }; // -1=hide, 0-6=section index

// Qibla compass demo — simulates a slow turn ending at alignment
let _qiblaDemoActive = false, _qiblaDemoStart = 0;
window._clockQiblaDemo = function(on){
  _qiblaDemoActive = on;
  if(on && !_compassLocked){
    qiblaBearing = 45;
    hasCompassData = true;
    _qiblaDemoStart = Date.now();
    targetCompassHeading = qiblaBearing + 180;
  } else {
    hasCompassData = false;
  }
};
function updateQiblaDemo(){
  if(!_qiblaDemoActive || _compassLocked) return;
  const elapsed = Date.now() - _qiblaDemoStart;
  const sweepDur = 5000;
  const holdDur = 2500;
  const cycleDur = sweepDur + holdDur;
  const cycleT = elapsed % cycleDur;
  if(cycleT < sweepDur){
    const t = cycleT / sweepDur;
    const ease = t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    targetCompassHeading = qiblaBearing + 180*(1-ease);
  } else {
    targetCompassHeading = qiblaBearing;
  }
}

// Wait for fonts then build (Lateef for Arabic numerals)
document.fonts.ready.then(()=>{
  buildAll();
  if(CONTAINED) {
    const initBg = new THREE.Color(DIALS[currentDial].bg);
    scene.background = initBg;
    bgPlaneMat.color.copy(initBg);
  }
});

// ══════════════════════════════════════════
// UPDATES
// ══════════════════════════════════════════
let secAngle=0;

function updateHands(){
  const now=new Date();
  const h=now.getHours()%12, m=now.getMinutes(), s=now.getSeconds(), ms=now.getMilliseconds();
  const sec=s+ms/1000, min=m+sec/60, hour=h+min/60;
  
  if(hourGroup) hourGroup.rotation.z=-(hour/12)*Math.PI*2;
  if(minGroup) minGroup.rotation.z=-(min/60)*Math.PI*2;
  
  // Quartz sweep
  secAngle=-(sec/60)*Math.PI*2;
  if(secGroup) secGroup.rotation.z=secAngle;
}

function updateFlap(){
  if(!flapCanvas)return;
  const ctx=flapCanvas.getContext('2d');
  const cw=flapCanvas.width, ch=flapCanvas.height;
  ctx.clearRect(0,0,cw,ch);
  
  const now=new Date(), nowMin=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
  let label='',mins=0;
  if(PD){
    const fajr=pM(PD.Fajr),mag=pM(PD.Maghrib),isha=pM(PD.Isha);
    if(nowMin>=fajr&&nowMin<mag){mins=mag-nowMin;label='UNTIL IFTAR';}
    else if(nowMin>=mag&&nowMin<isha){mins=isha-nowMin;label='UNTIL ISHA';}
    else if(nowMin>=isha){mins=(24*60-nowMin)+fajr;label='UNTIL FAJR';}
    else{mins=fajr-nowMin;label='UNTIL FAJR';}
  }
  
  const hh=Math.floor(mins/60),mm=Math.floor(mins%60);
  const chars=[String(Math.floor(hh/10)),String(hh%10),':',String(Math.floor(mm/10)),String(mm%10)];
  const nowMs=performance.now();
  while(flapPrevChars.length<chars.length)flapPrevChars.push('');
  while(flapCharAnims.length<chars.length)flapCharAnims.push({start:0,prev:''});
  for(let i=0;i<chars.length;i++){if(chars[i]!==flapPrevChars[i])flapCharAnims[i]={start:nowMs+i*FLAP_STAGGER,prev:flapPrevChars[i]||chars[i]};}
  flapPrevChars=chars.slice();
  
  const c=DIALS[currentDial];
  const digitW=cw*0.17,colonW=cw*0.06,cellH=ch*0.65;
  const charWidths=chars.map(c=>c===':'?colonW:digitW);
  const totalW=charWidths.reduce((a,w)=>a+w,0)+(chars.length-1)*4;
  let curX=(cw-totalW)/2;
  const cellY=ch*0.15,fontSize=cellH*0.7;
  const lumeCol=c.text;
  
  for(let i=0;i<chars.length;i++){
    const ch2=chars[i],charW=charWidths[i],cellCx=curX+charW/2;
    if(ch2===':'){
      ctx.fillStyle=lumeCol;ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.arc(cellCx,cellY+cellH*0.3,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cellCx,cellY+cellH*0.7,4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;curX+=charW+4;continue;
    }
    ctx.fillStyle='rgba(0,0,0,0.3)';rr(ctx,curX,cellY,charW,cellH,6);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(curX,cellY+cellH/2-0.5,charW,1);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`500 ${fontSize}px Inter,system-ui`;
    ctx.fillStyle=lumeCol;ctx.globalAlpha=0.9;
    ctx.fillText(ch2,cellCx,cellY+cellH/2);
    ctx.globalAlpha=1;curX+=charW+4;
  }
  if(label){
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`500 ${ch*0.1}px Inter,system-ui`;
    ctx.fillStyle=lumeCol;ctx.globalAlpha=0.55;
    ctx.fillText(label,cw/2,cellY+cellH+ch*0.14);
    ctx.globalAlpha=1;
  }
  flapTexture.needsUpdate=true;
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

// ══════════════════════════════════════════
// PRAYER TIMES
// ══════════════════════════════════════════
async function fetchPrayer(){
  try{
  // Use date-based endpoint with auto-detected location
  const d=new Date(), dd=`${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
  const r=await fetch(`https://api.aladhan.com/v1/timingsByCity/${dd}?city=LosAngeles&country=US&method=2`);
  const j=await r.json();if(j.code===200){PD=j.data.timings;
  if(!CONTAINED){
  // Prayer times → top bar
  const _pt5=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const _now=new Date(),_nowM=_now.getHours()*60+_now.getMinutes();
  const _toM=s=>{const[h,m]=(s||'').split(':').map(Number);return h*60+m;};
  let _nextP='';_pt5.forEach(p=>{if(!_nextP&&_toM(PD[p])>_nowM)_nextP=p;});
  const ptEl=document.getElementById('prayerTimes');
  ptEl.innerHTML=_pt5.map(p=>`<span style="${p===_nextP?'color:#c0392b;font-weight:700':''}">${p} ${PD[p]}</span>`).join(' · ');
  ptEl.style.color=DIALS[currentDial].text;
  // Bottom info — date
  document.getElementById('hijri').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  document.getElementById('hijri').style.color=DIALS[currentDial].text;
  document.getElementById('greg').textContent='';
  document.getElementById('greg').style.color=DIALS[currentDial].text;
  }
  }}catch(e){}
}
fetchPrayer();

// ══════════════════════════════════════════
// INTERACTIONS (standalone only)
// ══════════════════════════════════════════
if(!CONTAINED){
// ── Surah audio (Alafasy via QuranCDN) — delegates to landing page HRTF pipeline ──
const SURAH_MAP = {
  'Ar-Raḥmān': 55, 'An-Nūr': 24, 'Ash-Shams': 91, 'Al-Layl': 92,
  'Al-Burūj': 85, 'Al-Kawthar': 108, 'Aḍ-Ḍuḥā': 93, 'An-Najm': 53,
  'Al-Qamar': 54, 'Al-Wāqiʿah': 56, 'Al-Mulk': 67, 'Al-Insān': 76,
};
const _listenBtn = document.getElementById('listenBtn');
if(_listenBtn) _listenBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const surahName = DIALS[currentDial].surah;
  const num = SURAH_MAP[surahName];
  if (!num) return;
  const src = `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${num}.mp3`;
  // Use the shared HRTF pipeline from index.html (playSurahSpatial)
  if (typeof playSurahSpatial === 'function') {
    playSurahSpatial(_listenBtn, src, 'Listen to this Surah');
  }
});

let infoTimer;
const SUN_SVG='<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
const MOON_SVG='<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
function updateModeIcon(){
  const icon=document.getElementById('modeIcon');
  if(icon) icon.innerHTML=modeTarget>0.5?SUN_SVG:MOON_SVG;
}
document.getElementById('modeToggle').addEventListener('click',(e)=>{
  e.stopPropagation();
  modeTarget=modeTarget>0.5?0:1;
  updateModeIcon();
});
function showInfo(){
  document.getElementById('info').classList.add('visible');
  document.getElementById('dialBar').classList.add('visible');
  document.getElementById('dialInfo').classList.add('visible');
  document.getElementById('prayerBar').classList.add('visible');
  document.getElementById('modeToggle').classList.add('visible');
  clearTimeout(infoTimer);
  infoTimer=setTimeout(()=>{document.getElementById('info').classList.remove('visible');document.getElementById('dialBar').classList.remove('visible');document.getElementById('dialInfo').classList.remove('visible');document.getElementById('prayerBar').classList.remove('visible');document.getElementById('modeToggle').classList.remove('visible');},4000);
}
renderer.domElement.addEventListener('click',showInfo);
renderer.domElement.addEventListener('dblclick',()=>{modeTarget=modeTarget>0.5?0:1;});

let touchStartX=0, touchStartY=0;
renderer.domElement.addEventListener('touchstart',e=>{
  touchStartX=e.touches[0].clientX;
  touchStartY=e.touches[0].clientY;
},{passive:true});
renderer.domElement.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-touchStartX;
  const dy=e.changedTouches[0].clientY-touchStartY;
  // Determine if swipe is more horizontal or vertical
  if(Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 50) {
    // Vertical swipe — up = night, down = day
    modeTarget = dy < 0 ? 1 : 0;
  } else if(Math.abs(dx) > 50) {
    // Horizontal swipe — change dial
    const idx=DIAL_NAMES.indexOf(currentDial);
    currentDial=DIAL_NAMES[dx>0?(idx-1+DIAL_NAMES.length)%DIAL_NAMES.length:(idx+1)%DIAL_NAMES.length];
    buildAll();
  }
});
document.querySelectorAll('.dial-dot').forEach(d=>{d.addEventListener('click',e=>{e.stopPropagation();currentDial=d.dataset.dial;buildAll();document.querySelectorAll('.dial-dot').forEach(x=>x.classList.toggle('active',x.dataset.dial===currentDial));});});
} // end !CONTAINED

// ══════════════════════════════════════════
// RESIZE
// ══════════════════════════════════════════
// Listen for dispose message from parent (landing page iframe management)
window.addEventListener('message',(e)=>{
  if(e.data&&e.data.type==='dispose'){
    renderer.dispose();renderer.forceContextLoss();
  }
  if(e.data&&e.data.type==='switchDial'&&DIALS[e.data.dial]){
    currentDial=e.data.dial;
    buildAll();
  }
  if(e.data&&e.data.type==='nightOn'){modeTarget=1;}
  if(e.data&&e.data.type==='nightOff'){modeTarget=0;}
});
function onResize(){
  W=(CONTAINED && !isFullscreen)?CONTAINER.clientWidth:window.innerWidth;
  H=(CONTAINED && !isFullscreen)?CONTAINER.clientHeight:window.innerHeight;
  renderer.setSize(W,H);
  const a=W/H;
  cam.aspect=a;
  cam.position.z = 280;
  cam.updateProjectionMatrix();
  composer.setSize(W, H);
  bloomPass.resolution.set(W, H);
  // Resize = good time to retry bloom if it failed (GPU process may have recovered)
  if(_bloomFailed) { _bloomFailed = false; _bloomRetryAt = 0; console.log('[perf] Bloom retry on resize'); }
  bloomPass.resolution.set(W, H);
  // Enforce correct scale — fullscreen=0.50, contained=0.95, embed=0.65
  const targetScale = isFullscreen ? 0.50 : (CONTAINED ? 0.95 : (EMBED ? 0.65 : 0.50));
  if(CLOCK_SCALE !== targetScale) {
    CLOCK_SCALE = targetScale;
    clockGroup.scale.setScalar(CLOCK_SCALE);
  }
}
window.addEventListener('resize',onResize);
window._clockOnResize = onResize;
if(CONTAINED){new ResizeObserver(onResize).observe(CONTAINER);}

// ══════════════════════════════════════════
// RENDER LOOP
// ══════════════════════════════════════════
const vignetteEl = CONTAINED ? null : document.getElementById('vignette');
let _animCount=0;
function animate(){
  requestAnimationFrame(animate);
  if(CONTAINED && _animCount<3) console.log('[clock] animate frame', _animCount);
  _animCount++;
  try {
  
  // Night blend
  if(Math.abs(modeBlend-modeTarget)>0.001) modeBlend+=(modeTarget-modeBlend)*0.024;
  else modeBlend=modeTarget;
  
  // Night mode: lume glow with per-dial color
  const nightLume = NIGHT_LUME[currentDial] || NIGHT_LUME.slate;
  const lumeEmCol = new THREE.Color(nightLume.emissive);
  // Subtle lume breathing — very slow, barely perceptible (±5%)
  const lumeBreathe = 1.0 + Math.sin(Date.now() * 0.0005) * 0.05;
  const lumeIntensity = modeBlend * 2.0 * lumeBreathe;
  lumeMeshes.forEach(m=>{
    m.material.emissive.copy(new THREE.Color(0x000000).lerp(lumeEmCol, modeBlend));
    // Kawthar candy buttons: cap glow to prevent blowout
    m.material.emissiveIntensity = m.userData?.kawtharButton ? lumeIntensity * 0.7 : lumeIntensity;
  });
  if(hLumeMat_) { hLumeMat_.emissive.lerp(lumeEmCol, modeBlend); hLumeMat_.emissiveIntensity = lumeIntensity; }
  if(mLumeMat_) { mLumeMat_.emissive.lerp(lumeEmCol, modeBlend); mLumeMat_.emissiveIntensity = lumeIntensity; }
  
  // Numerals glow
  numeralMats.forEach(m=>{
    m.emissive.copy(new THREE.Color(0x000000).lerp(lumeEmCol, modeBlend));
    m.emissiveIntensity = lumeIntensity * 0.85;
  });
  // Brand text glow — canvas textures, redraw with glow color in night mode
  brandMeshes.forEach(mesh=>{
    const bd = mesh.userData.brandCanvas;
    if(!bd) return;
    const {cvs, ctx, text, fontSpec, alpha, cW, cH, dpr} = bd;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cW, cH);
    // Blend from lume color to emissive glow
    const dayCol = new THREE.Color(DIALS[currentDial].lume);
    const nightCol = lumeEmCol.clone().multiplyScalar(1 + modeBlend * 1.5);
    const blended = dayCol.lerp(nightCol, modeBlend);
    ctx.fillStyle = '#' + blended.getHexString();
    ctx.globalAlpha = alpha !== undefined ? alpha : 1;
    ctx.font = fontSpec;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if(bd.arched) {
      // Legacy arched — no longer used
    } else if(false) {
      // placeholder
    } else {
      ctx.fillText(text, cW / 2, cH / 2);
    }
    mesh.material.map.needsUpdate = true;
  });
  // Brand letter sprites (arched AGIFTOFTIME.APP)
  brandMeshes.forEach(mesh=>{
    const bl = mesh.userData.brandLetter;
    if(!bl) return;
    const {cvs, ctx, ch, cS, dpr} = bl;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cS, cS);
    const dayCol = new THREE.Color(DIALS[currentDial].lume);
    const nightCol = lumeEmCol.clone().multiplyScalar(1 + modeBlend * 1.5);
    const blended = dayCol.lerp(nightCol, modeBlend);
    ctx.fillStyle = '#' + blended.getHexString();
    ctx.globalAlpha = 0.45;
    ctx.font = "700 28px Inter, system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, cS / 2, cS / 2);
    mesh.material.map.needsUpdate = true;
  });
  
  // Dial surface picks up faint lume ambient bounce
  if(dialMesh && dialMesh.material) {
    const dayColor = new THREE.Color(DIALS[currentDial].bg);
    const nightDialColor = dayColor.clone().lerp(new THREE.Color(0x080810), modeBlend * 0.92);
    dialMesh.material.color.copy(nightDialColor);
    if(dialMesh.material.emissive) { // PBR materials only (kawthar, qamar)
      dialMesh.material.emissive.copy(lumeEmCol).multiplyScalar(0.08);
      dialMesh.material.emissiveIntensity = modeBlend;
    }
  }
  // Darken lower dial too
  if(dialLowerMesh && dialLowerMesh.material) {
    const dayLower = new THREE.Color(DIALS[currentDial].bg).multiplyScalar(0.75);
    dialLowerMesh.material.color.copy(dayLower.lerp(new THREE.Color(0x060608), modeBlend * 0.9));
  }
  
  // Rainbow bezel gems glow at night
  bezelMeshes.forEach(m => {
    if(m.material && m.material.emissiveIntensity !== undefined && m.material.ior) {
      m.material.emissiveIntensity = 0.1 + modeBlend * 0.6;
    }
  });
  
  // Qibla compass elements glow at night
  if(qiblaGroup) {
    qiblaGroup.traverse(child => {
      if(child.material && child.material.emissive) {
        if(child.material === window._qiblaTriMat) {
          // Qibla green triangle — strong glow
          child.material.emissiveIntensity = 0.15 + modeBlend * 1.0;
        } else if(child.material.emissiveIntensity !== undefined) {
          // Compass ticks — subtle lume glow
          child.material.emissiveIntensity = modeBlend * 0.5;
        }
      }
    });
  }
  
  // (subdial rings removed)
  
  // Bloom ramps up in night mode — soft, dreamy glow
  bloomPass.strength = modeBlend * 0.8;
  bloomPass.radius = 0.4 + modeBlend * 0.3;
  bloomPass.threshold = 0.85 - modeBlend * 0.25; // floor 0.6 — only hottest emissives bloom
  
  // Dim scene lights for night — let lume own the scene
  ambLight.intensity = 0.06 * (1 - modeBlend * 0.85);
  keyLight.intensity = 2.5 * (1 - modeBlend * 0.85);
  stripLight.intensity = 4.0 * (1 - modeBlend * 0.8);
  specPoint.intensity = 6 * (1 - modeBlend * 0.7);
  counterSpec.intensity = 1.5 * (1 - modeBlend * 0.7);
  subSpot.intensity = 20 * (1 - modeBlend * 0.5);
  // Reduce env intensity at night so lume glows dominate
  if(scene.environmentIntensity !== undefined) scene.environmentIntensity = 0.5 * (1 - modeBlend * 0.7);
  renderer.toneMappingExposure = 0.825 - modeBlend * 0.25;
  
  // Vignette at night
  if(vignetteEl) vignetteEl.style.opacity = modeBlend * 0.8;
  
  // Second hand subtle glow at night
  if(secMat_) secMat_.emissiveIntensity = modeBlend * 0.3;
  
  // Hands catch faint lume-tinted spec at night (simulates lume bounce on polished steel)
  if(hourMat_) { hourMat_.emissive = hourMat_.emissive || new THREE.Color(0); hourMat_.emissive.copy(lumeEmCol).multiplyScalar(0.04); hourMat_.emissiveIntensity = modeBlend; }
  if(minMat_) { minMat_.emissive = minMat_.emissive || new THREE.Color(0); minMat_.emissive.copy(lumeEmCol).multiplyScalar(0.04); minMat_.emissiveIntensity = modeBlend; }
  
  // Stars — staggered fade-in, tinted to lume palette
  starMeshes.forEach((m,i)=>{
    const s=m.userData;if(!s)return;
    // Stagger: each star appears at a different modeBlend threshold
    const starThreshold = 0.2 + (i / starMeshes.length) * 0.25; // 0.2 → 0.45 — all visible by modeBlend 0.6
    const starBlend = Math.max(0, Math.min(1, (modeBlend - starThreshold) / 0.15));
    const twinkle = (Math.sin(Date.now()*s.speed+s.offset)*0.3+0.7);
    m.material.opacity = starBlend * s.bright * twinkle;
    // Stars gently scale in
    const sc = 0.6 + starBlend * 0.4;
    m.scale.setScalar(sc);
    const starCol = new THREE.Color(2.2, 2.2, 1.9); // HDR for bloom pickup
    starCol.lerp(new THREE.Color(lumeEmCol).multiplyScalar(1.5), modeBlend * 0.3);
    m.material.color.copy(starCol);
  });
  
  // Moon — rises from below, reaches position at full night
  if(moonGroup) {
    const moonThreshold = 0.3; // moon starts rising after stars begin
    const moonBlend = Math.max(0, Math.min(1, (modeBlend - moonThreshold) / 0.5));
    moonGroup.visible = modeBlend > 0.1;
    
    // Rise from behind dial top — first appears above the 12 o'clock edge
    const startY = R * 0.85, endY = 78;  // starts at dial top edge, rises to crown
    const startZ = -20, endZ = -15;       // starts behind dial, comes forward
    // Ease-out cubic for natural rise
    const eased = 1 - Math.pow(1 - moonBlend, 3);
    moonGroup.position.y = startY + (endY - startY) * eased;
    moonGroup.position.x = 0;
    moonGroup.position.z = startZ + (endZ - startZ) * eased;
    
    // Moon glow and emissive
    if(moonMesh) {
      moonMesh.material.opacity = moonBlend;
      // HDR moon tinted slightly toward lume
      const mc = new THREE.Color(1.15, 1.12, 1.05);
      mc.lerp(new THREE.Color(lumeEmCol).multiplyScalar(0.8), 0.1);
      moonMesh.material.color.copy(mc);
    }
    if(moonGlowMesh) {
      moonGlowMesh.material.opacity = moonBlend * 0.15;
      const gc = new THREE.Color(1.2, 1.15, 1.0);
      gc.lerp(new THREE.Color(lumeEmCol).multiplyScalar(1.2), 0.2);
      moonGlowMesh.material.color.copy(gc);
    }
    
    // Moon phase: TODO — canvas texture approach for proper crescent
  }
  
  // BG color blend
  const nightBg = new THREE.Color(DIALS[currentDial].bg).lerp(new THREE.Color(0x0a0e18), modeBlend);
  bgPlaneMat.color.copy(nightBg);
  if(!EMBED || CONTAINED || isFullscreen) {
    scene.background = nightBg;
  }
  
  // Parallax + interactive spec light
  gx+=(tgx-gx)*0.08; gy+=(tgy-gy)*0.08;
  // gyro debug dot removed
  // Camera parallax — skip when contained (unless fullscreen)
  if(!CONTAINED || isFullscreen) { cam.position.x = 0; }
  cam.position.y = (CONTAINED && !isFullscreen) ? -2 : -3;
  cam.lookAt(0,0,0);
  
  // HDRI rotation with tilt — softboxes sweep across hands from pleasing rest position
  if(scene.environmentRotation) {
    scene.environmentRotation.y = 2.8 + gx * 0.6;  // base offset + tilt sweep
    scene.environmentRotation.x = 0.1 + gy * 0.3;
  }
  // Spec point follows tilt — the main visible highlight on hands
  specPoint.position.x = 30 + gx * 120;  // wider travel
  specPoint.position.y = 60 + gy * 90;
  // Subdial spot follows tilt
  subSpot.position.x = 10 + gx * 70;
  subSpot.position.y = -R*0.5 + 30 + gy * 50;
  // Counter spec — opposite dance for depth
  counterSpec.position.x = -40 - gx * 90;
  counterSpec.position.y = -30 - gy * 50;
  
  updateHands();
  updateFlap();
  updateQiblaDemo();
  updateQibla();
  updateScrollIndicator();
  // Qibla triangle pulses when aligned
  if(window._qiblaTriMat && qiblaRotor) {
    const qiblaOffset = ((qiblaBearing - compassHeading) % 360 + 360) % 360;
    const offNorm = Math.min(qiblaOffset, 360 - qiblaOffset) / 180;
    const aligned = qiblaAligned;
    const targetTri = aligned ? 0.6 + Math.sin(Date.now() * 0.005) * 0.2 : 0.15;
    window._qiblaTriMat.emissiveIntensity += (targetTri - window._qiblaTriMat.emissiveIntensity) * 0.1;
  }
  
  // Use composer for bloom; adaptive fallback on GPU OOM
  if(modeBlend > 0.01) {
    // Retry bloom every 30s after failure (GPU process may recover)
    if(_bloomFailed && Date.now() > _bloomRetryAt) {
      _bloomFailed = false;
      console.log('[perf] Retrying bloom composer');
    }
    if(!_bloomFailed) {
      try {
        composer.render();
        const gl = renderer.getContext();
        const err = gl.getError();
        if(err === gl.INVALID_FRAMEBUFFER_OPERATION) {
          console.warn('[perf] Bloom framebuffer failed — falling back for 30s');
          _bloomFailed = true;
          _bloomRetryAt = Date.now() + 30000;
          renderer.render(scene, cam);
        }
      } catch(e) {
        console.warn('[perf] Bloom error:', e);
        _bloomFailed = true;
        _bloomRetryAt = Date.now() + 30000;
        renderer.render(scene, cam);
      }
    } else {
      renderer.render(scene, cam);
    }
  } else {
    renderer.render(scene, cam);
  }
  
  // Compute bg color from scene.background directly (no GPU readPixels stall)
  if(!CONTAINED || isFullscreen) {
    const _bgObj = scene.background;
    const _bgHex = _bgObj && _bgObj.isColor ? '#' + _bgObj.getHexString() : '#' + bgPlaneMat.color.getHexString();
    if(_bgHex !== _lastBgHex) {
      _lastBgHex = _bgHex;
      const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=_bgHex;
      if(!CONTAINED) { document.documentElement.style.backgroundColor = document.body.style.backgroundColor = _bgHex; }
      if(isFullscreen) {
        const ov=document.getElementById('clockFullscreen'); if(ov) ov.style.background=_bgHex;
      }
    }
  }
  } catch(e) { if(_animCount < 5) console.error('[clock] animate error:', e.message, e.stack); }
}
animate();
if(!CONTAINED){
  if(EMBED){
    const infoEl=document.getElementById('info');if(infoEl)infoEl.style.display='none';
    const dialBarEl=document.getElementById('dialBar');if(dialBarEl)dialBarEl.style.display='none';
  } else {
    showInfo();
  }
}

