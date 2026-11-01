import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from './ShepherdViewer.module.css';

/**
 * Interactive viewer for the Shepherd-1 model (public/shepherd/shepherd-1.glb).
 *
 * The GLB is produced by scripts/shepherd/build_shepherd_model.py. Every mesh
 * carries userData.subsystem / label / part; each subsystem has a root node
 * named `sub_<id>` with userData.explode (Blender Z-up vector) and a colour.
 * Gimbal axes are the nodes `gimbal_az` and `gimbal_el`.
 */

export interface SubsystemMeta {
  id: string;
  label: string;
  color: string;
  summary: string;
  vendors: string;
}

interface Props {
  src?: string;
  subsystems: SubsystemMeta[];
  autoRotate?: boolean;
}

type SubsystemRoot = { id: string; node: THREE.Object3D; base: THREE.Vector3; explode: THREE.Vector3 };

const blenderToThree = (v: number[]) => new THREE.Vector3(v[0] ?? 0, v[2] ?? 0, -(v[1] ?? 0));

function useSubsystemRoots(scene: THREE.Object3D) {
  return useMemo(() => {
    const roots: SubsystemRoot[] = [];
    scene.traverse((node) => {
      if (node.name.startsWith('sub_') && node.userData?.explode) {
        const explode = Array.isArray(node.userData.explode)
          ? blenderToThree(node.userData.explode as number[])
          : new THREE.Vector3();
        roots.push({ id: String(node.userData.subsystem), node, base: node.position.clone(), explode });
      }
    });
    return roots;
  }, [scene]);
}

function findSubsystem(obj: THREE.Object3D | null): string | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.subsystem) return String(cur.userData.subsystem);
    cur = cur.parent;
  }
  return null;
}

