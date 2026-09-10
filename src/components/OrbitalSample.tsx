import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Billboard, Html, Line, OrbitControls } from '@react-three/drei';
import {
  Component,
  Suspense,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import styles from './OrbitalSample.module.css';
import {
  samplePosition,
  sampleBodyQuaternion,
  orbitalTelemetry,
} from '../lib/orbitalTelemetry';

export type OrbitObjectKind = 'reference' | 'relay' | 'imager' | 'earth';
type Vector3Tuple = [number, number, number];
type QuaternionTuple = [number, number, number, number];

export interface OrbitalScene {
  epochUtc: string;
  body: {
    name: string;
    radiusKm: number;
    polarRadiusKm?: number;
    muKm3S2: number;
    textureUrl?: string;
    texturePrimeMeridianU?: number;
    atmosphereColor?: string;
  };
  frame: { name: string; description: string; axisMapping?: string };
  durationSeconds: number;
  stepSeconds: number;
  sunDirection: Vector3Tuple;
  samples?: Array<{
    timeSeconds: number;
    renderBodyQuaternion: QuaternionTuple;
    sunDirection?: Vector3Tuple;
  }>;
  objects: Array<{
    id: string;
    name: string;
    kind: OrbitObjectKind;
    classification: 'published_reference' | 'hypothetical';
    color: string;
    positionsKm: Vector3Tuple[];
    velocitiesKmS?: Vector3Tuple[];
  }>;
  metadata: {
    title?: string;
    sources?: Array<{ label: string; url?: string }>;
    fidelity: string;
    historicalPeriod?: string;
    speedMultiplier?: 60 | 120;
  };
}

interface Props {
  src: string;
  className?: string;
}

function mapPoint(point: Vector3Tuple, scale: number): Vector3Tuple {
  return [point[0] / scale, point[2] / scale, -point[1] / scale];
}

function TexturedBody({
  scene,
  scale,
  time,
}: {
  scene: OrbitalScene;
  scale: number;
  time: number;
}) {
  const texture = useLoader(
    THREE.TextureLoader,
    scene.body.textureUrl || '/images/mars-texture.jpg'
  );
  const quaternion = useMemo(
    () => sampleBodyQuaternion(scene, time),
    [scene, time]
  );
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);
  const radius = scene.body.radiusKm / scale;
  const polarScale =
    (scene.body.polarRadiusKm || scene.body.radiusKm) / scene.body.radiusKm;
  const isEarth = scene.body.name.toLowerCase().includes('earth');
  return (
    <group quaternion={quaternion || undefined} scale-y={polarScale}>
      <mesh
        castShadow
        receiveShadow
        rotation-y={scene.body.texturePrimeMeridianU === 0 ? Math.PI : 0}
      >
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * (isEarth ? 1.018 : 1.006), 48, 32]} />
        <meshBasicMaterial
          color={
            scene.body.atmosphereColor || (isEarth ? '#7bbcff' : '#d98b68')
          }
          transparent
          opacity={isEarth ? 0.1 : 0.025}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function CameraRig({ distance }: { distance: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(distance * 0.8, distance * 0.46, distance);
    camera.near = Math.max(0.001, distance / 10000);
    camera.far = distance * 20;
    camera.updateProjectionMatrix();
  }, [camera, distance]);
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={0.7}
    />
  );
}

