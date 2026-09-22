import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Billboard, Line, OrbitControls, Stars } from '@react-three/drei';
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import styles from './LaserAblationSim.module.css';
import { samplePosition, sampleVelocity } from '../lib/orbitalTelemetry';

type Vector3Tuple = [number, number, number];
/** [t, x, y, z, vx, vy, vz, perigee, apogee] */
type Sample = number[];
/** [t, dPerigee, dApogee, dvMs, dvRetroMs, energyJ, engagedBy] */
type CampaignRow = [number, number, number, number, number, number, string];
/** [t, x, y, z, perigee, apogee] */
type BaselineRow = number[];
/** [t, status, target, rangeKm, pulseJ, repHz, powerOnTargetW, thrust,
 *  propellantKg, dvSelfMs, firingS, onTargetJ, sunlit, holdCode] */
type LaserRow = [
  number,
  string,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  string,
];

interface Projection {
  status: 'REENTRY_COURSE' | 'PROGRESS' | 'MARGINAL' | 'NOT_ENGAGED';
  perigeeNowKm: number;
  apogeeNowKm: number;
  dvRequiredMs: number;
  dvDeliveredMs: number;
  dvRetroDeliveredMs: number;
  energyOnTargetJ: number;
  firingS: number;
  passes: number;
  decayTailDays: number;
  projectedDays: { '25': number; '50': number; '100': number } | null;
  model?: 'shepherd' | 'sweeper';
  dvRateMsPerFiringHour?: number;
  dutyCycle?: number;
  firingHoursRequired?: number;
  dvPerPassMs?: number;
  passesRequired?: number;
  opportunitiesPerDay?: number;
}

interface InitialOrbit {
  perigeeKm: number;
  apogeeKm: number;
  inclinationDeg: number;
  nodeDeg: number | null;
}

interface DebrisObject {
  id: string;
  name: string;
  role: 'debris';
  kind: string;
  color: string;
  massKg: number;
  areaM2: number;
  recoilEfficiency: number;
  initialOrbit: InitialOrbit;
  origin: string;
  samples: Sample[];
  campaign: CampaignRow[];
  baseline: BaselineRow[];
  projection: Projection;
}

interface LaserObject {
  id: string;
  name: string;
  role: 'laser';
  kind: string;
  mode: 'shepherd' | 'sweeper';
  family: string;
  assignedTarget: string | null;
  color: string;
  massKg: number;
  initialOrbit: InitialOrbit;
  origin: string;
  samples: Sample[];
  laser: LaserRow[];
  totals: {
    firingS: number;
    emittedJ: number;
    onTargetJ: number;
    propellantKg: number;
    dvSelfMs: number;
    finalMassKg: number;
  };
}

type SceneObject = DebrisObject | LaserObject;

export interface Engagement {
  id: string;
  laser: string;
  target: string;
  mode: 'shepherd' | 'sweeper';
  start: number;
  end: number;
  durationS: number;
  outcome: 'SUCCESS' | 'EFFECTIVE' | 'PARTIAL' | 'INEFFECTIVE' | 'ABORTED';
  reason?: string;
  reasonText: string;
  dvMs: number;
  dvRetroMs: number;
  energyOnTargetJ: number;
  impulseNs: number;
  meanRangeKm?: number;
  minRangeKm?: number;
  meanHeadOnCos?: number;
  meanPowerOnTargetW?: number;
  perigeeAfterKm?: number;
  apogeeAfterKm?: number;
  dPerigeeVsBaselineKm?: number;
  dApogeeVsBaselineKm?: number;
  projectedDaysAtRate?: number;
  dvRateMsPerFiringHour?: number;
  dvFractionOfRequired?: number;
  /** [t, rangeKm, headOnCos, pulseJ, repHz, powerOnTargetW, dvCumMs] */
  detail?: number[][];
  detailStepS?: number;
}

interface TimelineEvent {
  t: number;
  type: string;
  laser: string;
  target: string | null;
  message: string;
}

export interface LaserScene {
  schemaVersion: string;
  title: string;
  epochLabel: string;
  frame: { name: string; description: string; axisMapping?: string };
  body: {
    name: string;
    radiusKm: number;
    muKm3S2: number;
    j2: number;
    textureUrl?: string;
    rotationRateRadS?: number;
  };
  sunDirection: Vector3Tuple;
  durationSeconds: number;
  stepSeconds: number;
  integratorStepSeconds: number;
  reentryPerigeeKm: number;
  laserDesign: Record<string, number | number[]>;
  holdText: Record<string, string>;
  objects: SceneObject[];
  engagements: Engagement[];
  timeline: TimelineEvent[];
  limits: string[];
  sources: Array<{ label: string; url?: string }>;
}

interface Props {
  src: string;
  className?: string;
}

const SPEEDS = [1, 10, 60, 300, 1200] as const;
const OUTCOME_LABEL: Record<Engagement['outcome'], string> = {
  SUCCESS: 'Success',
  EFFECTIVE: 'Effective',
  PARTIAL: 'Partial',
  INEFFECTIVE: 'Ineffective',
  ABORTED: 'Aborted',
};
const PROJECTION_LABEL: Record<Projection['status'], string> = {
  REENTRY_COURSE: 'Re-entry course',
  PROGRESS: 'Campaign in progress',
  MARGINAL: 'Marginal for this mode',
  NOT_ENGAGED: 'Not engaged',
};

function mapPoint(point: Vector3Tuple, scale: number): Vector3Tuple {
  return [point[0] / scale, point[2] / scale, -point[1] / scale];
}