function Model({
  src,
  explodeFactor,
  selected,
  hovered,
  setHovered,
  setSelected,
  showOverlay,
  showLabels,
  subsystems,
  slewGimbal,
}: {
  src: string;
  explodeFactor: number;
  selected: string | null;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  showOverlay: boolean;
  showLabels: boolean;
  subsystems: SubsystemMeta[];
  slewGimbal: boolean;
}) {
  const { scene } = useGLTF(src);
  const roots = useSubsystemRoots(scene);
  const meshesBySubsystem = useMemo(() => {
    const map = new Map<string, THREE.Mesh[]>();
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const id = findSubsystem(mesh);
        if (id) {
          if (!map.has(id)) map.set(id, []);
          map.get(id)!.push(mesh);
        }
        // Clone materials so highlights do not bleed between subsystems
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const std = m as THREE.MeshStandardMaterial;
          std.userData.baseEmissive = std.emissive ? std.emissive.clone() : new THREE.Color(0);
          std.userData.baseEmissiveIntensity = std.emissiveIntensity ?? 1;
          if (mesh.userData.overlay) {
            std.transparent = true;
            std.depthWrite = false;
          }
        }
      }
    });
    return map;
  }, [scene]);

  const colorById = useMemo(() => new Map(subsystems.map((s) => [s.id, new THREE.Color(s.color)])), [subsystems]);

  // Explode + highlight
  useEffect(() => {
    for (const r of roots) {
      r.node.position.copy(r.base).addScaledVector(r.explode, explodeFactor);
    }
  }, [roots, explodeFactor]);

  useEffect(() => {
    for (const [id, meshes] of meshesBySubsystem) {
      const active = id === selected || id === hovered;
      const dim = (selected || hovered) && !active;
      for (const mesh of meshes) {
        if (mesh.userData.overlay) {
          mesh.visible = showOverlay;
          continue;
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const std = m as THREE.MeshStandardMaterial;
          if (!std.emissive) continue;
          if (active) {
            std.emissive.copy(colorById.get(id) ?? new THREE.Color('#ffffff'));
            std.emissiveIntensity = 0.35;
          } else {
            std.emissive.copy(std.userData.baseEmissive as THREE.Color);
            std.emissiveIntensity = std.userData.baseEmissiveIntensity as number;
          }
          std.opacity = dim ? 0.35 : 1;
          std.transparent = dim || Boolean(mesh.userData.overlay);
          std.depthWrite = !dim;
        }
      }
    }
  }, [meshesBySubsystem, selected, hovered, showOverlay, colorById]);

  // Subtle gimbal motion so the mechanism reads as live
  const az = useMemo(() => scene.getObjectByName('gimbal_az'), [scene]);
  const el = useMemo(() => scene.getObjectByName('gimbal_el'), [scene]);
  const baseAz = useRef<THREE.Euler | null>(null);
  const baseEl = useRef<THREE.Euler | null>(null);
  useFrame(({ clock }) => {
    if (!slewGimbal) return;
    const t = clock.getElapsedTime();
    if (az) {
      if (!baseAz.current) baseAz.current = az.rotation.clone();
      az.rotation.set(baseAz.current.x, baseAz.current.y + Math.sin(t * 0.35) * 0.05, baseAz.current.z);
    }
    if (el) {
      if (!baseEl.current) baseEl.current = el.rotation.clone();
      el.rotation.set(baseEl.current.x, baseEl.current.y, baseEl.current.z + Math.sin(t * 0.5 + 1) * 0.03);
    }
  });

  // Label anchors: bounding-box centres of each subsystem in world space, with a
  // leader line out to a staggered label position. Recomputed after explode moves.
  const [anchors, setAnchors] = useState<{ id: string; pos: THREE.Vector3; label: THREE.Vector3 }[]>([]);
  useEffect(() => {
    scene.updateMatrixWorld(true);
    const centre = new THREE.Vector3(-0.3, 0.1, 0);
    const out: { id: string; pos: THREE.Vector3; label: THREE.Vector3 }[] = [];
    const order = subsystems.map((s) => s.id);
    for (const [id, meshes] of meshesBySubsystem) {
      const box = new THREE.Box3();
      for (const mesh of meshes) {
        if (mesh.userData.overlay) continue;
        box.expandByObject(mesh);
      }
      if (box.isEmpty()) continue;
      const pos = box.getCenter(new THREE.Vector3());
      // Arrays and radiators are large: anchor near the body rather than the panel centre
      if (id === 'solar_arrays') pos.set(0, 0.9, 0.62);
      if (id === 'radiators') pos.set(0, 0.2, -1.4);
      const idx = Math.max(0, order.indexOf(id));
      const dir = pos.clone().sub(centre);
      dir.y = 0;
      if (dir.lengthSq() < 1e-4) dir.set(Math.cos(idx), 0, Math.sin(idx));
      dir.normalize();
      const label = pos.clone().addScaledVector(dir, 0.9 + 0.12 * (idx % 3)).add(new THREE.Vector3(0, 0.55 - 0.16 * (idx % 5), 0));
      out.push({ id, pos, label });
    }
    setAnchors(out);
  }, [meshesBySubsystem, explodeFactor, scene, subsystems]);

  return (
    <group
      onPointerMove={(e) => {
        e.stopPropagation();
        setHovered(findSubsystem(e.object));
      }}
      onPointerOut={() => setHovered(null)}
      onClick={(e) => {
        e.stopPropagation();
        const id = findSubsystem(e.object);
        setSelected(id === selected ? null : id);
      }}
    >
      <primitive object={scene} />
      {showLabels &&
        anchors.map((a) => {
          const meta = subsystems.find((s) => s.id === a.id);
          if (!meta) return null;
          const active = a.id === selected || a.id === hovered;
          const dim = (selected || hovered) && !active;
          return (
            <group key={a.id}>
              <Line points={[a.pos, a.label]} color={meta.color} lineWidth={1} transparent opacity={dim ? 0.15 : 0.55} depthTest={false} />
              <mesh position={a.pos}>
                <sphereGeometry args={[0.018, 12, 12]} />
                <meshBasicMaterial color={meta.color} transparent opacity={dim ? 0.2 : 0.9} depthTest={false} />
              </mesh>
              <Html position={a.label} center distanceFactor={5.5} zIndexRange={[10, 0]} style={{ pointerEvents: 'none', opacity: dim ? 0.25 : 1 }}>
                <div className={`${styles.callout} ${active ? styles.calloutActive : ''}`} style={{ borderColor: meta.color }}>
                  <span style={{ background: meta.color }} />
                  {meta.label}
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );
}

function Stars({ count = 2600 }: { count?: number }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 + Math.random() * 60;
      const th = Math.acos(2 * Math.random() - 1);
      const ph = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
      pos[i * 3 + 1] = r * Math.cos(th);
      pos[i * 3 + 2] = r * Math.sin(th) * Math.sin(ph);
      const b = 0.4 + Math.random() * 0.6;
      col[i * 3] = b;
      col[i * 3 + 1] = b;
      col[i * 3 + 2] = b * (0.9 + Math.random() * 0.1);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);
  return (
    <points geometry={geom}>
      <pointsMaterial size={0.35} vertexColors sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

function Earth() {
  // Stylised limb below the spacecraft (three.js Y-up: nadir is -Y)
  return (
    <group position={[0, -84, 0]}>
      <mesh>
        <sphereGeometry args={[72, 96, 64]} />
        <meshStandardMaterial color="#0b2a55" roughness={0.9} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[73.3, 96, 64]} />
        <meshBasicMaterial color="#3a7fe0" transparent opacity={0.16} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function SceneSetup({ videoMode }: { videoMode: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = videoMode ? 1.15 : 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, videoMode]);
  return null;
}

function Loader() {
  return (
    <Html center>
      <div className={styles.loader}>Loading Shepherd-1 model…</div>
    </Html>
  );
}

export default function ShepherdViewer({ src = '/shepherd/shepherd-1.glb', subsystems, autoRotate = true }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [rotate, setRotate] = useState(autoRotate);
  const [videoMode, setVideoMode] = useState(false);
  const [slewGimbal, setSlewGimbal] = useState(true);

  const active = useMemo(() => subsystems.find((s) => s.id === (selected ?? hovered)) ?? null, [subsystems, selected, hovered]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'v') setVideoMode((v) => !v);
    if (e.key === 'Escape') {
      setVideoMode(false);
      setSelected(null);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  return (
    <div className={`${styles.shell} ${videoMode ? styles.video : ''}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [-3.9, 1.9, 3.4], fov: 38, near: 0.05, far: 600 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => setSelected(null)}
      >
        <color attach="background" args={['#04060a']} />
        <SceneSetup videoMode={videoMode} />
        {/* Sun from the -Y side of the body frame. Blender -Y maps to three.js +Z. */}
        <directionalLight position={[-6, 7, 22]} intensity={4.2} color="#fff4e6" />
        {/* Earthshine fill from below */}
        <hemisphereLight args={['#1a2535', '#3b6fc9', 0.55]} />
        <ambientLight intensity={0.08} />
        <Suspense fallback={<Loader />}>
          <Model
            src={src}
            explodeFactor={explodeFactor}
            selected={selected}
            hovered={hovered}
            setHovered={setHovered}
            setSelected={setSelected}
            showOverlay={showOverlay}
            showLabels={showLabels && !videoMode}
            subsystems={subsystems}
            slewGimbal={slewGimbal}
          />
        </Suspense>
        <Stars />
        <Earth />
        <OrbitControls
          enablePan={false}
          minDistance={1.4}
          maxDistance={40}
          autoRotate={rotate}
          autoRotateSpeed={videoMode ? 0.5 : 0.8}
          target={[-0.35, 0.2, 0]}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>

      {!videoMode && (
        <>
          <div className={styles.panel}>
            <p className={styles.eyebrow}>Shepherd-1 · subsystems</p>
            <ul className={styles.list}>
              {subsystems.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`${styles.item} ${selected === s.id ? styles.itemActive : ''}`}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(selected === s.id ? null : s.id)}
                  >
                    <i style={{ background: s.color }} />
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.detail} aria-live="polite">
            {active ? (
              <>
                <p className={styles.eyebrow} style={{ color: active.color }}>
                  {active.label}
                </p>
                <p className={styles.summary}>{active.summary}</p>
                <p className={styles.vendors}>
                  <span>Candidates</span> {active.vendors}
                </p>
              </>
            ) : (
              <>
                <p className={styles.eyebrow}>Shepherd-1</p>
                <p className={styles.summary}>
                  Drag to orbit, scroll to zoom. Hover or click a subsystem for its role and candidate hardware. Press{' '}
                  <kbd>v</kbd> for a clean video view.
                </p>
              </>
            )}
          </div>

          <div className={styles.controls}>
            <label>
              <span>Exploded view</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explodeFactor}
                onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
              />
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} /> Beam & target
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> Labels
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={rotate} onChange={(e) => setRotate(e.target.checked)} /> Auto-rotate
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={slewGimbal} onChange={(e) => setSlewGimbal(e.target.checked)} /> Gimbal motion
            </label>
            <button type="button" className={styles.videoBtn} onClick={() => setVideoMode(true)}>
              Video view
            </button>
          </div>
        </>
      )}
      {videoMode && <button type="button" className={styles.exitVideo} onClick={() => setVideoMode(false)}>Exit video view (Esc)</button>}
    </div>
  );
}

useGLTF.preload('/shepherd/shepherd-1.glb');
