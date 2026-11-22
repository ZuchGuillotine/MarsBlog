// SLP-5 laser payload: procedural 3D cutaway and beam animation.
//
// Geometry is laid out in the payload's own frame, in millimetres:
//   X = length (0–560), Y = width (0–380), Z = height (0–165).
// `P()` maps that frame into three.js (Y up). Nothing here models the
// tracking or beam-delivery system; the beam simply leaves the exit port.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export interface SlpSceneOptions {
  reducedMotion?: boolean;
  onReady?: () => void;
}

export interface SlpSceneHandle {
  setExploded(v: boolean | 'auto'): void;
  setLabels(v: boolean): void;
  setPaused(v: boolean): void;
  resetView(): void;
  dispose(): void;
}

// ---- frame -----------------------------------------------------------------
const LEN = 560;
const WID = 380;
const HGT = 165;
const WALL = 6;
const BENCH_Z0 = 75;
const BENCH_Z1 = 110;
const ZB = 139; // beam height
const P = (X: number, Y: number, Z: number) => new THREE.Vector3(X - LEN / 2, Z, WID / 2 - Y);

const COLORS = {
  pump: new THREE.Color('#d40f0f'),
  ir: new THREE.Color('#ff6a00'),
  green: new THREE.Color('#00ff66'),
  uv: new THREE.Color('#7a2bff'),
};

// ---- beam shader -------------------------------------------------------------
const beamVert = /* glsl */ `
  varying float vT;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vT = position.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHead;
  uniform float uSigma;
  uniform float uS0;
  uniform float uS1;
  uniform float uLen;
  uniform float uBase;
  uniform float uBase2;
  uniform float uPulse;
  uniform float uFade;
  uniform float uLive;
  varying float vT;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float s = uS0 + vT * uLen;
    float d = (s - uHead) / uSigma;
    float p = exp(-d * d);
    // the steady glow only exists behind the pulse head
    float lit = mix(1.0, 0.4 + 0.6 * smoothstep(0.0, uSigma, uHead - s), uLive);
    float glow = uBase * lit;
    if (uS1 >= 0.0) {
      float s2 = uS1 + (1.0 - vT) * uLen;
      float d2 = (s2 - uHead) / uSigma;
      p += 1.6 * exp(-d2 * d2);
      glow += uBase2 * mix(1.0, 0.4 + 0.6 * smoothstep(0.0, uSigma, uHead - s2), uLive);
    }
    float facing = pow(abs(dot(normalize(vN), normalize(vV))), 0.75);
    float a = (glow + uPulse * p) * mix(0.3, 1.0, facing);
    a *= mix(1.0, pow(1.0 - vT, 1.6), uFade);
    gl_FragColor = vec4(uColor * a, 1.0);
  }
`;

interface BeamSpec {
  a: [number, number];
  b: [number, number];
  w0: number; // full width at start
  w1?: number; // full width at end
  square?: boolean;
  color: THREE.Color;
  s0: number;
  s1?: number; // return-pass path coordinate at the far end (double pass)
  base?: number;
  base2?: number;
  fade?: boolean;
  scale?: number; // cross-section scale for nested co-propagating beams
}