function fmt(value: number | undefined | null, digits = 1): string {
  if (value === undefined || value === null || !Number.isFinite(value))
    return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

function days(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value))
    return '—';
  if (value === 0) return 'now';
  if (value < 1) return `${fmt(value * 24, 1)} h`;
  if (value > 3650) return '> 10 years';
  if (value > 365) return `${fmt(value / 365, 1)} years`;
  return `${fmt(value, value < 10 ? 1 : 0)} days`;
}

function energy(joules: number | undefined): string {
  if (joules === undefined || !Number.isFinite(joules)) return '—';
  if (joules >= 1e6) return `${fmt(joules / 1e6, 2)} MJ`;
  if (joules >= 1e3) return `${fmt(joules / 1e3, 1)} kJ`;
  return `${fmt(joules, 0)} J`;
}

interface Track {
  positions: Vector3Tuple[];
  velocities: Vector3Tuple[];
  scenePoints: Vector3Tuple[];
  baselinePoints?: Vector3Tuple[];
}

function buildTracks(scene: LaserScene): Map<string, Track> {
  const scale = scene.body.radiusKm;
  return new Map(
    scene.objects.map(object => {
      const positions = object.samples.map(
        s => [s[1], s[2], s[3]] as Vector3Tuple
      );
      const velocities = object.samples.map(
        s => [s[4], s[5], s[6]] as Vector3Tuple
      );
      const track: Track = {
        positions,
        velocities,
        scenePoints: positions.map(p => mapPoint(p, scale)),
      };
      if (object.role === 'debris') {
        track.baselinePoints = object.baseline.map(b =>
          mapPoint([b[1], b[2], b[3]], scale)
        );
      }
      return [object.id, track];
    })
  );
}

function activeEngagements(scene: LaserScene, time: number): Engagement[] {
  return scene.engagements.filter(
    e => e.outcome !== 'ABORTED' && time >= e.start && time <= e.end
  );
}

function detailAt(engagement: Engagement, time: number): number[] | null {
  const detail = engagement.detail;
  if (!detail?.length) return null;
  let best = detail[0];
  for (const row of detail) {
    if (Math.abs(row[0] - time) < Math.abs(best[0] - time)) best = row;
  }
  return best;
}

