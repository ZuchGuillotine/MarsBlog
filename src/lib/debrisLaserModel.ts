// De-orbit timeline model for the SLP-5 page. Shared by the build-time tables
// and the in-page calculator so both always agree.
//
// The model is a momentum budget, nothing more:
//   impulse per burst = shots × pulse energy × C_m × delivery × attitude × cos(off-axis)
//   time to de-orbit  = mass × Δv ÷ impulse per burst × orbital period
// It contains no beam-delivery, tracking or scheduling model.

export const MU_EARTH = 398600.4418; // km^3/s^2
export const R_EARTH = 6378.137; // km

export const laser = {
  pulseEnergyJ: 5.0,
  shotsPerBurst: 3000,
  burstsPerOrbit: 1,
  burstSeconds: 300,
};

/** Fraction of each pulse that lands on the target at a coupling fluence. */
export const DELIVERY_EFFICIENCY = 0.7;
/** Perigee at which drag finishes the job within weeks to months. */
export const DISPOSAL_PERIGEE_KM = 200;

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

export interface TimelineInput {
  massKg: number;
  altKm: number;
  cm: number; // N·s/J
  attitude: number; // 0–1
  offAxisDeg: number;
}

export interface TimelineResult {
  deltaV: number; // m/s
  impulsePerBurst: number; // N·s
  dvPerBurst: number; // m/s
  bursts: number;
  seconds: number;
  energyOnTargetJ: number;
}

export function timeline(i: TimelineInput): TimelineResult {
  const deltaV = deorbitDeltaV(i.altKm);
  const energyPerBurst = laser.shotsPerBurst * laser.pulseEnergyJ * DELIVERY_EFFICIENCY;
  const impulsePerBurst =
    energyPerBurst * i.cm * i.attitude * Math.cos((i.offAxisDeg * Math.PI) / 180);
  const dvPerBurst = impulsePerBurst / i.massKg;
  const bursts = Math.max(1, Math.ceil(deltaV / dvPerBurst));
  const seconds = (bursts / laser.burstsPerOrbit) * orbitalPeriodS(i.altKm);
  return {
    deltaV,
    impulsePerBurst,
    dvPerBurst,
    bursts,
    seconds,
    energyOnTargetJ: bursts * energyPerBurst,
  };
}

/** Bursts needed to change a body's velocity by a small amount (collision-avoidance nudge). */
export function nudgeBursts(i: TimelineInput, dvMs: number): number {
  const t = timeline(i);
  return Math.max(1, Math.ceil(dvMs / t.dvPerBurst));
}

export function formatDuration(seconds: number): string {
  const h = seconds / 3600;
  const d = h / 24;
  const y = d / 365.25;
  if (h < 1.95) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (h < 48) return `${Math.round(h)} hours`;
  if (d < 60) return `${Math.round(d)} days`;
  if (d < 365.25 * 1.95) return `${Math.round(d / 30.44)} months`;
  if (y < 9.95) return `${y.toFixed(1).replace(/\.0$/, '')} years`;
  if (y < 20) return `${Math.round(y)} years`;
  if (y < 1000) return `${Math.round(y / 5) * 5} years`;
  return `${(Math.round(y / 100) * 100).toLocaleString('en-US')} years`;
}