function OrbitalWorld({
  scene,
  time,
  selected,
  onSelect,
  fitAll,
}: {
  scene: OrbitalScene;
  time: number;
  selected: string | null;
  onSelect: (id: string) => void;
  fitAll: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { events } = useThree();
  useEffect(() => {
    events.update?.();
  }, [time, events]);
  const scale = scene.body.radiusKm;
  const { maxRadius, paths } = useMemo(() => {
    let maximum = scene.body.radiusKm;
    const mapped = scene.objects.map(object => ({
      id: object.id,
      points: object.positionsKm.map(point => {
        maximum = Math.max(maximum, new THREE.Vector3(...point).length());
        return mapPoint(point, scene.body.radiusKm);
      }),
    }));
    return {
      maxRadius: maximum,
      paths: new Map(mapped.map(path => [path.id, path.points])),
    };
  }, [scene.body.radiusKm, scene.objects]);
  const distance = fitAll ? Math.max(3.1, (maxRadius / scale) * 2.2) : 3.1;
  const sun = useMemo(() => {
    const samples = scene.samples;
    let inertialDirection = scene.sunDirection;
    if (samples?.length && samples.some(sample => sample.sunDirection)) {
      const cursor = Math.max(
        0,
        Math.min(samples.length - 1, time / scene.stepSeconds)
      );
      const lower = Math.floor(cursor);
      const upper = Math.min(samples.length - 1, lower + 1);
      const first = new THREE.Vector3(
        ...(samples[lower].sunDirection || scene.sunDirection)
      );
      const second = new THREE.Vector3(
        ...(samples[upper].sunDirection || scene.sunDirection)
      );
      inertialDirection = first
        .lerp(second, cursor - lower)
        .normalize()
        .toArray() as Vector3Tuple;
    }
    return new THREE.Vector3(...mapPoint(inertialDirection, 1))
      .normalize()
      .multiplyScalar(8);
  }, [scene.samples, scene.stepSeconds, scene.sunDirection, time]);
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={sun} intensity={2.7} castShadow={false} />
      <Suspense fallback={null}>
        <TexturedBody scene={scene} scale={scale} time={time} />
      </Suspense>
      {scene.objects.map(object => {
        const points = paths.get(object.id) || [];
        const position = mapPoint(
          samplePosition(
            object.positionsKm,
            object.velocitiesKmS,
            time,
            scene.stepSeconds
          ),
          scale
        );
        const active = selected === object.id;
        return (
          <group
            key={object.id}
            onPointerOver={event => {
              event.stopPropagation();
              setHovered(object.id);
            }}
            onPointerOut={() =>
              setHovered(current => (current === object.id ? null : current))
            }
          >
            {points.length > 1 && (
              <Line
                points={points}
                color={object.color}
                lineWidth={active ? 2.2 : 1.1}
                transparent
                opacity={active ? 0.95 : 0.52}
              />
            )}
            {hovered === object.id && (
              <Html
                position={position}
                center
                style={{ pointerEvents: 'none' }}
                zIndexRange={[10, 0]}
              >
                <div className={styles.hoverLabel} role="tooltip">
                  {object.name}
                  <small>{object.id}</small>
                </div>
              </Html>
            )}
            <Billboard position={position}>
              <mesh
                onClick={event => {
                  event.stopPropagation();
                  onSelect(object.id);
                }}
              >
                <circleGeometry args={[active ? 0.035 : 0.024, 20]} />
                <meshBasicMaterial color={object.color} toneMapped={false} />
              </mesh>
            </Billboard>
          </group>
        );
      })}
      <CameraRig distance={distance} />
    </>
  );
}

class CanvasBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function TelemetryPanel({
  id,
  scene,
  object,
  time,
  currentUtc,
  onClose,
}: {
  id: string;
  scene: OrbitalScene;
  object: OrbitalScene['objects'][number];
  time: number;
  currentUtc: string;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, [object.id]);
  const state = orbitalTelemetry(scene, object, time);
  const number = (value: number, digits = 3) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  const vector = (values: Vector3Tuple, digits = 3) =>
    values.map(value => number(value, digits)).join(' / ');
  const rows = [
    ['Sample UTC', currentUtc],
    ['Elapsed time', `${number(time, 1)} s`],
    ['Center distance', `${number(state.radius)} km`],
    ['Altitude above equatorial radius', `${number(state.altitude)} km`],
    ['Inertial speed', `${number(state.speed, 5)} km/s`],
    ['Radial speed (+ outward)', `${number(state.radialSpeed, 5)} km/s`],
    ['Inertial X / Y / Z (km)', vector(state.position)],
    ['Inertial VX / VY / VZ (km/s)', vector(state.velocity, 5)],
    ...(state.bodyFixed
      ? [
          ['Body-fixed X / Y / Z (km)', vector(state.bodyFixed)],
          ['Planetocentric latitude', `${number(state.latitude!, 4)}°`],
          ['Longitude (east positive)', `${number(state.longitude!, 4)}°`],
        ]
      : []),
  ];
  return (
    <section
      id={id}
      ref={panel}
      tabIndex={-1}
      className={styles.telemetry}
      aria-label={`${object.name} telemetry`}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header>
        <div>
          <small>Sample telemetry · {object.id}</small>
          <h3>{object.name}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close telemetry">
          ×
        </button>
      </header>
      <table>
        <caption>Orbital state at the displayed simulation time</caption>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Interpolated sample data, not live spacecraft telemetry. Frame:{' '}
        {scene.frame.name}.
        {state.bodyFixed &&
          ` Body-fixed coordinates follow the displayed ${scene.body.name} rotation.`}{' '}
        Altitude uses the equatorial reference radius, not terrain elevation.
      </p>
    </section>
  );
}

