// Run with: node --experimental-strip-types --test scripts/orbits/test-telemetry.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  samplePosition,
  sampleVelocity,
  orbitalTelemetry,
} from '../../src/lib/orbitalTelemetry.ts';

for (const name of ['mars', 'earth']) {
  const scene = JSON.parse(
    readFileSync(
      new URL(`../../public/data/orbits/${name}-scene.json`, import.meta.url)
    )
  );
  test(`${name}: sample endpoints and interpolated motion match telemetry`, () => {
    for (const object of scene.objects) {
      for (const index of [0, 1, object.positionsKm.length - 1]) {
        const state = orbitalTelemetry(
          scene,
          object,
          index * scene.stepSeconds
        );
        assert.deepEqual(state.position, object.positionsKm[index]);
        state.velocity.forEach((value, axis) =>
          assert.ok(Math.abs(value - object.velocitiesKmS[index][axis]) < 1e-10)
        );
      }
      for (const time of [7.5, 513.75, scene.durationSeconds - 7.5]) {
        const state = orbitalTelemetry(scene, object, time);
        const before = samplePosition(
          object.positionsKm,
          object.velocitiesKmS,
          time - 0.001,
          scene.stepSeconds
        );
        const after = samplePosition(
          object.positionsKm,
          object.velocitiesKmS,
          time + 0.001,
          scene.stepSeconds
        );
        state.velocity.forEach((value, axis) =>
          assert.ok(
            Math.abs(value - (after[axis] - before[axis]) / 0.002) < 1e-7
          )
        );
        assert.ok(
          Math.abs(Math.hypot(...state.bodyFixed) - state.radius) < 1e-8
        );
        assert.ok(
          Math.abs(state.latitude) <= 90 && Math.abs(state.longitude) <= 180
        );
      }
    }
  });
}

test('body-fixed coordinates undo displayed quarter-turn rotation', () => {
  const object = { positionsKm: [[0, 10, 0]], velocitiesKmS: [[0, 0, 0]] };
  const scene = {
    body: { radiusKm: 1 },
    stepSeconds: 1,
    samples: [{ renderBodyQuaternion: [0, Math.SQRT1_2, 0, Math.SQRT1_2] }],
  };
  const state = orbitalTelemetry(scene, object, 0);
  assert.ok(Math.abs(state.bodyFixed[0] - 10) < 1e-12);
  assert.ok(Math.abs(state.longitude) < 1e-12);
  assert.equal(state.latitude, 0);
});

test('position-only samples report the slope of their rendered segment', () => {
  const points = [
    [1, 2, 3],
    [5, 10, 15],
  ];
  assert.deepEqual(sampleVelocity(points, undefined, 1, 2), [2, 4, 6]);
  assert.deepEqual(sampleVelocity(points, undefined, 2, 2), [2, 4, 6]);
});