function TexturedEarth({ scene, time }: { scene: LaserScene; time: number }) {
  const texture = useLoader(
    THREE.TextureLoader,
    scene.body.textureUrl || '/data/orbits/earth-blue-marble.png'
  );
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);
  const rate = scene.body.rotationRateRadS || 0;
  return (
    <group rotation-y={rate * time}>
      <mesh>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.018, 48, 32]} />
        <meshBasicMaterial
          color="#7bbcff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Marker({
  position,
  color,
  shape,
  active,
  halo,
  onClick,
  onHover,
}: {
  position: Vector3Tuple;
  color: string;
  shape: 'debris' | 'laser' | 'small';
  active: boolean;
  halo: boolean;
  onClick: () => void;
  onHover: (over: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  // Constant on-screen size: scale with distance to the camera so markers stay
  // legible both from the whole-Earth view and while following a spacecraft.
  useLayoutEffect(() => {
    if (!group.current) return;
    const distance = camera.position.distanceTo(new THREE.Vector3(...position));
    const size = Math.max(0.0004, distance * (active ? 0.011 : 0.008));
    group.current.scale.setScalar(size);
  });
  const base = shape === 'small' ? 0.6 : shape === 'laser' ? 1.15 : 1;
  return (
    <Billboard position={position}>
      <group ref={group}>
        <mesh
          onClick={event => {
            event.stopPropagation();
            onClick();
          }}
          onPointerOver={event => {
            event.stopPropagation();
            onHover(true);
          }}
          onPointerOut={() => onHover(false)}
        >
          {shape === 'laser' ? (
            <planeGeometry args={[base * 1.4, base * 1.4]} />
          ) : (
            <circleGeometry args={[base, shape === 'small' ? 8 : 20]} />
          )}
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {shape === 'laser' && (
          <mesh rotation-z={Math.PI / 4}>
            <ringGeometry args={[base * 1.5, base * 1.75, 4]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        )}
        {halo && (
          <mesh>
            <ringGeometry args={[base * 2.2, base * 2.6, 32]} />
            <meshBasicMaterial
              color="#d9b3ff"
              toneMapped={false}
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
        {active && (
          <mesh>
            <ringGeometry args={[base * 3.1, base * 3.35, 32]} />
            <meshBasicMaterial
              color="#ffffff"
              toneMapped={false}
              transparent
              opacity={0.55}
            />
          </mesh>
        )}
      </group>
    </Billboard>
  );
}

function CameraRig({ follow }: { follow: Vector3Tuple | null }) {
  const { camera, invalidate } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const previous = useRef<Vector3Tuple | null>(null);
  useEffect(() => {
    camera.near = 0.0005;
    camera.far = 80;
    camera.position.set(2.5, 1.45, 3.1);
    camera.updateProjectionMatrix();
  }, [camera]);
  useLayoutEffect(() => {
    const control = controls.current;
    if (!control) return;
    if (follow) {
      const target = new THREE.Vector3(...follow);
      if (previous.current) {
        const delta = target
          .clone()
          .sub(new THREE.Vector3(...previous.current));
        camera.position.add(delta);
      } else {
        const outward = target.clone().normalize();
        camera.position.copy(
          target
            .clone()
            .add(outward.multiplyScalar(0.06))
            .add(new THREE.Vector3(0.03, 0.05, 0.03))
        );
      }
      control.target.copy(target);
      previous.current = follow;
    } else if (previous.current) {
      previous.current = null;
      control.target.set(0, 0, 0);
      camera.position.set(2.5, 1.45, 3.1);
    }
    control.update();
    invalidate();
  }, [follow, camera, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={follow ? 0.004 : 1.3}
      maxDistance={follow ? 1.5 : 12}
      enablePan={false}
    />
  );
}

function World({
  scene,
  tracks,
  time,
  selected,
  follow,
  showBaseline,
  onSelect,
}: {
  scene: LaserScene;
  tracks: Map<string, Track>;
  time: number;
  selected: string | null;
  follow: string | null;
  showBaseline: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { events } = useThree();
  useEffect(() => {
    events.update?.();
  }, [time, events]);
  const scale = scene.body.radiusKm;
  const positions = useMemo(() => {
    const map = new Map<string, Vector3Tuple>();
    for (const object of scene.objects) {
      const track = tracks.get(object.id)!;
      map.set(
        object.id,
        mapPoint(
          samplePosition(
            track.positions,
            track.velocities,
            time,
            scene.stepSeconds
          ),
          scale
        )
      );
    }
    return map;
  }, [scene, tracks, time, scale]);
  const active = activeEngagements(scene, time);
  const engagedTargets = new Set(active.map(e => e.target));
  const sun = useMemo(
    () =>
      new THREE.Vector3(...mapPoint(scene.sunDirection, 1))
        .normalize()
        .multiplyScalar(8),
    [scene.sunDirection]
  );
  const followPosition = follow ? (positions.get(follow) ?? null) : null;
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={sun} intensity={2.6} />
      <Stars
        radius={60}
        depth={30}
        count={1400}
        factor={2}
        saturation={0}
        fade
        speed={0}
      />
      <Suspense fallback={null}>
        <TexturedEarth scene={scene} time={time} />
      </Suspense>
      {scene.objects.map(object => {
        const track = tracks.get(object.id)!;
        const position = positions.get(object.id)!;
        const isSelected = selected === object.id;
        const isLaser = object.role === 'laser';
        return (
          <group key={object.id}>
            <Line
              points={track.scenePoints}
              color={object.color}
              lineWidth={isSelected ? 2 : isLaser ? 1.3 : 0.8}
              transparent
              opacity={isSelected ? 0.9 : isLaser ? 0.55 : 0.3}
            />
            {showBaseline && isSelected && track.baselinePoints && (
              <Line
                points={track.baselinePoints}
                color="#9bacb6"
                lineWidth={1}
                transparent
                opacity={0.7}
                dashed
                dashSize={0.04}
                gapSize={0.025}
              />
            )}
            <Marker
              position={position}
              color={hovered === object.id ? '#ffffff' : object.color}
              shape={
                isLaser
                  ? 'laser'
                  : object.kind === 'small_fragment'
                    ? 'small'
                    : 'debris'
              }
              active={isSelected}
              halo={engagedTargets.has(object.id)}
              onClick={() => onSelect(object.id)}
              onHover={over =>
                setHovered(current =>
                  over ? object.id : current === object.id ? null : current
                )
              }
            />
          </group>
        );
      })}
      {active.map(engagement => {
        const from = positions.get(engagement.laser);
        const to = positions.get(engagement.target);
        if (!from || !to) return null;
        return (
          <Line
            key={engagement.id}
            points={[from, to]}
            color="#d9b3ff"
            lineWidth={2.4}
            transparent
            opacity={0.95}
            toneMapped={false}
          />
        );
      })}
      <CameraRig follow={followPosition} />
    </>
  );
}

class CanvasBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
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

/** Target-centred local geometry: along-track to the right, radial up. */
function GeometryInset({
  scene,
  tracks,
  laser,
  targetId,
  time,
  firing,
}: {
  scene: LaserScene;
  tracks: Map<string, Track>;
  laser: LaserObject;
  targetId: string | null;
  time: number;
  firing: boolean;
}) {
  const design = scene.laserDesign;
  const maxRange = Number(design.maxRangeKm);
  const minRange = Number(design.minRangeKm);
  const cone = Math.acos(Number(design.minHeadOnCosine));
  const box = 360;
  const half = box / 2;
  const scale = half / (maxRange * 1.25);
  let laserPoint: { x: number; y: number; range: number; cos: number } | null =
    null;
  const targetTrack = targetId ? tracks.get(targetId) : undefined;
  if (targetTrack) {
    const laserTrack = tracks.get(laser.id)!;
    const rt = samplePosition(
      targetTrack.positions,
      targetTrack.velocities,
      time,
      scene.stepSeconds
    );
    const vt = sampleVelocity(
      targetTrack.positions,
      targetTrack.velocities,
      time,
      scene.stepSeconds
    );
    const rl = samplePosition(
      laserTrack.positions,
      laserTrack.velocities,
      time,
      scene.stepSeconds
    );
    const along = new THREE.Vector3(...vt).normalize();
    const radial = new THREE.Vector3(...rt).normalize();
    const relative = new THREE.Vector3(...rl).sub(new THREE.Vector3(...rt));
    const range = relative.length();
    const x = relative.dot(along);
    const y = relative.dot(radial);
    // Beam direction runs laser -> target; head-on cosine compares -beam with the
    // target velocity, i.e. the laser must sit ahead of the target.
    const cos = range > 0 ? x / range : 0;
    laserPoint = { x, y, range, cos };
  }
  const toSvg = (x: number, y: number) => [half + x * scale, half - y * scale];
  const conePoints = [
    toSvg(0, 0),
    toSvg(maxRange * 1.25 * Math.cos(cone), maxRange * 1.25 * Math.sin(cone)),
    toSvg(maxRange * 1.25, 0),
    toSvg(maxRange * 1.25 * Math.cos(cone), -maxRange * 1.25 * Math.sin(cone)),
  ];
  const outOfBox =
    laserPoint &&
    (Math.abs(laserPoint.x) > maxRange * 1.25 ||
      Math.abs(laserPoint.y) > maxRange * 1.25);
  return (
    <figure className={styles.inset}>
      <svg
        viewBox={`0 0 ${box} ${box}`}
        role="img"
        aria-label="Local engagement geometry around the target"
      >
        <polygon
          className={styles.insetCone}
          points={conePoints.map(p => p.join(',')).join(' ')}
        />
        <circle
          className={styles.insetRing}
          cx={half}
          cy={half}
          r={maxRange * scale}
        />
        <circle
          className={styles.insetRing}
          cx={half}
          cy={half}
          r={minRange * scale}
        />
        <line
          className={styles.insetAxis}
          x1={half - half * 0.95}
          x2={half + half * 0.95}
          y1={half}
          y2={half}
        />
        <line
          className={styles.insetAxis}
          x1={half}
          x2={half}
          y1={half - half * 0.95}
          y2={half + half * 0.95}
        />
        <text x={half + half * 0.95 - 4} y={half - 6} textAnchor="end">
          target velocity →
        </text>
        <text x={half + 6} y={half - half * 0.95 + 12}>
          up
        </text>
        <text x={half + maxRange * scale + 4} y={half + 14}>
          {maxRange} km
        </text>
        {laserPoint && !outOfBox && (
          <>
            {firing && (
              <line
                className={styles.insetBeam}
                x1={toSvg(laserPoint.x, laserPoint.y)[0]}
                y1={toSvg(laserPoint.x, laserPoint.y)[1]}
                x2={half}
                y2={half}
              />
            )}
            <rect
              className={styles.insetLaser}
              x={toSvg(laserPoint.x, laserPoint.y)[0] - 5}
              y={toSvg(laserPoint.x, laserPoint.y)[1] - 5}
              width={10}
              height={10}
              transform={`rotate(45 ${toSvg(laserPoint.x, laserPoint.y)[0]} ${
                toSvg(laserPoint.x, laserPoint.y)[1]
              })`}
            />
          </>
        )}
        <circle className={styles.insetTarget} cx={half} cy={half} r={5} />
      </svg>
      <figcaption>
        {laserPoint
          ? outOfBox
            ? `Target ${fmt(laserPoint.range, 0)} km away, outside the inset`
            : `Range ${fmt(laserPoint.range, 0)} km · head-on cosine ${fmt(
                laserPoint.cos,
                2
              )}${laserPoint.cos >= Number(design.minHeadOnCosine) ? ' · inside firing cone' : ' · outside firing cone'}`
          : 'No target in view'}
        <br />
        <small>
          Shaded wedge: allowed 60° cone ahead of the target. Rings: 60 and 300
          km range limits.
        </small>
      </figcaption>
    </figure>
  );
}

function LaserCard({
  scene,
  tracks,
  laser,
  time,
  selected,
  onSelect,
  onFollow,
  following,
}: {
  scene: LaserScene;
  tracks: Map<string, Track>;
  laser: LaserObject;
  time: number;
  selected: boolean;
  onSelect: () => void;
  onFollow: () => void;
  following: boolean;
}) {
  const index = Math.min(
    laser.laser.length - 1,
    Math.max(0, Math.floor(time / scene.stepSeconds))
  );
  const row = laser.laser[index];
  const engagement = activeEngagements(scene, time).find(
    e => e.laser === laser.id
  );
  const detail = engagement ? detailAt(engagement, time) : null;
  const status = engagement ? 'FIRING' : row[1];
  const holdText =
    status === 'FIRING'
      ? ''
      : scene.holdText[row[13]] || row[13] || 'searching for targets';
  const targetId = engagement?.target ?? (row[2] || laser.assignedTarget);
  const target = targetId
    ? scene.objects.find(o => o.id === targetId)
    : undefined;
  const range = detail ? detail[1] : row[3];
  const pulse = detail ? detail[3] : row[4];
  const rate = detail ? detail[4] : row[5];
  const power = detail ? detail[5] : row[6];
  const thrust = row[7];
  return (
    <article
      className={`${styles.laserCard} ${selected ? styles.laserSelected : ''}`}
    >
      <header>
        <button type="button" onClick={onSelect} className={styles.cardTitle}>
          <i style={{ background: laser.color }} />
          <span>
            <strong>{laser.name}</strong>
            <small>
              {laser.mode === 'shepherd' ? 'Shepherd' : 'Sweeper'} ·{' '}
              {laser.family}
            </small>
          </span>
        </button>
        <span
          className={`${styles.status} ${
            status === 'FIRING'
              ? styles.statusFiring
              : status === 'HOLD'
                ? styles.statusHold
                : styles.statusSearch
          }`}
        >
          {status}
        </span>
      </header>
      <p className={styles.holdText}>
        {status === 'FIRING'
          ? `Firing on ${target?.name ?? targetId}`
          : holdText}
      </p>
      <dl>
        <div>
          <dt>Target</dt>
          <dd>{target?.name ?? '—'}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{range ? `${fmt(range, 0)} km` : '—'}</dd>
        </div>
        <div>
          <dt>Pulse</dt>
          <dd>
            {status === 'FIRING' && pulse
              ? `${fmt(pulse, 0)} J × ${fmt(rate, 1)} Hz`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>On target</dt>
          <dd>{status === 'FIRING' ? `${fmt(power, 0)} W` : '—'}</dd>
        </div>
        <div>
          <dt>Fired so far</dt>
          <dd>
            {clock(row[10])} · {energy(row[11])}
          </dd>
        </div>
        <div>
          <dt>Thruster</dt>
          <dd>
            {thrust < 0 ? 'retrograde' : thrust > 0 ? 'prograde' : 'off'} ·{' '}
            {fmt(row[8] * 1000, 0)} g Ar
          </dd>
        </div>
        <div>
          <dt>Sunlit</dt>
          <dd>{row[12] ? 'yes' : 'eclipse'}</dd>
        </div>
        <div>
          <dt>Own Δv</dt>
          <dd>{fmt(row[9], 3)} m/s</dd>
        </div>
      </dl>
      <div className={styles.cardActions}>
        <button type="button" onClick={onFollow} aria-pressed={following}>
          {following ? 'Stop following' : 'Follow camera'}
        </button>
      </div>
      {selected && (
        <GeometryInset
          scene={scene}
          tracks={tracks}
          laser={laser}
          targetId={targetId ?? null}
          time={time}
          firing={status === 'FIRING'}
        />
      )}
    </article>
  );
}

function ApsisChart({
  object,
  scene,
  time,
}: {
  object: DebrisObject;
  scene: LaserScene;
  time: number;
}) {
  const width = 720;
  const height = 120;
  const series = [
    object.baseline.map(b => b[4]),
    object.samples.map(s => s[7]),
    object.baseline.map(b => b[5]),
    object.samples.map(s => s[8]),
  ];
  const all = series.flat();
  const low = Math.min(...all);
  const high = Math.max(...all);
  const span = high - low || 1;
  const path = (values: number[]) =>
    values
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${(i / Math.max(1, values.length - 1)) * width},${
            height - ((v - low) / span) * (height - 12) - 6
          }`
      )
      .join(' ');
  const cursorX = (time / scene.durationSeconds) * width;
  const firing = scene.engagements.filter(
    e => e.target === object.id && e.outcome !== 'ABORTED'
  );
  return (
    <figure className={styles.chart}>
      <svg
        viewBox={`-46 -8 ${width + 56} ${height + 30}`}
        role="img"
        aria-label={`Perigee and apogee of ${object.name} over six hours, baseline versus engaged`}
      >
        {firing.map(e => (
          <rect
            key={e.id}
            className={styles.chartFiring}
            x={(e.start / scene.durationSeconds) * width}
            y={0}
            width={Math.max(
              1.5,
              ((e.end - e.start) / scene.durationSeconds) * width
            )}
            height={height}
          />
        ))}
        <path d={path(series[0])} className={styles.chartBase} />
        <path d={path(series[2])} className={styles.chartBase} />
        <path d={path(series[1])} className={styles.chartCase} />
        <path d={path(series[3])} className={styles.chartCase} />
        <line
          className={styles.chartCursor}
          x1={cursorX}
          x2={cursorX}
          y1={0}
          y2={height}
        />
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <text key={f} x={f * width} y={height + 18} textAnchor="middle">
            {Math.round((scene.durationSeconds * f) / 3600)}h
          </text>
        ))}
        {[0, 0.5, 1].map(f => (
          <text
            key={f}
            x={-6}
            y={height - f * (height - 12) - 4}
            textAnchor="end"
          >
            {fmt(low + f * span, 0)}
          </text>
        ))}
      </svg>
      <figcaption>
        Osculating perigee (lower) and apogee (upper), km. Grey dashed: matched
        gravity-only baseline. Colour: engaged trajectory. Shaded: firing
        segments on this body.
      </figcaption>
    </figure>
  );
}

function ProjectionBlock({
  object,
  scene,
}: {
  object: DebrisObject;
  scene: LaserScene;
}) {
  const p = object.projection;
  return (
    <div className={styles.projection}>
      <header>
        <span>Projected de-orbit timeline</span>
        <strong className={styles[`proj${p.status}`]}>
          {PROJECTION_LABEL[p.status]}
        </strong>
      </header>
      <dl>
        <div>
          <dt>Perigee now</dt>
          <dd>
            {fmt(p.perigeeNowKm, 1)} km{' '}
            <small>(threshold {scene.reentryPerigeeKm} km)</small>
          </dd>
        </div>
        <div>
          <dt>Retrograde Δv still needed</dt>
          <dd>{fmt(p.dvRequiredMs, 1)} m/s</dd>
        </div>
        <div>
          <dt>Delivered in six hours</dt>
          <dd>
            {fmt(p.dvRetroDeliveredMs, 3)} m/s · {energy(p.energyOnTargetJ)} on
            target
          </dd>
        </div>
        {p.model === 'shepherd' && (
          <>
            <div>
              <dt>Measured rate</dt>
              <dd>
                {fmt(p.dvRateMsPerFiringHour, 2)} m/s per firing hour at{' '}
                {fmt((p.dutyCycle ?? 0) * 100, 0)}% duty
              </dd>
            </div>
            <div>
              <dt>Firing hours required</dt>
              <dd>{fmt(p.firingHoursRequired, 0)} h</dd>
            </div>
          </>
        )}
        {p.model === 'sweeper' && (
          <>
            <div>
              <dt>Measured per pass</dt>
              <dd>
                {fmt(p.dvPerPassMs, 2)} m/s · {p.passesRequired} more{' '}
                {p.passesRequired === 1 ? 'pass' : 'passes'}
              </dd>
            </div>
            <div>
              <dt>Encounter model</dt>
              <dd>
                {fmt(p.opportunitiesPerDay, 2)} opportunities per day, random
                phasing
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>To 200 km perigee at 25 / 50 / 100 µN·s/J</dt>
          <dd>
            {p.projectedDays
              ? `${days(p.projectedDays['25'])} / ${days(
                  p.projectedDays['50']
                )} / ${days(p.projectedDays['100'])}`
              : 'not engaged in this window'}
          </dd>
        </div>
        <div>
          <dt>Atmospheric decay after that</dt>
          <dd>
            ≈ {days(p.decayTailDays)}{' '}
            <small>(King-Hele estimate, static atmosphere)</small>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ObjectPanel({
  object,
  scene,
  time,
}: {
  object: SceneObject;
  scene: LaserScene;
  time: number;
}) {
  const index = Math.min(
    object.samples.length - 1,
    Math.max(0, Math.floor(time / scene.stepSeconds))
  );
  const sample = object.samples[index];
  const orbit = object.initialOrbit;
  return (
    <section className={styles.objectPanel} aria-live="polite">
      <header>
        <i style={{ background: object.color }} />
        <div>
          <small>
            {object.role === 'laser'
              ? 'Proposed ablation satellite'
              : object.kind === 'small_fragment'
                ? 'Added centimetre-class fragment'
                : 'Fictional debris body'}{' '}
            · {object.id}
          </small>
          <h3>{object.name}</h3>
        </div>
      </header>
      <dl className={styles.facts}>
        <div>
          <dt>Initial orbit</dt>
          <dd>
            {orbit
              ? `${fmt(orbit.perigeeKm, 0)} × ${fmt(orbit.apogeeKm, 0)} km · ${fmt(
                  orbit.inclinationDeg,
                  1
                )}°`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Now</dt>
          <dd>
            {fmt(sample[7], 1)} × {fmt(sample[8], 1)} km
          </dd>
        </div>
        <div>
          <dt>Mass</dt>
          <dd>
            {object.massKg >= 1
              ? `${fmt(object.massKg, 0)} kg`
              : `${fmt(object.massKg * 1000, 0)} g`}
          </dd>
        </div>
        {object.role === 'debris' && (
          <>
            <div>
              <dt>Projected area</dt>
              <dd>
                {object.areaM2 >= 0.1
                  ? `${fmt(object.areaM2, 1)} m²`
                  : `${fmt(object.areaM2 * 1e4, 0)} cm²`}
              </dd>
            </div>
            <div>
              <dt>Δ perigee vs baseline</dt>
              <dd>{fmt(object.campaign[index][1], 3)} km</dd>
            </div>
            <div>
              <dt>Δ apogee vs baseline</dt>
              <dd>{fmt(object.campaign[index][2], 3)} km</dd>
            </div>
            <div>
              <dt>Δv received</dt>
              <dd>
                {fmt(object.campaign[index][3], 3)} m/s (
                {fmt(object.campaign[index][4], 3)} retrograde)
              </dd>
            </div>
            <div>
              <dt>Energy on target</dt>
              <dd>{energy(object.campaign[index][5])}</dd>
            </div>
          </>
        )}
        {object.role === 'laser' && (
          <>
            <div>
              <dt>Role</dt>
              <dd>{object.origin}</dd>
            </div>
            <div>
              <dt>Six-hour totals</dt>
              <dd>
                {clock(object.totals.firingS)} firing ·{' '}
                {energy(object.totals.emittedJ)} emitted ·{' '}
                {energy(object.totals.onTargetJ)} on target
              </dd>
            </div>
            <div>
              <dt>Propellant</dt>
              <dd>
                {fmt(object.totals.propellantKg * 1000, 0)} g argon ·{' '}
                {fmt(object.totals.dvSelfMs, 3)} m/s own Δv
              </dd>
            </div>
          </>
        )}
      </dl>
      {object.role === 'debris' && (
        <>
          <ProjectionBlock object={object} scene={scene} />
          <ApsisChart object={object} scene={scene} time={time} />
        </>
      )}
      <p className={styles.origin}>{object.origin}</p>
    </section>
  );
}

function EngagementStrip({
  scene,
  time,
  onJump,
}: {
  scene: LaserScene;
  time: number;
  onJump: (engagement: Engagement) => void;
}) {
  const lasers = scene.objects.filter(
    (o): o is LaserObject => o.role === 'laser'
  );
  const width = 1000;
  const rowHeight = 18;
  const height = lasers.length * rowHeight + 22;
  return (
    <svg
      className={styles.strip}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Engagement timeline for the three satellites"
    >
      {lasers.map((laser, row) => (
        <g key={laser.id} transform={`translate(0 ${row * rowHeight})`}>
          <text x={0} y={12} className={styles.stripLabel}>
            {laser.id.toUpperCase()}
          </text>
          <line
            x1={52}
            x2={width}
            y1={9}
            y2={9}
            className={styles.stripTrack}
          />
          {scene.engagements
            .filter(e => e.laser === laser.id)
            .map(e => (
              <rect
                key={e.id}
                className={`${styles.stripSegment} ${
                  styles[`outcome${e.outcome}`]
                }`}
                x={52 + (e.start / scene.durationSeconds) * (width - 52)}
                y={3}
                width={Math.max(
                  2,
                  ((e.end - e.start) / scene.durationSeconds) * (width - 52)
                )}
                height={12}
                onClick={() => onJump(e)}
                role="button"
                aria-label={`${e.id}: ${laser.name} on ${e.target}, ${OUTCOME_LABEL[e.outcome]}`}
              >
                <title>
                  {e.id} · {OUTCOME_LABEL[e.outcome]} · {clock(e.start)}
                </title>
              </rect>
            ))}
        </g>
      ))}
      <line
        className={styles.stripCursor}
        x1={52 + (time / scene.durationSeconds) * (width - 52)}
        x2={52 + (time / scene.durationSeconds) * (width - 52)}
        y1={0}
        y2={lasers.length * rowHeight}
      />
      {[0, 1, 2, 3, 4, 5, 6].map(h => (
        <text
          key={h}
          x={52 + ((h * 3600) / scene.durationSeconds) * (width - 52)}
          y={height - 4}
          textAnchor={h === 6 ? 'end' : h === 0 ? 'start' : 'middle'}
          className={styles.stripLabel}
        >
          T+{h}h
        </text>
      ))}
    </svg>
  );
}

function LoadedSim({ scene }: { scene: LaserScene }) {
  const tracks = useMemo(() => buildTracks(scene), [scene]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(60);
  const [selected, setSelected] = useState<string>('las-1');
  const [follow, setFollow] = useState<string | null>(null);
  const [showBaseline, setShowBaseline] = useState(true);
  const [visible, setVisible] = useState(true);
  const host = useRef<HTMLElement>(null);
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
      setTime(value => {
        const next = value + elapsed * speed;
        if (next >= scene.durationSeconds) {
          setPlaying(false);
          return scene.durationSeconds;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, visible, reducedMotion, speed, scene.durationSeconds]);

  const selectedObject = scene.objects.find(o => o.id === selected)!;
  const lasers = scene.objects.filter(
    (o): o is LaserObject => o.role === 'laser'
  );
  const debris = scene.objects.filter(
    (o): o is DebrisObject => o.role === 'debris'
  );
  const active = activeEngagements(scene, time);
  const jumpTo = (engagement: Engagement) => {
    setPlaying(false);
    setTime(Math.max(0, engagement.start - 6));
    setSelected(engagement.laser);
    setFollow(engagement.laser);
    setSpeed(engagement.durationS < 240 ? 1 : 60);
  };
  const recentEvents = scene.timeline
    .filter(e => e.t <= time)
    .slice(-6)
    .reverse();
  const fallback = (
    <div
      className={styles.fallback}
      role="img"
      aria-label="3D view unavailable"
    >
      <strong>{scene.title}</strong>
      <span>
        Interactive 3D requires WebGL. The fleet console, engagement log and
        projections below remain available.
      </span>
    </div>
  );
  return (
    <section
      ref={host}
      className={styles.sim}
      aria-label="Laser ablation campaign simulator"
    >
      <div className={styles.stage}>
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
              camera={{ fov: 40 }}
            >
              <color attach="background" args={['#030711']} />
              <World
                scene={scene}
                tracks={tracks}
                time={time}
                selected={selected}
                follow={follow}
                showBaseline={showBaseline}
                onSelect={id => setSelected(id)}
              />
            </Canvas>
          </CanvasBoundary>
          <div className={styles.readout}>
            <span>T+ {clock(time)}</span>
            <span>{scene.epochLabel}</span>
          </div>
          <div className={styles.activeReadout}>
            {active.length ? (
              active.map(e => (
                <span key={e.id}>
                  <i /> {e.laser.toUpperCase()} → {e.target}
                </span>
              ))
            ) : (
              <span>No beam active</span>
            )}
          </div>
          {follow && (
            <div className={styles.followReadout}>
              Following {follow.toUpperCase()} · drag to orbit, scroll to zoom
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            onClick={() => {
              if (time >= scene.durationSeconds) setTime(0);
              setPlaying(value => !value);
            }}
            disabled={reducedMotion}
            aria-pressed={playing}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <div
            className={styles.speeds}
            role="group"
            aria-label="Playback speed"
          >
            {SPEEDS.map(value => (
              <button
                key={value}
                type="button"
                className={speed === value ? styles.speedActive : ''}
                onClick={() => setSpeed(value)}
                aria-pressed={speed === value}
              >
                {value}×
              </button>
            ))}
          </div>
          <input
            aria-label="Simulation time"
            type="range"
            min={0}
            max={scene.durationSeconds}
            step={1}
            value={time}
            onChange={event => {
              setPlaying(false);
              setTime(Number(event.target.value));
            }}
          />
          <button
            type="button"
            onClick={() => {
              setTime(0);
              setPlaying(false);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowBaseline(value => !value)}
            aria-pressed={showBaseline}
          >
            Baseline {showBaseline ? 'on' : 'off'}
          </button>
          {follow && (
            <button type="button" onClick={() => setFollow(null)}>
              Whole Earth
            </button>
          )}
        </div>
        <EngagementStrip scene={scene} time={time} onJump={jumpTo} />
        <div className={styles.legend} aria-label="Legend">
          <span>
            <i className={styles.legendLaser} /> Ablation satellite
          </span>
          <span>
            <i className={styles.legendDebris} /> Debris body (colour per
            object)
          </span>
          <span>
            <i className={styles.legendBeam} /> Beam on target
          </span>
          <span>
            <i className={styles.legendBaseline} /> Gravity-only baseline
          </span>
        </div>
      </div>

      <aside className={styles.console}>
        <h3 className={styles.consoleTitle}>Fleet console</h3>
        {lasers.map(laser => (
          <LaserCard
            key={laser.id}
            scene={scene}
            tracks={tracks}
            laser={laser}
            time={time}
            selected={selected === laser.id}
            onSelect={() => setSelected(laser.id)}
            onFollow={() =>
              setFollow(current => (current === laser.id ? null : laser.id))
            }
            following={follow === laser.id}
          />
        ))}
        <div className={styles.events}>
          <h4>Recent events</h4>
          {recentEvents.length ? (
            <ul>
              {recentEvents.map((e, i) => (
                <li key={`${e.t}-${e.laser}-${i}`}>
                  <span>T+{clock(e.t)}</span>
                  <strong>{e.laser.toUpperCase()}</strong> {e.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>No events yet.</p>
          )}
        </div>
      </aside>

      <div className={styles.lower}>
        <ObjectPanel object={selectedObject} scene={scene} time={time} />
        <section className={styles.log} aria-label="Engagement log">
          <h3>Engagement log</h3>
          <p className={styles.logIntro}>
            Every firing segment and every refused opportunity in the six-hour
            window. Select a row to replay it with the camera following the
            satellite.
          </p>
          <ol>
            {scene.engagements.map(e => {
              const laser = scene.objects.find(o => o.id === e.laser);
              const target = scene.objects.find(o => o.id === e.target);
              const current = time >= e.start && time <= e.end;
              return (
                <li
                  key={e.id}
                  className={`${current ? styles.logCurrent : ''} ${
                    e.start > time ? styles.logFuture : ''
                  }`}
                >
                  <button type="button" onClick={() => jumpTo(e)}>
                    <span className={styles.logId}>{e.id}</span>
                    <span className={styles.logTime}>
                      T+{clock(e.start)} · {fmt(e.durationS, 0)} s
                    </span>
                    <span className={styles.logWho}>
                      {laser?.name} → {target?.name}
                    </span>
                    <span
                      className={`${styles.badge} ${styles[`outcome${e.outcome}`]}`}
                    >
                      {OUTCOME_LABEL[e.outcome]}
                    </span>
                    <span className={styles.logNumbers}>
                      {e.outcome === 'ABORTED'
                        ? `closest ${fmt(e.minRangeKm, 0)} km`
                        : `${fmt(e.dvRetroMs, 3)} m/s retro · ${energy(
                            e.energyOnTargetJ
                          )} · ${fmt(e.meanRangeKm, 0)} km · cos ${fmt(
                            e.meanHeadOnCos,
                            2
                          )}`}
                    </span>
                    <span className={styles.logReason}>{e.reasonText}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className={styles.summary} aria-label="Campaign summary">
        <h3>Campaign summary at T+06:00:00</h3>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Body</th>
                <th scope="col">Mass</th>
                <th scope="col">Perigee now</th>
                <th scope="col">Δ perigee</th>
                <th scope="col">Retro Δv</th>
                <th scope="col">Still needed</th>
                <th scope="col">Passes / segments</th>
                <th scope="col">To 200 km (50 µN·s/J)</th>
                <th scope="col">Decay tail</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {debris.map(d => {
                const p = d.projection;
                const last = d.campaign[d.campaign.length - 1];
                return (
                  <tr key={d.id}>
                    <th scope="row">
                      <button type="button" onClick={() => setSelected(d.id)}>
                        <i style={{ background: d.color }} /> {d.name}
                      </button>
                    </th>
                    <td>
                      {d.massKg >= 1
                        ? `${fmt(d.massKg, 0)} kg`
                        : `${fmt(d.massKg * 1000, 0)} g`}
                    </td>
                    <td>{fmt(p.perigeeNowKm, 1)} km</td>
                    <td>{fmt(last[1], 2)} km</td>
                    <td>{fmt(p.dvRetroDeliveredMs, 3)} m/s</td>
                    <td>{fmt(p.dvRequiredMs, 1)} m/s</td>
                    <td>{p.passes}</td>
                    <td>
                      {p.projectedDays ? days(p.projectedDays['50']) : '—'}
                    </td>
                    <td>{days(p.decayTailDays)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${styles[`proj${p.status}`]}`}
                      >
                        {PROJECTION_LABEL[p.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <details className={styles.details}>
        <summary>Model, limits &amp; sources</summary>
        <ul>
          {scene.limits.map(limit => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
        <p className={styles.sources}>
          Sources:{' '}
          {scene.sources.map((source, index) => (
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
        <p>
          Frame: {scene.frame.name} — {scene.frame.description}. Samples every{' '}
          {scene.stepSeconds} s from a {scene.integratorStepSeconds} s RK4
          integration.{' '}
          {reducedMotion &&
            'Playback is disabled by your reduced-motion preference.'}
        </p>
      </details>
    </section>
  );
}

export default function LaserAblationSim({ src, className = '' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scene, setScene] = useState<LaserScene | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: '320px' }
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
          throw new Error(`Scene request failed: ${response.status}`);
        return response.json() as Promise<LaserScene>;
      })
      .then(data => {
        if (data.schemaVersion !== 'laser-ablation-1')
          throw new Error('Unexpected scene schema');
        setScene(data);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError'))
          setError(true);
      });
    return () => controller.abort();
  }, [visible, scene, error, src]);
  return (
    <div ref={host} className={className}>
      {scene ? (
        <LoadedSim scene={scene} />
      ) : (
        <div className={`${styles.sim} ${styles.fallback}`} role="status">
          <strong>
            {error
              ? 'Laser ablation scene unavailable'
              : 'Loading laser ablation campaign…'}
          </strong>
          <span>
            {error
              ? 'The scene data file could not be loaded.'
              : 'About 0.7 MB of precomputed trajectories load when this section approaches the viewport.'}
          </span>
        </div>
      )}
    </div>
  );
}
