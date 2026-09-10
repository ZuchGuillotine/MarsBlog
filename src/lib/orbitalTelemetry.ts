import * as THREE from 'three';
import type { OrbitalScene } from '../components/OrbitalSample';
type Vector3Tuple = [number, number, number];

export function samplePosition(
  points: Vector3Tuple[],
  velocities: Vector3Tuple[] | undefined,
  time: number,
  step: number
): Vector3Tuple {
  if (points.length === 0) return [0, 0, 0];
  const cursor = Math.max(0, Math.min(points.length - 1, time / step));
  const lower = Math.floor(cursor);
  const upper = Math.min(points.length - 1, lower + 1);
  const blend = cursor - lower;
  if (!velocities?.[lower] || !velocities[upper] || lower === upper) {
    return points[lower].map((value, axis) =>
      THREE.MathUtils.lerp(value, points[upper][axis], blend)
    ) as Vector3Tuple;
  }
  const t2 = blend * blend;
  const t3 = t2 * blend;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + blend;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return points[lower].map(
    (value, axis) =>
      h00 * value +
      h10 * step * velocities[lower][axis] +
      h01 * points[upper][axis] +
      h11 * step * velocities[upper][axis]
  ) as Vector3Tuple;
}

// Differentiate the displayed Hermite curve, rather than interpolating velocities
// separately: the reported motion must agree with the rendered position.
export function sampleVelocity(
  points: Vector3Tuple[],
  velocities: Vector3Tuple[] | undefined,
  time: number,
  step: number
): Vector3Tuple {
  if (points.length < 2) return velocities?.[0] ?? [0, 0, 0];
  const cursor = Math.max(0, Math.min(points.length - 1, time / step));
  const lower = Math.min(Math.floor(cursor), points.length - 2);
  const upper = lower + 1;
  const t = cursor - lower;
  if (!velocities?.[lower] || !velocities[upper]) {
    return points[lower].map(
      (value, axis) => (points[upper][axis] - value) / step
    ) as Vector3Tuple;
  }
  return points[lower].map(
    (value, axis) =>
      ((6 * t * t - 6 * t) * value) / step +
      (3 * t * t - 4 * t + 1) * velocities[lower][axis] +
      ((-6 * t * t + 6 * t) * points[upper][axis]) / step +
      (3 * t * t - 2 * t) * velocities[upper][axis]
  ) as Vector3Tuple;
}

export function sampleBodyQuaternion(scene: OrbitalScene, time: number) {
  const samples = scene.samples;
  if (!samples?.length) return null;
  const cursor = Math.max(
    0,
    Math.min(samples.length - 1, time / scene.stepSeconds)
  );
  const lower = Math.floor(cursor);
  const upper = Math.min(samples.length - 1, lower + 1);
  return new THREE.Quaternion()
    .fromArray(samples[lower].renderBodyQuaternion)
    .slerp(
      new THREE.Quaternion().fromArray(samples[upper].renderBodyQuaternion),
      cursor - lower
    );
}

export function orbitalTelemetry(
  scene: OrbitalScene,
  object: OrbitalScene['objects'][number],
  time: number
) {
  const position = samplePosition(
    object.positionsKm,
    object.velocitiesKmS,
    time,
    scene.stepSeconds
  );
  const velocity = sampleVelocity(
    object.positionsKm,
    object.velocitiesKmS,
    time,
    scene.stepSeconds
  );
  const radius = Math.hypot(...position);
  const orientation = sampleBodyQuaternion(scene, time);
  // Undo the very same body orientation and [x,z,-y] render basis used by the globe.
  const local = orientation
    ? new THREE.Vector3(position[0], position[2], -position[1]).applyQuaternion(
        orientation.invert()
      )
    : null;
  const bodyFixed: Vector3Tuple | null = local
    ? [local.x, -local.z, local.y]
    : null;
  return {
    position,
    velocity,
    radius,
    bodyFixed,
    speed: Math.hypot(...velocity),
    radialSpeed: radius
      ? position.reduce((sum, value, axis) => sum + value * velocity[axis], 0) /
        radius
      : 0,
    latitude: bodyFixed
      ? THREE.MathUtils.radToDeg(
          Math.atan2(bodyFixed[2], Math.hypot(bodyFixed[0], bodyFixed[1]))
        )
      : null,
    longitude: bodyFixed
      ? THREE.MathUtils.radToDeg(Math.atan2(bodyFixed[1], bodyFixed[0]))
      : null,
    altitude: radius - scene.body.radiusKm,
  };
}
