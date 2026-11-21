// Timeline model for the SLP-5 page. Shared by the build-time tables and the
// in-page calculator so both always agree.
//
// The model is a momentum budget, nothing more:
//   impulse per orbit = shots × pulse energy × C_m × delivery × attitude × cos(off-axis) × arc efficiency
//   time              = mass × Δv ÷ impulse per orbit × orbital period
// It contains no beam-delivery, tracking or scheduling model.

export const MU_EARTH = 398600.4418; // km^3/s^2
export const R_EARTH = 6378.137; // km

export const laser = {
  pulseEnergyJ: 5.0,
  /** Shots the laser head is designed to survive. */
  designLifeShots: 1e8,
  /** Shot life the growth path needs. */
  growthLifeShots: 1e9,
};

/** Fraction of each pulse that lands on the target at a coupling fluence. */
export const DELIVERY_EFFICIENCY = 0.7;
/** Perigee at which drag finishes the job within weeks to months. */
export const DISPOSAL_PERIGEE_KM = 200;

/**
 * Flight configurations. The laser head is the same in all of them; what
 * changes is how long it fires each orbit and how fast, which is set by the
 * power and radiator the host spacecraft can supply.
 */
export const configs = [
  {
    id: 'a',
    label: '5% of the orbit at 10 Hz',
    short: 'First flight',
    repRateHz: 10,
    duty: 0.051,
    burstSeconds: 300,
    bus: '45–55 W',
    radiator: '0.12–0.15 m²',
    host: 'ESPA-class small satellite',
  },
  {
    id: 'b',
    label: '25% of the orbit at 10 Hz',
    short: 'Longer bursts',
    repRateHz: 10,
    duty: 0.25,
    bus: '160–220 W',
    radiator: '0.45–0.6 m²',
    host: 'Larger small satellite',
  },
  {
    id: 'c',
    label: 'Continuous at 10 Hz',
    short: 'Continuous',
    repRateHz: 10,
    duty: 1,
    bus: '0.6–0.85 kW',
    radiator: '1.7–2.3 m²',
    host: '300–500 kg spacecraft',
  },
  {
    id: 'd',
    label: 'Continuous at 50 Hz',
    short: 'Full rate',
    repRateHz: 50,
    duty: 1,
    bus: '3–4 kW',
    radiator: '8–11 m²',
    host: 'Tonne-class spacecraft',
  },
] as const;
export type ConfigId = (typeof configs)[number]['id'];
export const configById = (id: string) => configs.find(c => c.id === id) ?? configs[0];

export const couplingCases = [
  { id: 'low', value: 25e-6, label: '25 µN·s/J' },
  { id: 'mid', value: 50e-6, label: '50 µN·s/J' },
  { id: 'high', value: 100e-6, label: '100 µN·s/J' },
] as const;

export const attitudeCases = [
  { id: 'stable', factor: 0.8, label: 'Stable, flat face to the beam' },
  { id: 'slow', factor: 0.6, label: 'Slow tumble' },
  { id: 'fast', factor: 0.4, label: 'Fast tumble or irregular shape' },
] as const;

export const directionCases = [
  { id: '0', deg: 0, label: 'Head-on (0° off the velocity vector)' },
  { id: '30', deg: 30, label: '30° off' },
  { id: '60', deg: 60, label: '60° off' },
] as const;

export const massClasses = [
  { kg: 0.01, label: '10 g', example: 'insulation flake, paint chip cluster' },
  { kg: 0.1, label: '100 g', example: 'fastener, small bracket' },
  { kg: 1, label: '1 kg', example: 'structural fragment' },
  { kg: 10, label: '10 kg', example: 'panel section, CubeSat-class body' },
  { kg: 100, label: '100 kg', example: 'small dead satellite' },
  { kg: 1000, label: '1 t', example: 'dead satellite, small upper stage' },
] as const;

export function orbitalPeriodS(altKm: number): number {
  const a = R_EARTH + altKm;
  return 2 * Math.PI * Math.sqrt((a * a * a) / MU_EARTH);
}

export function orbitalSpeedKmS(altKm: number): number {
  return Math.sqrt(MU_EARTH / (R_EARTH + altKm));
}

/** Retrograde Δv (m/s), applied at one point of a circular orbit, that drops the opposite apsis to the disposal perigee. */
export function deorbitDeltaV(altKm: number, perigeeKm = DISPOSAL_PERIGEE_KM): number {
  const r = R_EARTH + altKm;
  const a = (r + R_EARTH + perigeeKm) / 2;
  const vCirc = Math.sqrt(MU_EARTH / r);
  const vApo = Math.sqrt(MU_EARTH * (2 / r - 1 / a));
  return (vCirc - vApo) * 1000;
}