export function initSlpScene(container: HTMLElement, opts: SlpSceneOptions = {}): SlpSceneHandle {
  const reduced = !!opts.reducedMotion;
  const canvasHost = container.querySelector<HTMLElement>('[data-slp-canvas]') ?? container;
  const labelHost = container.querySelector<HTMLElement>('[data-slp-labels]');

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasHost.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const BG = new THREE.Color('#0b0d12');
  const scene = new THREE.Scene();
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 1500, 3400);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.36;

  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 20, 6000);

  // ---- lights ----------------------------------------------------------------
  const key = new THREE.DirectionalLight('#dfe9ff', 2.0);
  key.position.set(-380, 900, 620);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 200;
  key.shadow.camera.far = 2400;
  key.shadow.camera.left = -600;
  key.shadow.camera.right = 600;
  key.shadow.camera.top = 600;
  key.shadow.camera.bottom = -600;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 1.2;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffb070', 0.8);
  rim.position.set(620, 380, -700);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#8fa6c8', 0.55);
  fill.position.set(700, 260, 600);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight('#aab6d0', '#0a0b0e', 0.35));

  // ---- materials -------------------------------------------------------------
  const std = (color: string, metalness: number, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const M = {
    albemet: std('#a8adb3', 0.85, 0.34),
    albemetCut: std('#c9ced4', 0.9, 0.22),
    sic: std('#25272b', 0.25, 0.42),
    copper: std('#b87333', 1, 0.26),
    cuw: std('#c98a62', 1, 0.14),
    steel: std('#7d8288', 0.9, 0.42),
    titanium: std('#8d9297', 0.92, 0.36),
    gold: std('#c9a03a', 0.95, 0.32),
    brass: std('#b5953f', 1, 0.3),
    black: std('#15171a', 0.55, 0.5),
    blackMatte: std('#0c0d0f', 0.2, 0.85),
    kapton: std('#d48a1a', 0.75, 0.24),
    pcb: std('#0f2a1e', 0.2, 0.6),
    chip: std('#17181b', 0.4, 0.45),
    silver: std('#d5d9de', 1, 0.2),
    capBlue: std('#2a5db0', 0.35, 0.38),
    mirror: std('#dfe6f2', 1, 0.04),
    deck: std('#0d0f14', 0, 0.92),
    emitter: std('#ffd27a', 0.9, 0.25, { emissive: new THREE.Color('#ff2a1a'), emissiveIntensity: 0 }),
  };
  const glass = (color: string, opacity: number, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
    new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.03,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.2,
      depthWrite: false,
      ...extra,
    });
  const G = {
    silica: glass('#dcebff', 0.26),
    lbo: glass('#f4f8ff', 0.34),
    smoked: glass('#2c2633', 0.72),
    lid: new THREE.MeshBasicMaterial({ color: '#9db6d4', transparent: true, opacity: 0.035, depthWrite: false, side: THREE.DoubleSide }),
  };
  const yagMats: THREE.MeshPhysicalMaterial[] = [];
  const yag = () => {
    const m = glass('#e8c5e5', 0.46, { emissive: new THREE.Color('#c86cff'), emissiveIntensity: 0 });
    yagMats.push(m);
    return m;
  };

  // ---- groups ----------------------------------------------------------------
  const root = new THREE.Group();
  scene.add(root);
  const lower = new THREE.Group();
  const upper = new THREE.Group();
  const lid = new THREE.Group();
  root.add(lower, upper, lid);

  const shadow = <T extends THREE.Object3D>(o: T, cast = true, receive = true) => {
    o.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = cast;
        c.receiveShadow = receive;
      }
    });
    return o;
  };
  const box = (
    g: THREE.Group,
    mat: THREE.Material,
    X: number,
    Y: number,
    Z: number,
    sx: number,
    sy: number,
    sz: number
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sz, sy), mat);
    m.position.copy(P(X, Y, Z));
    g.add(m);
    return m;
  };
  type Axis = 'x' | 'y' | 'z';
  const cyl = (
    g: THREE.Group,
    mat: THREE.Material,
    X: number,
    Y: number,
    Z: number,
    r: number,
    len: number,
    axis: Axis,
    seg = 40
  ) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'y') m.rotation.x = Math.PI / 2;
    m.position.copy(P(X, Y, Z));
    g.add(m);
    return m;
  };
  const tube = (g: THREE.Group, mat: THREE.Material, pts: [number, number, number][], r: number, tension = 0.15) => {
    const curve = new THREE.CatmullRomCurve3(
      pts.map(p => P(p[0], p[1], p[2])),
      false,
      'catmullrom',
      tension
    );
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 14, r, 14, false), mat);
    g.add(m);
    return m;
  };

  // ---- spacecraft deck & flexures --------------------------------------------
  const deckMesh = new THREE.Mesh(new THREE.CircleGeometry(2600, 64), M.deck);
  deckMesh.rotation.x = -Math.PI / 2;
  deckMesh.position.y = -27;
  deckMesh.receiveShadow = true;
  scene.add(deckMesh);

  const bipod = (X: number, Y: number, along: Axis) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? 5 : 14, 30, along === 'x' ? 14 : 5), M.titanium);
      strut.position.copy(P(X + (along === 'x' ? s * 13 : 0), Y + (along === 'y' ? s * 13 : 0), -12));
      if (along === 'x') strut.rotation.z = s * 0.42;
      else strut.rotation.x = s * 0.42;
      g.add(strut);
    }
    const pad = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? 62 : 22, 4, along === 'x' ? 22 : 62), M.titanium);
    pad.position.copy(P(X, Y, -25));
    g.add(pad);
    lower.add(shadow(g));
  };
  bipod(70, 50, 'x');
  bipod(490, 50, 'x');
  bipod(280, 335, 'y');

  // ---- chassis ---------------------------------------------------------------
  // Lower tub and upper ring are separate so the decks can lift apart.
  box(lower, M.albemet, LEN / 2, WID / 2, WALL / 2, LEN, WID, WALL); // base plate
  const CUT0 = 46; // front wall is cut away between these X values
  const CUT1 = 514;
  const wallRing = (g: THREE.Group, z0: number, z1: number) => {
    const h = z1 - z0;
    const zc = (z0 + z1) / 2;
    box(g, M.albemet, LEN / 2, WID - WALL / 2, zc, LEN, WALL, h); // rear
    box(g, M.albemet, LEN - WALL / 2, WID / 2, zc, WALL, WID - 2 * WALL, h); // right
    box(g, M.albemet, CUT0 / 2, WALL / 2, zc, CUT0, WALL, h); // front stubs
    box(g, M.albemet, (LEN + CUT1) / 2, WALL / 2, zc, LEN - CUT1, WALL, h);
    // polished cut faces
    box(g, M.albemetCut, CUT0 + 0.3, WALL / 2, zc, 0.6, WALL + 0.4, h);
    box(g, M.albemetCut, CUT1 - 0.3, WALL / 2, zc, 0.6, WALL + 0.4, h);
  };
  wallRing(lower, WALL, BENCH_Z0 - 2);
  wallRing(upper, BENCH_Z0 + 2, HGT - 5);
  // left wall carries the exit port, so it is built around a round opening
  const EXIT_Y = 55;
  const leftWall = (g: THREE.Group, z0: number, z1: number, port: boolean) => {
    const h = z1 - z0;
    const zc = (z0 + z1) / 2;
    if (!port) {
      box(g, M.albemet, WALL / 2, WID / 2, zc, WALL, WID - 2 * WALL, h);
      return;
    }
    const shape = new THREE.Shape();
    const y0 = WALL;
    const y1 = WID - WALL;
    shape.moveTo(y0, z0);
    shape.lineTo(y1, z0);
    shape.lineTo(y1, z1);
    shape.lineTo(y0, z1);
    shape.lineTo(y0, z0);
    const hole = new THREE.Path();
    hole.absarc(EXIT_Y, ZB, 21, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: WALL, bevelEnabled: false, curveSegments: 40 });
    // shape (u = Y, v = Z) extruded along +w; map u→-z(three), v→y, w→x
    geo.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)));
    const m = new THREE.Mesh(geo, M.albemet);
    m.position.set(-LEN / 2, 0, WID / 2);
    g.add(m);
  };
  leftWall(lower, WALL, BENCH_Z0 - 2, false);
  leftWall(upper, BENCH_Z0 + 2, HGT - 5, true);

  // mid flange where the two decks meet, external ribs, fasteners
  const flange = (g: THREE.Group, z: number, t: number) => {
    box(g, M.albemet, LEN / 2, WID + 3, z, LEN + 12, 6, t);
    box(g, M.albemet, LEN + 3, WID / 2, z, 6, WID + 12, t);
    box(g, M.albemet, -3, WID / 2, z, 6, WID + 12, t);
    box(g, M.albemet, CUT0 / 2 - 3, -3, z, CUT0 + 6, 6, t);
    box(g, M.albemet, (LEN + CUT1) / 2 + 3, -3, z, LEN - CUT1 + 6, 6, t);
  };
  flange(lower, BENCH_Z0 - 5, 6);
  flange(upper, BENCH_Z0 + 5, 6);
  flange(upper, HGT - 8, 6);
  for (let i = 0; i < 9; i++) {
    const X = 40 + i * 60;
    box(lower, M.albemet, X, WID + 2.5, 38, 5, 5, 58);
    box(upper, M.albemet, X, WID + 2.5, 118, 5, 5, 62);
  }
  for (let i = 0; i < 6; i++) {
    const Y = 40 + i * 60;
    box(lower, M.albemet, LEN + 2.5, Y, 38, 5, 5, 58);
    box(upper, M.albemet, LEN + 2.5, Y, 118, 5, 5, 62);
  }
  // socket-head cap screws along the top flange (instanced)
  {
    const pts: THREE.Vector3[] = [];
    for (let X = 20; X <= LEN - 20; X += 40) pts.push(P(X, WID + 3, HGT - 4));
    for (let Y = 20; Y <= WID - 20; Y += 40) {
      pts.push(P(LEN + 3, Y, HGT - 4));
      pts.push(P(-3, Y, HGT - 4));
    }
    const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 12), M.steel, pts.length);
    const mtx = new THREE.Matrix4();
    pts.forEach((p, i) => inst.setMatrixAt(i, mtx.makeTranslation(p.x, p.y, p.z)));
    upper.add(inst);
  }
  // indium seal: a bright line on the top flange
  box(upper, M.silver, LEN / 2, WID - 1, HGT - 4.8, LEN - 20, 1.2, 0.6);
  box(upper, M.silver, LEN - 1, WID / 2, HGT - 4.8, 1.2, WID - 20, 0.6);

  // ghost lid
  {
    const geo = new THREE.BoxGeometry(LEN + 12, 5, WID + 12);
    const m = new THREE.Mesh(geo, G.lid);
    m.position.copy(P(LEN / 2, WID / 2, HGT - 2.5));
    m.renderOrder = 5;
    lid.add(m);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: '#b9cbe0', transparent: true, opacity: 0.32 })
    );
    edges.position.copy(m.position);
    lid.add(edges);
  }

  // ---- optical bench ---------------------------------------------------------
  const bench = box(upper, M.sic, LEN / 2, WID / 2, (BENCH_Z0 + BENCH_Z1) / 2, 520, 340, BENCH_Z1 - BENCH_Z0);
  bench.receiveShadow = true;
  bench.castShadow = true;
  {
    // threaded-insert grid on the bench top
    const pts: THREE.Vector3[] = [];
    for (let X = 40; X <= 520; X += 20) for (let Y = 40; Y <= 340; Y += 20) pts.push(P(X, Y, BENCH_Z1 + 0.05));
    const inst = new THREE.InstancedMesh(new THREE.CircleGeometry(1.5, 10), std('#0d0e10', 0.6, 0.5), pts.length);
    const mtx = new THREE.Matrix4();
    const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    pts.forEach((p, i) => inst.setMatrixAt(i, mtx.makeTranslation(p.x, p.y, p.z).multiply(rot)));
    upper.add(inst);
    // lightweighting ribs on the underside (seen in the exploded view)
    for (let i = 0; i <= 8; i++) box(upper, M.sic, 40 + i * 60, WID / 2, BENCH_Z0 - 3, 4, 330, 6);
    for (let j = 0; j <= 5; j++) box(upper, M.sic, LEN / 2, 30 + j * 64, BENCH_Z0 - 3, 510, 4, 6);
  }

  const ZT = BENCH_Z1; // bench top
  const mountBlock = (X: number, Y: number, sx: number, sy: number, top: number) =>
    box(upper, M.steel, X, Y, (ZT + top) / 2, sx, sy, top - ZT);

  // ---- optics helpers --------------------------------------------------------
  const lensBarrel = (X: number, Y: number, r: number, len: number) => {
    mountBlock(X, Y, len + 6, r * 1.5, ZB - r + 2);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r + 4, r + 4, len, 40, 1, true), M.black);
    barrel.material.side = THREE.DoubleSide;
    barrel.rotation.z = Math.PI / 2;
    barrel.position.copy(P(X, Y, ZB));
    upper.add(barrel);
    for (const s of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 2, 2.2, 10, 40), M.black);
      ring.rotation.y = Math.PI / 2;
      ring.position.copy(P(X + (s * len) / 2, Y, ZB));
      upper.add(ring);
    }
    const lens = cyl(upper, G.silica, X, Y, ZB, r, 4, 'x');
    lens.renderOrder = 2;
  };
  // mirror whose reflective face normal is (nX, nY) in the bench plane
  const foldMirror = (X: number, Y: number, nX: number, nY: number, r = 17, mat: THREE.Material = M.mirror) => {
    const n = new THREE.Vector3(nX, 0, -nY).normalize();
    const g = new THREE.Group();
    const face = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 4, 40), mat);
    face.position.copy(n.clone().multiplyScalar(-2));
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(r + 4, r + 4, 9, 40), M.black);
    cell.position.copy(n.clone().multiplyScalar(-8.6));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    face.quaternion.copy(q);
    cell.quaternion.copy(q);
    g.add(face, cell);
    g.position.copy(P(X, Y, ZB));
    upper.add(g);
    const post = n.clone().multiplyScalar(-10);
    const postMesh = new THREE.Mesh(new THREE.BoxGeometry(20, ZB - ZT - 4, 20), M.steel);
    postMesh.position.copy(P(X, Y, (ZT + ZB - 4) / 2)).add(new THREE.Vector3(post.x, 0, post.z));
    postMesh.rotation.y = Math.atan2(n.x, n.z);
    upper.add(postMesh);
    return g;
  };
  const plateOptic = (X: number, Y: number, nX: number, nY: number, r: number, t: number, mat: THREE.Material) => {
    const n = new THREE.Vector3(nX, 0, -nY).normalize();
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, t, 40), mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 1.5, 2.4, 10, 40), M.black);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    disc.quaternion.copy(q);
    ring.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n));
    disc.renderOrder = 2;
    g.add(disc, ring);
    g.position.copy(P(X, Y, ZB));
    upper.add(g);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(12, ZB - ZT - r, 12), M.steel);
    foot.position.copy(P(X, Y, (ZT + ZB - r) / 2));
    upper.add(foot);
    return g;
  };

  // ---- (1) master oscillator -------------------------------------------------
  const ROW1 = 330;
  box(upper, M.gold, 70, ROW1, ZT + 21, 70, 46, 38);
  box(upper, M.steel, 70, ROW1, ZT + 1.5, 78, 54, 3);
  box(upper, std('#b08a2e', 0.95, 0.4), 70, ROW1, ZT + 40.6, 62, 38, 1.2); // lid plate
  cyl(upper, M.brass, 118, ROW1, ZB, 11, 22, 'x'); // Pockels cell
  cyl(upper, M.black, 118, ROW1, ZB, 12.5, 6, 'x');
  mountBlock(118, ROW1, 18, 20, ZB - 10);
  box(upper, M.gold, 52, ROW1 - 36, ZT + 6, 26, 14, 9); // seed diode package
  tube(upper, std('#e7c35a', 0.6, 0.4), [[65, ROW1 - 36, ZT + 8], [84, ROW1 - 40, ZT + 12], [92, ROW1 - 30, ZT + 16], [78, ROW1 - 22, ZT + 20]], 0.9, 0.5);
  {
    // small Nd:YAG rod visible through a window in the oscillator block
    const win = box(upper, G.silica, 70, ROW1 - 23.2, ZB, 30, 0.8, 14);
    win.renderOrder = 2;
    const rod = cyl(upper, yag(), 70, ROW1 - 17, ZB, 3, 26, 'x', 20);
    rod.renderOrder = 2;
  }

  // ---- (2) isolator, shaper, pre-amplifier -----------------------------------
  cyl(upper, M.blackMatte, 165, ROW1, ZB, 15, 44, 'x');
  cyl(upper, M.steel, 143, ROW1, ZB, 16.5, 5, 'x');
  cyl(upper, M.steel, 187, ROW1, ZB, 16.5, 5, 'x');
  mountBlock(165, ROW1, 34, 26, ZB - 13);
  lensBarrel(212, ROW1, 8, 10);
  lensBarrel(250, ROW1, 13, 10);

  const slabAssembly = (Xc: number, Y: number, stacksPerSide: number) => {
    const L = 110;
    const slab = box(upper, yag(), Xc, Y, ZB, L, 18, 18);
    slab.renderOrder = 3;
    // samarium-doped cladding strips and heat spreaders above and below
    for (const s of [-1, 1]) {
      const clad = box(upper, G.smoked, Xc, Y, ZB + s * 10, L, 18, 2);
      clad.renderOrder = 3;
      shadow(box(upper, M.cuw, Xc, Y, ZB + s * 14.5, L + 6, 26, 7));
    }
    shadow(box(upper, M.steel, Xc, Y, (ZT + ZB - 18) / 2, L + 6, 30, ZB - 18 - ZT));
    // clamp screws
    for (const dx of [-44, 0, 44]) cyl(upper, M.steel, Xc + dx, Y, ZB + 19, 2.4, 3, 'z', 12);
    // diode stacks either side
    const span = L / stacksPerSide;
    const glow: THREE.Mesh[] = [];
    for (const s of [-1, 1]) {
      for (let i = 0; i < stacksPerSide; i++) {
        const X = Xc - L / 2 + span * (i + 0.5);
        const Ys = Y + s * 33;
        shadow(box(upper, M.copper, X, Ys, ZB, span - 8, 22, 24));
        shadow(box(upper, M.steel, X, Ys, (ZT + ZB - 12) / 2, span - 4, 26, ZB - 12 - ZT));
        box(upper, M.emitter, X, Ys - s * 11.3, ZB, span - 12, 0.8, 20); // emitter face
        const lens = cyl(upper, G.silica, X, Ys - s * 14.5, ZB + 0, 1.6, span - 12, 'x', 12);
        lens.renderOrder = 2;
        for (let k = -2; k <= 2; k++) box(upper, M.gold, X + k * ((span - 16) / 5), Ys + s * 4, ZB + 12.3, 2.2, 12, 0.5); // ribbon bonds
        const pumpMat = new THREE.MeshBasicMaterial({
          color: COLORS.pump,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        });
        const beam = box(upper, pumpMat, X, Y + s * 16.5, ZB, span - 12, 15, 17);
        beam.renderOrder = 4;
        glow.push(beam);
      }
    }
    return glow;
  };
  const pumpPre = slabAssembly(325, ROW1, 1);
  const ROW2 = 250;
  const pumpA = slabAssembly(427, ROW2, 2);
  const pumpB = slabAssembly(297, ROW2, 2);

  // ---- (3) power amplifier optics --------------------------------------------
  const TFP_X = 505;
  foldMirror(TFP_X, ROW1, -1, -1);
  plateOptic(TFP_X, ROW2, -1, 1, 19, 3, G.silica); // thin-film polarizer
  plateOptic(362, ROW2, 1, 0, 13, 6, G.silica); // 90° quartz rotator
  plateOptic(231, ROW2, 1, 0, 13, 2.5, G.silica); // quarter-wave plate
  lensBarrel(218, ROW2, 12, 8);
  {
    // solid fused-silica SBS phase-conjugate mirror
    const cell = cyl(upper, G.silica, 172, ROW2, ZB, 13, 64, 'x');
    cell.renderOrder = 2;
    for (const X of [148, 196]) {
      cyl(upper, M.steel, X, ROW2, ZB, 15.5, 7, 'x');
      mountBlock(X, ROW2, 9, 28, ZB - 13);
    }
    box(upper, M.steel, 172, ROW2, ZT + 3, 66, 30, 6);
  }
  foldMirror(535, ROW2, -1, -1);

  // ---- (4) harmonic generation ----------------------------------------------
  const ROW3 = 110;
  foldMirror(535, ROW3, -1, 1);
  const oven = (X: number, len: number) => {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, len, 40, 1, true), M.titanium);
    body.material.side = THREE.DoubleSide;
    body.rotation.z = Math.PI / 2;
    body.position.copy(P(X, ROW3, ZB));
    upper.add(shadow(body));
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.RingGeometry(11.5, 21, 40), M.titanium);
      cap.material.side = THREE.DoubleSide;
      cap.rotation.y = Math.PI / 2;
      cap.position.copy(P(X + (s * len) / 2, ROW3, ZB));
      upper.add(cap);
    }
    cyl(upper, M.kapton, X, ROW3, ZB, 21.5, len * 0.5, 'x'); // heater wrap
    const xtal = box(upper, G.lbo, X, ROW3, ZB, len - 6, 19, 19);
    xtal.renderOrder = 2;
    mountBlock(X, ROW3, len - 6, 30, ZB - 20);
    // sensor leads
    tube(upper, M.silver, [[X - 6, ROW3 + 20, ZB + 8], [X - 4, ROW3 + 34, ZB - 4], [X + 4, ROW3 + 42, ZT + 3], [X + 22, ROW3 + 48, ZT + 2]], 0.9, 0.5);
    tube(upper, std('#d8d2c4', 0.3, 0.5), [[X + 6, ROW3 + 20, ZB + 8], [X + 9, ROW3 + 33, ZB - 6], [X + 16, ROW3 + 40, ZT + 3], [X + 32, ROW3 + 44, ZT + 2]], 0.9, 0.5);
  };
  oven(440, 38);
  oven(360, 42);
  const DICH_X = 280;
  plateOptic(DICH_X, ROW3, 1, -1, 19, 4, glass('#cdb8ff', 0.4)); // dichroic separator
  {
    // finned silicon carbide beam dump
    const X = 196;
    shadow(box(upper, M.blackMatte, X, ROW3, ZB, 40, 40, 40));
    for (let i = 0; i < 7; i++) box(upper, M.blackMatte, X - 18 + i * 6, ROW3, ZB + 23.5, 2.2, 40, 7);
    shadow(box(upper, M.steel, X, ROW3, (ZT + ZB - 20) / 2, 34, 34, ZB - 20 - ZT));
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(12, 3, 26, 32, 1, true), std('#050506', 0.1, 0.95, { side: THREE.DoubleSide }));
    throat.rotation.z = -Math.PI / 2;
    throat.position.copy(P(X + 8, ROW3, ZB));
    upper.add(throat);
    const mouth = new THREE.Mesh(new THREE.RingGeometry(12, 16, 32), M.blackMatte);
    mouth.rotation.y = Math.PI / 2;
    mouth.position.copy(P(X + 20.2, ROW3, ZB));
    upper.add(mouth);
  }

  // ---- (5) UV expander, exit window, shutter ----------------------------------
  foldMirror(DICH_X, EXIT_Y, -1, 1);
  lensBarrel(200, EXIT_Y, 12, 10);
  lensBarrel(110, EXIT_Y, 15, 12);
  {
    // Brewster-angle fused-silica window in the port, tilted about the vertical axis
    const win = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 5, 48), G.silica);
    win.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(0.97), 0, Math.sin(0.97)));
    win.position.copy(P(26, EXIT_Y, ZB));
    win.renderOrder = 2;
    upper.add(win);
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(27, 27, 34, 48, 1, true), M.titanium);
    bezel.material.side = THREE.DoubleSide;
    bezel.rotation.z = Math.PI / 2;
    bezel.position.copy(P(22, EXIT_Y, ZB));
    upper.add(shadow(bezel));
    // external shutter ring with the blade swung open
    const ring = new THREE.Mesh(new THREE.TorusGeometry(25, 4.5, 14, 48), M.titanium);
    ring.rotation.y = Math.PI / 2;
    ring.position.copy(P(-5, EXIT_Y, ZB));
    upper.add(shadow(ring));
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 2.5, 48), M.titanium);
    blade.rotation.z = Math.PI / 2;
    blade.rotation.y = -1.25;
    blade.position.copy(P(-22, EXIT_Y - 44, ZB));
    upper.add(shadow(blade));
    box(upper, M.steel, -7, EXIT_Y - 30, ZB, 12, 10, 14); // hinge and actuator
    cyl(upper, M.black, -7, EXIT_Y - 30, ZB - 16, 5, 20, 'z', 16);
  }

  // ---- oxygen purge micro-system ----------------------------------------------
  {
    const X = 84;
    const Yc = 205;
    cyl(upper, M.titanium, X, Yc, ZT + 22, 17, 46, 'y');
    for (const s of [-1, 1]) {
      const end = new THREE.Mesh(new THREE.SphereGeometry(17, 32, 16), M.titanium);
      end.position.copy(P(X, Yc + s * 23, ZT + 22));
      upper.add(shadow(end));
    }
    for (const s of [-1, 1]) box(upper, M.steel, X, Yc + s * 16, ZT + 4, 30, 8, 8);
    cyl(upper, M.steel, X, Yc - 46, ZT + 22, 5, 12, 'y', 16); // regulator
    box(upper, M.steel, X + 2, Yc - 58, ZT + 22, 14, 12, 12);
    tube(upper, M.steel, [[X + 9, Yc - 58, ZT + 22], [X + 24, Yc - 60, ZT + 14], [X + 40, Yc - 52, ZT + 4], [X + 62, Yc - 44, ZT + 2.5]], 1, 0.5);
  }

  shadow(upper);

  // ---- lower deck ------------------------------------------------------------
  // phase-change thermal capacitor under the amplifier slabs
  const foamTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#efe9da';
    ctx.fillRect(0, 0, 256, 256);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 520; i++) {
      const x = rnd() * 256;
      const y = rnd() * 256;
      const r = 4 + rnd() * 9;
      ctx.strokeStyle = `rgba(${150 + rnd() * 50}, ${88 + rnd() * 30}, 44, ${0.55 + rnd() * 0.4})`;
      ctx.lineWidth = 1.4 + rnd() * 1.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1.4);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const PCM = { x0: 232, x1: 492, y0: 176, y1: 322, z0: 12, z1: 60 };
  {
    const { x0, x1, y0, y1, z0, z1 } = PCM;
    const xc = (x0 + x1) / 2;
    const yc = (y0 + y1) / 2;
    box(lower, M.copper, xc, yc, (z0 + z1 - 4) / 2, x1 - x0, y1 - y0, z1 - z0 - 4);
    // lid with a window showing the wax-filled copper foam
    const lidZ = z1 - 2;
    box(lower, M.copper, xc, y1 - 12, lidZ, x1 - x0, 24, 4);
    box(lower, M.copper, xc, y0 + 12, lidZ, x1 - x0, 24, 4);
    box(lower, M.copper, x0 + 20, yc, lidZ, 40, y1 - y0 - 48, 4);
    box(lower, M.copper, x1 - 20, yc, lidZ, 40, y1 - y0 - 48, 4);
    const foam = box(lower, new THREE.MeshStandardMaterial({ map: foamTex, roughness: 0.7, metalness: 0.15 }), xc, yc, lidZ - 1.2, x1 - x0 - 80, y1 - y0 - 48, 1.5);
    foam.receiveShadow = true;
    // the same foam on the face revealed by the front cutaway
    const side = new THREE.Mesh(
      new THREE.PlaneGeometry(x1 - x0 - 60, z1 - z0 - 18),
      new THREE.MeshStandardMaterial({ map: foamTex, roughness: 0.7, metalness: 0.15 })
    );
    side.position.copy(P(xc, y0 - 0.4, (z0 + z1 - 4) / 2));
    lower.add(side);
    // braze seam and fill port
    cyl(lower, M.brass, x0 + 14, y0 + 12, z1 + 2, 4, 5, 'z', 16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cyl(lower, M.steel, x0 + 12 + i * ((x1 - x0 - 24) / 3), j ? y1 - 7 : y0 + 7, z1 + 0.5, 2.4, 1.5, 'z', 10);
  }
  // radiator interface flange on the right wall, fed by four heat pipes
  box(lower, M.gold, LEN + 6, 138, 38, 12, 96, 46);
  box(lower, M.copper, LEN - WALL - 5, 138, 38, 10, 84, 34);
  for (let i = 0; i < 4; i++) for (const dz of [-16, 16]) cyl(lower, M.steel, LEN + 12.5, 104 + i * 22.5, 38 + dz, 2.6, 2, 'x', 12);
  for (let i = 0; i < 4; i++) {
    const X = 268 + i * 44;
    const Yrun = 160 - i * 15;
    const Z = 30 + (i % 2) * 14;
    tube(lower, M.copper, [[X, PCM.y0 + 4, Z], [X, Yrun + 22, Z], [X + 8, Yrun + 6, Z], [X + 24, Yrun, Z], [LEN - WALL - 24, Yrun, Z], [LEN - WALL - 8, Yrun, Z]], 4, 0.08);
    cyl(lower, M.cuw, X, PCM.y0 - 1.5, Z, 6, 3, 'y', 20);
  }

  // power electronics: energy buffer, pulse capacitors, GaN drivers, control
  {
    box(lower, M.pcb, 132, 98, 13, 196, 152, 2.4);
    for (const [X, Y] of [[40, 28], [224, 28], [40, 168], [224, 168]] as const) cyl(lower, M.steel, X, Y, 9, 3, 6, 'z', 12);
    // burst energy buffer wrapped in polyimide tape
    box(lower, M.kapton, 82, 124, 37, 86, 76, 44);
    box(lower, M.black, 82, 124, 37, 87, 14, 45);
    box(lower, M.gold, 62, 84, 50, 10, 6, 6);
    box(lower, M.gold, 102, 84, 50, 10, 6, 6);
    // film pulse capacitors
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        box(lower, M.capBlue, 148 + i * 22, 118 + j * 24, 30, 18, 20, 30);
        box(lower, M.silver, 148 + i * 22, 118 + j * 24, 45.4, 12, 3, 0.8);
      }
    // GaN power stages with bus bars
    for (let i = 0; i < 6; i++) {
      box(lower, M.chip, 50 + i * 30, 46, 16.5, 16, 14, 4.5);
      box(lower, M.silver, 50 + i * 30, 46, 19, 9, 8, 0.6);
      box(lower, M.chip, 50 + i * 30, 68, 16, 8, 8, 3);
    }
    box(lower, M.copper, 126, 30, 18, 176, 5, 6);
    box(lower, M.copper, 126, 84, 17, 60, 4, 4);
    // control board with the rad-hard controller
    box(lower, M.pcb, 332, 86, 13, 176, 128, 2.4);
    box(lower, M.chip, 330, 92, 17, 36, 36, 5);
    box(lower, M.silver, 330, 92, 19.8, 28, 28, 0.8);
    for (let i = 0; i < 5; i++) box(lower, M.chip, 268 + i * 30, 44, 16, 14, 10, 3.5);
    for (let i = 0; i < 3; i++) box(lower, M.chip, 276, 76 + i * 22, 16, 10, 12, 3.5);
    box(lower, M.silver, 396, 132, 20, 34, 12, 12); // connector
    box(lower, M.silver, 396, 60, 19, 22, 10, 10);
    // harness between boards
    tube(lower, std('#cfd3d8', 0.7, 0.35), [[226, 60, 18], [236, 58, 24], [244, 62, 24], [252, 66, 18]], 2.2, 0.5);
    tube(lower, std('#cfd3d8', 0.7, 0.35), [[226, 72, 18], [236, 74, 26], [244, 78, 26], [252, 82, 18]], 2.2, 0.5);
    tube(lower, M.kapton, [[190, 100, 46], [205, 88, 40], [214, 70, 30], [214, 52, 20]], 2.6, 0.5);
  }
  shadow(lower);

  // ---- beams -----------------------------------------------------------------
  const beamMats: THREE.ShaderMaterial[] = [];
  const beams = new THREE.Group();
  upper.add(beams);
  const roundGeo = (r0: number, r1: number) => {
    const g = new THREE.CylinderGeometry(r1, r0, 1, 28, 1, false);
    g.translate(0, 0.5, 0);
    return g;
  };
  const squareGeo = (w0: number, w1: number) => {
    const g = new THREE.CylinderGeometry(w1 / Math.SQRT2, w0 / Math.SQRT2, 1, 4, 1, false);
    g.rotateY(Math.PI / 4);
    g.translate(0, 0.5, 0);
    return g;
  };
  const addBeam = (b: BeamSpec) => {
    const A = P(b.a[0], b.a[1], ZB);
    const B = P(b.b[0], b.b[1], ZB);
    const len = A.distanceTo(B);
    const k = b.scale ?? 1;
    const w0 = b.w0 * k;
    const w1 = (b.w1 ?? b.w0) * k;
    const geo = b.square ? squareGeo(w0, w1) : roundGeo(w0 / 2, w1 / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uColor: { value: b.color.clone() },
        uHead: { value: 0 },
        uSigma: { value: 85 },
        uS0: { value: b.s0 },
        uS1: { value: b.s1 ?? -1 },
        uLen: { value: len },
        uBase: { value: b.base ?? 0.5 },
        uBase2: { value: b.base2 ?? 0 },
        uPulse: { value: 1.5 },
        uFade: { value: b.fade ? 1 : 0 },
        uLive: { value: reduced ? 0 : 1 },
      },
    });
    beamMats.push(mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(A);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.scale.set(1, len, 1);
    m.renderOrder = 6;
    beams.add(m);
    return len;
  };

  // Path coordinate s (mm) runs from the oscillator to the exit port.
  const { ir, green, uv } = COLORS;
  let s = 0;
  s += addBeam({ a: [105, ROW1], b: [212, ROW1], w0: 3, color: ir, s0: s, base: 0.7 });
  s += addBeam({ a: [212, ROW1], b: [250, ROW1], w0: 3, w1: 15, color: ir, s0: s, base: 0.7 });
  s += addBeam({ a: [250, ROW1], b: [TFP_X, ROW1], w0: 15, square: true, color: ir, s0: s, base: 0.75 });
  s += addBeam({ a: [TFP_X, ROW1], b: [TFP_X, ROW2], w0: 15, square: true, color: ir, s0: s, base: 0.75 });
  // double pass through the slabs to the phase-conjugate mirror and back
  const L1 = TFP_X - 218;
  const L2 = 218 - 176;
  addBeam({ a: [TFP_X, ROW2], b: [218, ROW2], w0: 15, square: true, color: ir, s0: s, s1: s + L1 + 2 * L2, base: 0.6, base2: 0.7 });
  addBeam({ a: [218, ROW2], b: [176, ROW2], w0: 15, w1: 1.5, color: ir, s0: s + L1, s1: s + L1 + L2, base: 0.6, base2: 0.7 });
  const sSlabOut = s + 2 * (L1 + L2) - (TFP_X - 482); // return pass leaves slab A
  s += 2 * (L1 + L2);
  s += addBeam({ a: [TFP_X, ROW2], b: [535, ROW2], w0: 15, square: true, color: ir, s0: s, base: 0.95 });
  s += addBeam({ a: [535, ROW2], b: [535, ROW3], w0: 15, square: true, color: ir, s0: s, base: 0.95 });
  s += addBeam({ a: [535, ROW3], b: [440, ROW3], w0: 15, square: true, color: ir, s0: s, base: 0.95 });
  // after the first crystal: green with residual infrared
  addBeam({ a: [440, ROW3], b: [360, ROW3], w0: 15, square: true, color: ir, s0: s, base: 0.3 });
  s += addBeam({ a: [440, ROW3], b: [360, ROW3], w0: 15, square: true, color: green, s0: s, base: 0.55, scale: 0.72 });
  // after the second crystal: ultraviolet with residual green and infrared
  addBeam({ a: [360, ROW3], b: [DICH_X, ROW3], w0: 15, square: true, color: ir, s0: s, base: 0.16 });
  addBeam({ a: [360, ROW3], b: [DICH_X, ROW3], w0: 15, square: true, color: green, s0: s, base: 0.22, scale: 0.8 });
  s += addBeam({ a: [360, ROW3], b: [DICH_X, ROW3], w0: 15, square: true, color: uv, s0: s, base: 1.0, scale: 0.6 });
  // residual to the dump
  addBeam({ a: [DICH_X, ROW3], b: [212, ROW3], w0: 15, square: true, color: ir, s0: s, base: 0.2 });
  addBeam({ a: [DICH_X, ROW3], b: [212, ROW3], w0: 15, square: true, color: green, s0: s, base: 0.3, scale: 0.72 });
  // ultraviolet to the exit
  s += addBeam({ a: [DICH_X, ROW3], b: [DICH_X, EXIT_Y], w0: 15, square: true, color: uv, s0: s, base: 1.0 });
  s += addBeam({ a: [DICH_X, EXIT_Y], b: [200, EXIT_Y], w0: 15, square: true, color: uv, s0: s, base: 1.0 });
  s += addBeam({ a: [200, EXIT_Y], b: [110, EXIT_Y], w0: 16, w1: 20, color: uv, s0: s, base: 1.0 });
  s += addBeam({ a: [110, EXIT_Y], b: [-8, EXIT_Y], w0: 20, color: uv, s0: s, base: 1.0 });
  s += addBeam({ a: [-8, EXIT_Y], b: [-560, EXIT_Y], w0: 20, color: uv, s0: s, base: 1.0, fade: true });
  const S_END = s;

  // ---- labels ----------------------------------------------------------------
  interface Label {
    el: HTMLElement;
    pos: THREE.Vector3;
    group: THREE.Group;
  }
  const labels: Label[] = [];
  const addLabel = (text: string, X: number, Y: number, Z: number, group: THREE.Group, side: 'l' | 'r' = 'r', lift = 14) => {
    if (!labelHost) return;
    const el = document.createElement('div');
    el.className = `slp-label slp-label-${side}`;
    el.style.setProperty('--lift', `${lift}px`);
    el.innerHTML = `<i></i><span>${text}</span>`;
    labelHost.appendChild(el);
    labels.push({ el, pos: P(X, Y, Z), group });
  };
  addLabel('Master oscillator', 70, ROW1, ZT + 44, upper, 'l');
  addLabel('Pre-amplifier', 325, ROW1, ZB + 22, upper);
  addLabel('Power amplifier slabs and 885 nm diode stacks', 427, ROW2 + 30, ZB + 14, upper, 'r', 30);
  addLabel('Phase-conjugate mirror', 172, ROW2, ZB + 16, upper, 'r', 34);
  addLabel('LBO harmonic crystals', 400, ROW3, ZB + 24, upper);
  addLabel('Beam dump', 196, ROW3, ZB + 30, upper, 'l');
  addLabel('Exit window and shutter', -5, EXIT_Y, ZB + 30, upper, 'l');
  addLabel('Oxygen reserve', 84, 205, ZT + 42, upper, 'l');
  addLabel('Wax-and-copper thermal capacitor', 262, 180, 58, lower, 'l', 14);
  addLabel('Heat pipes to radiator', 500, 130, 44, lower, 'r', 14);
  addLabel('Energy buffer and diode drivers', 110, 40, 50, lower, 'l');

  // ---- camera, controls, post -------------------------------------------------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 500;
  controls.maxDistance = 2600;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.zoomSpeed = 0.6;
  // Page scroll should not be trapped: zoom only with ctrl/pinch.
  renderer.domElement.addEventListener(
    'wheel',
    e => {
      if (!e.ctrlKey && !e.metaKey) e.stopImmediatePropagation();
    },
    { capture: true }
  );
  renderer.domElement.style.touchAction = 'pan-y';

  const target = new THREE.Vector3(-70, 58, 10);
  const home = { az: -0.62, pol: 0.98, r: 1120 };
  let aspectFit = 1;
  const placeCamera = (az: number, pol: number, r: number) => {
    const rr = r * aspectFit;
    camera.position.set(
      target.x + rr * Math.sin(pol) * Math.sin(az),
      target.y + rr * Math.cos(pol),
      target.z + rr * Math.sin(pol) * Math.cos(az)
    );
    camera.lookAt(target);
  };
  controls.target.copy(target);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.5, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let userActive = false;
  let lastInteraction = -1e9;
  controls.addEventListener('start', () => {
    userActive = true;
  });
  controls.addEventListener('end', () => {
    userActive = false;
    lastInteraction = performance.now();
  });

  const resize = () => {
    const w = canvasHost.clientWidth || 1;
    const h = canvasHost.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    aspectFit = Math.max(1, 1.62 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvasHost);
  resize();
  placeCamera(home.az, home.pol, home.r);

  // ---- animation state --------------------------------------------------------
  let explodeMode: boolean | 'auto' = reduced ? false : 'auto';
  let explode = 0;
  let showLabels = true;
  let paused = false;
  let visible = true;
  let disposed = false;
  let raf = 0;
  let tAnim = 0;
  let last = performance.now();

  const PUMP_LEAD = 0.75; // s of pump glow before the pulse leaves the oscillator
  const SPEED = 820; // mm/s on screen; the real pulse crosses in nanoseconds
  const CYCLE = PUMP_LEAD + (S_END + 260) / SPEED + 0.35;
  const EXPLODE_PERIOD = 26;
  const sPreIn = 270 - 105;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const v = new THREE.Vector3();

  const setPump = (meshes: THREE.Mesh[], level: number) => {
    for (const m of meshes) (m.material as THREE.MeshBasicMaterial).opacity = level * 0.2;
  };

  const frame = (now: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    if (!paused && !reduced) tAnim += dt;

    // pulse head and pump envelope
    const tc = tAnim % CYCLE;
    const head = reduced ? 1e6 : (tc - PUMP_LEAD) * SPEED;
    for (const m of beamMats) m.uniforms.uHead.value = head;
    const charge = reduced ? 0.6 : Math.min(1, tc / PUMP_LEAD);
    const preOn = reduced ? 0.6 : head < sPreIn + 110 ? charge : Math.max(0, 1 - (head - sPreIn - 110) / 120);
    const ampOn = reduced ? 0.6 : head < sSlabOut ? charge : Math.max(0, 1 - (head - sSlabOut) / 160);
    setPump(pumpPre, preOn);
    setPump(pumpA, ampOn);
    setPump(pumpB, ampOn);
    M.emitter.emissiveIntensity = 0.9 * Math.max(preOn, ampOn);
    yagMats.forEach((m, i) => (m.emissiveIntensity = (i === 1 ? preOn : i === 0 ? 0.25 : ampOn) * 0.3));

    // exploded view
    const idle = now - lastInteraction > 3500 && !userActive;
    let targetExplode = 0;
    if (explodeMode === 'auto') {
      const te = tAnim % EXPLODE_PERIOD;
      targetExplode = te > 13 && te < 23.5 ? 1 : 0;
    } else targetExplode = explodeMode ? 1 : 0;
    explode += (targetExplode - explode) * Math.min(1, dt * 2.2);
    const e = ease(Math.min(1, Math.max(0, explode)));
    upper.position.y = e * 150;
    lid.position.y = e * 230;

    // camera: gentle sway unless the viewer is driving
    if (idle && !reduced) {
      const az = home.az + 0.3 * Math.sin(tAnim * 0.21) + e * 0.12;
      const pol = home.pol - 0.05 * Math.sin(tAnim * 0.13) - e * 0.1;
      const cur = new THREE.Spherical().setFromVector3(v.copy(camera.position).sub(controls.target));
      const blend = Math.min(1, dt * 1.4);
      cur.theta += (az - cur.theta) * blend;
      cur.phi += (pol - cur.phi) * blend;
      cur.radius += (home.r * aspectFit * (1 + e * 0.36) - cur.radius) * blend;
      controls.target.y += (target.y + e * 62 - controls.target.y) * blend;
      camera.position.setFromSpherical(cur).add(controls.target);
      camera.lookAt(controls.target);
    } else {
      controls.update();
    }

    composer.render();

    // labels
    if (labelHost) {
      const w = canvasHost.clientWidth;
      const h = canvasHost.clientHeight;
      const small = w < 720;
      for (const l of labels) {
        const lowerHidden = l.group === lower && e < 0.6;
        const upperCrowded = l.group === upper && e > 0.4 && small;
        v.copy(l.pos);
        l.group.localToWorld(v);
        v.project(camera);
        const on = showLabels && !small && !lowerHidden && !upperCrowded && v.z < 1 && Math.abs(v.x) < 0.98 && Math.abs(v.y) < 0.96;
        l.el.style.opacity = on ? '1' : '0';
        if (on) l.el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      }
    }
  };

  const io = new IntersectionObserver(
    entries => {
      visible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0.02 }
  );
  io.observe(container);
  const onVis = () => {
    if (document.hidden) visible = false;
    else last = performance.now();
  };
  document.addEventListener('visibilitychange', onVis);

  // warm up: compile, then report ready after the first frame
  renderer.compile(scene, camera);
  raf = requestAnimationFrame(t => {
    last = t;
    frame(t);
    opts.onReady?.();
  });

  return {
    setExploded(val) {
      explodeMode = val;
    },
    setLabels(val) {
      showLabels = val;
    },
    setPaused(val) {
      paused = val;
    },
    resetView() {
      lastInteraction = -1e9;
      controls.target.copy(target);
      placeCamera(home.az, home.pol, home.r);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach(x => x.dispose());
        else mat?.dispose();
      });
      envTex.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