function LoadedOrbitalSample({
  scene,
  className = '',
}: {
  scene: OrbitalScene;
  className?: string;
}) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(
    scene.objects[0]?.id ?? null
  );
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const telemetryId = useId();
  const selectionTrigger = useRef<HTMLElement | null>(null);
  const closeTelemetry = () => {
    setTelemetryOpen(false);
    selectionTrigger.current?.focus({ preventScroll: true });
  };
  const selectObject = (id: string) => {
    if (document.activeElement instanceof HTMLElement)
      selectionTrigger.current = document.activeElement;
    setSelected(id);
    setTelemetryOpen(true);
  };
  const [fitAll, setFitAll] = useState(false);
  const [visible, setVisible] = useState(true);
  const host = useRef<HTMLElement>(null);
  const speed = scene.metadata.speedMultiplier || 120;
  const selectedObject = scene.objects.find(object => object.id === selected);
  const currentUtc = new Date(
    new Date(scene.epochUtc).getTime() + time * 1000
  ).toISOString();
  const categories = useMemo(() => {
    if (scene.objects.every(object => object.kind === 'earth')) {
      return [{ label: 'Hypothetical Earth fleet', color: '#62d9ff' }];
    }
    const items = [];
    if (
      scene.objects.some(
        object => object.classification === 'published_reference'
      )
    )
      items.push({ label: 'Historical', color: '#e8bd68' });
    if (scene.objects.some(object => object.kind === 'relay'))
      items.push({ label: 'Proposed relay', color: '#62d9ff' });
    if (scene.objects.some(object => object.kind === 'imager'))
      items.push({ label: 'Proposed imager', color: '#b28cff' });
    return items;
  }, [scene.objects]);
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !visible || reducedMotion) return;
    let frame = 0;
    let prior = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(0.1, (now - prior) / 1000);
      prior = now;
      setTime(value => (value + elapsed * speed) % scene.durationSeconds);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, visible, reducedMotion, speed, scene.durationSeconds]);
  const fallback = (
    <div
      className={styles.fallback}
      role="img"
      aria-label={`${scene.body.name} orbital sample unavailable in WebGL`}
    >
      <strong>
        {scene.metadata.title || `${scene.body.name} orbital sample`}
      </strong>
      <span>
        {scene.objects.length} scene objects ·{' '}
        {scene.metadata.historicalPeriod || scene.epochUtc}
      </span>
      <span>
        Interactive 3D requires WebGL. The source notes and object legend remain
        available below.
      </span>
    </div>
  );
  return (
    <section
      ref={host}
      className={`${styles.sample} ${className}`}
      aria-label={scene.metadata.title || `${scene.body.name} orbital sample`}
    >
      <div className={styles.viewport}>
        <CanvasBoundary fallback={fallback}>
          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
            camera={{ fov: 42 }}
          >
            <color attach="background" args={['#030711']} />
            <OrbitalWorld
              scene={scene}
              time={time}
              selected={selected}
              onSelect={selectObject}
              fitAll={fitAll}
            />
          </Canvas>
        </CanvasBoundary>
        <div className={styles.readout}>
          <span>Epoch {scene.epochUtc}</span>
          <span>UTC {currentUtc}</span>
        </div>
        <div className={styles.selectionReadout}>
          <span>{selectedObject?.name || 'No object selected'}</span>
          <span>MET {Math.round(time).toLocaleString()} s</span>
        </div>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          onClick={() => setPlaying(value => !value)}
          disabled={reducedMotion}
          aria-pressed={playing}
        >
          {playing ? 'Pause' : 'Play'} · {speed}× sampled time
        </button>
        <button
          type="button"
          onClick={() => {
            setTime(0);
            setPlaying(false);
          }}
        >
          Reset period
        </button>
        <button
          type="button"
          onClick={() => setFitAll(value => !value)}
          aria-pressed={fitAll}
        >
          {fitAll ? 'Close planet view' : 'Fit complete paths'}
        </button>
        <input
          aria-label="Sample time"
          type="range"
          min="0"
          max={scene.durationSeconds}
          step={scene.stepSeconds}
          value={time}
          onChange={event => {
            setPlaying(false);
            setTime(Number(event.target.value));
          }}
        />
      </div>
      <div className={styles.categoryLegend} aria-label="Object categories">
        {categories.map(category => (
          <span key={category.label}>
            <i style={{ background: category.color }} /> {category.label}
          </span>
        ))}
      </div>
      {telemetryOpen && selectedObject && (
        <TelemetryPanel
          id={telemetryId}
          scene={scene}
          object={selectedObject}
          time={time}
          currentUtc={currentUtc}
          onClose={closeTelemetry}
        />
      )}
      <details className={styles.details}>
        <summary>Objects &amp; source notes</summary>
        <div className={styles.legend}>
          {scene.objects.map(object => (
            <button
              key={object.id}
              type="button"
              className={selected === object.id ? styles.selected : ''}
              onClick={() => selectObject(object.id)}
              aria-controls={telemetryId}
              aria-expanded={selected === object.id && telemetryOpen}
              aria-pressed={selected === object.id}
            >
              <i style={{ background: object.color }} />{' '}
              <span>
                {object.name}
                <small>
                  {object.classification === 'published_reference'
                    ? 'Published / historical reference'
                    : 'Hypothetical fleet object'}
                </small>
              </span>
            </button>
          ))}
        </div>
        <p className={styles.note}>
          {scene.metadata.fidelity} Camera motion is independent of sampled
          time. Frame: {scene.frame.name} — {scene.frame.description}.{' '}
          {scene.metadata.historicalPeriod &&
            `Fixed period: ${scene.metadata.historicalPeriod}. `}
          {reducedMotion &&
            'Playback is disabled by your reduced-motion preference.'}
        </p>
        {!!scene.metadata.sources?.length && (
          <p className={styles.sources}>
            Sources:{' '}
            {scene.metadata.sources.map((source, index) => (
              <span key={source.label}>
                {index > 0 && ' · '}
                {source.url ? (
                  <a href={source.url}>{source.label}</a>
                ) : (
                  source.label
                )}
              </span>
            ))}
          </p>
        )}
      </details>
    </section>
  );
}

export default function OrbitalSample({ src, className = '' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scene, setScene] = useState<OrbitalScene | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: '240px' }
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || scene || error) return;
    const controller = new AbortController();
    fetch(src, { signal: controller.signal })
      .then(response => {
        if (!response.ok)
          throw new Error(`Orbit sample request failed: ${response.status}`);
        return response.json() as Promise<OrbitalScene>;
      })
      .then(setScene)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError'))
          setError(true);
      });
    return () => controller.abort();
  }, [visible, scene, error, src]);
  return (
    <div ref={host} className={className}>
      {scene ? (
        <LoadedOrbitalSample scene={scene} />
      ) : (
        <div className={`${styles.sample} ${styles.fallback}`} role="status">
          <strong>
            {error ? 'Orbital sample unavailable' : 'Loading orbital sample…'}
          </strong>
          <span>
            {error
              ? 'The data file could not be loaded.'
              : 'The 3D scene loads when it approaches the viewport.'}
          </span>
        </div>
      )}
    </div>
  );
}