/**
 * How much of a retrograde push still lowers the far side of the orbit when
 * the firing is spread over a fraction of the orbit instead of one point.
 * A push applied an angle θ from the ideal point is worth (1 + cos θ) / 2;
 * averaged over an arc of half-width α that is (1 + sin α / α) / 2, which is
 * 1 for a short burst and 0.5 for firing all the way round.
 */
export function arcEfficiency(duty: number): number {
  const alpha = Math.PI * Math.min(1, Math.max(0, duty));
  if (alpha < 1e-6) return 1;
  return (1 + Math.sin(alpha) / alpha) / 2;
}

export function shotsPerOrbit(configId: string, altKm: number): number {
  const c = configById(configId);
  const fireSeconds = 'burstSeconds' in c ? c.burstSeconds : c.duty * orbitalPeriodS(altKm);
  return c.repRateHz * fireSeconds;
}

export interface TimelineInput {
  massKg: number;
  altKm: number;
  cm: number; // N·s/J
  attitude: number; // 0–1
  offAxisDeg: number;
  config: string;
}

export interface TimelineResult {
  deltaV: number; // m/s
  impulsePerShot: number; // N·s, toward the orbit change
  impulsePerOrbit: number; // N·s
  dvPerOrbit: number; // m/s
  orbits: number;
  shots: number;
  seconds: number;
}

export function timeline(i: TimelineInput): TimelineResult {
  const deltaV = deorbitDeltaV(i.altKm);
  const c = configById(i.config);
  const perShot =
    laser.pulseEnergyJ * DELIVERY_EFFICIENCY * i.cm * i.attitude * Math.cos((i.offAxisDeg * Math.PI) / 180);
  const shotsOrbit = shotsPerOrbit(i.config, i.altKm);
  const impulsePerOrbit = perShot * shotsOrbit * arcEfficiency(c.duty);
  const dvPerOrbit = impulsePerOrbit / i.massKg;
  const orbits = Math.max(1, Math.ceil(deltaV / dvPerOrbit));
  return {
    deltaV,
    impulsePerShot: perShot,
    impulsePerOrbit,
    dvPerOrbit,
    orbits,
    shots: Math.ceil((i.massKg * deltaV) / (perShot * arcEfficiency(c.duty))),
    seconds: orbits * orbitalPeriodS(i.altKm),
  };
}

/** Shots and time to change a body's velocity by a small amount (collision-avoidance nudge). */
export function nudge(i: TimelineInput, dvMs: number): { shots: number; seconds: number } {
  const c = configById(i.config);
  const perShot =
    laser.pulseEnergyJ * DELIVERY_EFFICIENCY * i.cm * i.attitude * Math.cos((i.offAxisDeg * Math.PI) / 180);
  const shots = Math.ceil((i.massKg * dvMs) / perShot);
  const perOrbit = shotsPerOrbit(i.config, i.altKm);
  const fullOrbits = Math.floor(shots / perOrbit);
  const rest = shots - fullOrbits * perOrbit;
  // whole orbits, plus the firing time of the last partial burst
  const seconds = fullOrbits * orbitalPeriodS(i.altKm) + rest / c.repRateHz;
  return { shots, seconds };
}

/** Calendar time for the laser to use up a given number of shots in a configuration. */
export function lifeSeconds(configId: string, shots: number): number {
  const c = configById(configId);
  return shots / (c.repRateHz * c.duty);
}

export function formatDuration(seconds: number): string {
  const h = seconds / 3600;
  const d = h / 24;
  const y = d / 365.25;
  if (seconds < 90) return `${Math.max(1, Math.round(seconds))} s`;
  if (h < 1.95) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (h < 48) return `${Math.round(h)} hours`;
  if (d < 60) return `${Math.round(d)} days`;
  if (d < 365.25 * 1.95) return `${Math.round(d / 30.44)} months`;
  if (y < 9.95) return `${y.toFixed(1).replace(/\.0$/, '')} years`;
  if (y < 20) return `${Math.round(y)} years`;
  if (y < 1000) return `${Math.round(y / 5) * 5} years`;
  return `${(Math.round(y / 100) * 100).toLocaleString('en-US')} years`;
}

export function formatShots(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, '')} billion shots`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')} million shots`;
  if (n >= 1e3) return `${Math.round(n / 1e3).toLocaleString('en-US')} thousand shots`;
  return `${Math.round(n)} shots`;
}
