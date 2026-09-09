# Orbital observatory validation

## Scope and claims

The orbital observatory is a bounded, precomputed visualization. It combines two
different kinds of data and keeps their claims separate:

- The Mars scene contains four historical spacecraft trajectories returned by the
  NASA/JPL Horizons API for 1 January 2025, 00:00–06:00 UTC, plus nine hypothetical
  spacecraft propagated locally.
- The Earth scene contains 24 hypothetical spacecraft selected from a deterministic
  200-spacecraft OrbitFleet designed simulation for 1 January 2025,
  00:00–02:00 UTC. Those samples are simulator truth, not received telemetry and not
  observations of tracked spacecraft.

Neither scene is an operational navigation product, a mission-availability forecast,
or evidence of collision clearance. Playback reads static JSON and textures; it does
not run a simulator, backend session, network ephemeris query, or AI model.

## Mars source provenance

`scripts/orbits/build_mars_scene.py` reads a checked-in source cache. It does not query
Horizons during a site build. Each Horizons response requests geometric Cartesian
position and velocity vectors in kilometres and kilometres per second, centered on
Mars body 499, in ICRF, with no light-time or stellar-aberration correction. The time
tags cover the inclusive six-hour UTC interval at 30-second spacing: 721 states per
object.

The four displayed historical objects and their Horizons target IDs are Mars
Reconnaissance Orbiter (-74), Mars Odyssey (-53), Mars Express (-41), and ExoMars
Trace Gas Orbiter (-143). The cached response includes the complete request URL, the
Horizons result header, and the returned states. The builder rejects a response if its
center, frame, units, geometric-vector mode, row count, cadence, or endpoints do not
match the expected contract. `mars-manifest.json` records SHA-256 hashes of every
cached input and the generated scene.

The source headers support historical-reconstruction wording with one qualification.
The January 2025 interval is inside the explicitly reconstructed or fitted arcs stated
by the current Mars Express, MRO, and Odyssey headers. Their prediction boundaries
are in August or September 2026. The TGO response identifies the source as
`ExoMars16_merged`, but its object-data header does not state a reconstruction cutoff.
The TGO January 2025 vectors are therefore accurately described as a historical
Horizons result from the merged trajectory, without a stronger claim that the cached
header independently proves a tracking-data reconstruction interval. The Sun vectors
come from Horizons using DE441 for the Sun and `mar099` for Mars and supply the
time-varying lighting direction.

The builder loads the NAIF leap-second kernel for time conversion, the generic
planetary constants kernel for Mars radii and IAU body orientation, and the DE440
gravity constants kernel. The Mars gravitational parameter is specifically
`BODY499_GM = 42828.37362069909 km^3/s^2` from `gm_de440.tpc`; the obsolete GM in
`Gravity.tpc` is not loaded. Surface rotation is evaluated from `IAU_MARS` into
SPICE's `J2000` frame, whose inertial axes are ICRF for this use. UTC labels are
converted by SPICE to ephemeris time before evaluating orientation. The renderer maps
source coordinates to Three.js as `[x,z,-y]` and transforms the body quaternion into
that same basis.

## Proposed Mars trajectories

The nine proposed objects are concepts: six relays initialized at 2,000 km above the
Mars equatorial radius and three imagers at 450 km. Their circular initial states are
defined in a Mars-equatorial inertial basis frozen at the sample epoch. The builder
uses fixed-step RK4 integration with a 10-second internal step, emitting states every
30 seconds.

Acceleration includes the Mars point-mass term and an approximate zonal J2 term,
`J2 = 0.001964`. That coefficient comes from the NAIF `Gravity.tpc` correspondence
dating to 1999. It is a useful low-order illustration, not a modern high-degree Mars
gravity-field solution. The model excludes higher harmonics, time-varying gravity,
third bodies, atmospheric drag, solar-radiation pressure, spacecraft attitude,
maneuvers, navigation uncertainty, and force-model estimation. It does not model
radiation faults, link budgets, traffic demand, mission availability, or collision
probability and clearance.

The four published Horizons trajectories are never repropagated by this local model.
Their returned states are copied into the scene unchanged. This separation prevents
the proposed model's force assumptions from being presented as validation of the
historical spacecraft paths.

## Earth source provenance

`scripts/orbits/build_earth_scene.py` imports the actual OrbitFleet Python package from
the adjacent repository and uses its offline designed adapter with seed 1701. It
initializes 200 hypothetical spacecraft at the fixed epoch, retains the first six
configured service-path spacecraft, and selects another 18 at distributed shell
indices through SAT-200. It advances the adapter in correct 30-second increments and
stores 241 positions and velocities through 7,200 seconds. Keeping velocities permits
the renderer to use Hermite interpolation without inventing derivatives from display
points.

The Earth frame is OrbitFleet's
`CONFIGURED_EARTH_CENTERED_INERTIAL` frame. Its prime meridian is defined as +X at the
sample start; it is a designed reference convention rather than an Earth-orientation
realization. Earth rotation is the configured constant-rate spin about +Z, represented
in Three.js by a quaternion about +Y after the `[x,z,-y]` axis mapping. The Sun remains
fixed at +X. Orbit propagation uses OrbitFleet's configured point-mass Earth model.
The generator validates the inclusive time grid, exact identity of the first stored
state with the initialized adapter, and bounded specific-orbital-energy drift. Scene
metadata records the OrbitFleet commit, required source-patch status, seed, fleet
size, selected IDs, and the truth-not-telemetry contract.

## Build and reproduction

Build the Mars scene in a disposable environment from the repository root:

```bash
python3 -m venv /tmp/marspop-orbits-venv
/tmp/marspop-orbits-venv/bin/python -m pip install -r scripts/orbits/requirements-build.txt
/tmp/marspop-orbits-venv/bin/python scripts/orbits/build_mars_scene.py
```

Build the Earth scene with OrbitFleet's existing environment:

```bash
ORBITFLEET_REPO=/Users/benjamincox/Downloads/OrbitFleet \
  /Users/benjamincox/Downloads/OrbitFleet/.venv/bin/python \
  scripts/orbits/build_earth_scene.py
```

The Mars build requires only NumPy and SpiceyPy at the pinned versions in
`requirements-build.txt`. The Earth build uses OrbitFleet's pinned environment. Both
builders consume local inputs and make no paid API or AI calls. Horizons URLs remain
in the cache and scene as provenance, not runtime dependencies.

## Runtime and cost boundary

The browser downloads prebuilt scene JSON and planet textures, then interpolates and
renders locally. There is no recurring backend compute or AI cost for these samples.
Operational cost is static-host storage and transfer: the cached JSON and texture
bytes are the primary bandwidth cost, followed by client GPU and CPU work. Browser
caching and normal static-asset compression can reduce repeat transfer, while texture
resolution and scene-object count remain the main controls on initial payload size.

## Validation gates for future shared logic

Shared simulation logic should remain opt-in by environment and fidelity instead of
silently treating Earth assumptions as planetary defaults. Before a future scene can
claim more than illustrative propagation, its body configuration should identify and
validate:

- gravitational parameter, reference radius, gravity-field degree and order, source,
  epoch applicability, and normalization convention;
- inertial and body-fixed frames, time scale, orientation kernel or Earth-orientation
  data, axis mapping, and frame-transform coverage over the full interval;
- atmosphere model, density inputs, space weather, drag coefficient, area, mass, and
  altitude range when drag matters;
- solar ephemeris, eclipse geometry, reflectivity, area, mass, and attitude when solar
  radiation pressure matters;
- magnetic-field model, epoch, secular variation, coordinate convention, spacecraft
  magnetic properties, and whether magnetic effects influence dynamics or only
  subsystem behavior;
- third bodies, tides, relativity, thrust, finite burns, attitude, and numerical-error
  tolerances when required by the stated use;
- observation timestamps, receipt latency, quality, provenance, covariance, and
  freshness when displaying measured or estimated state rather than simulation truth;
- mission availability, communications, radiation, fault, conjunction, and collision
  models as separate validated layers. Geometric proximity alone must not be labeled
  collision risk or clearance.

A build should fail when a requested claim needs an unavailable model, frame
transform, input interval, or validation tolerance. The UI and manifest should expose
the resulting fidelity level rather than infer it from the presence of a trajectory.

## Numerical validation results

`scripts/orbits/verify_scenes.py` passes with the checked-in inputs. Results are
preserved in `docs/orbital-scene-checks.json`:

- Withholding alternate NASA states and interpolating across 60-second gaps yields
  worst errors of 0.107 m (MRO), 0.082 m (Odyssey), 0.207 m (Mars Express), and
  0.084 m (TGO). The renderer uses the finer 30-second source grid.
- Proposed low Mars orbit, 10-second versus 5-second RK4 steps: maximum position
  difference 0.0102 m over six hours. Point-mass comparison against an independent
  analytic circular orbit: 0.0109 m. Relative J2 energy drift below 2.6e-11.
- J2 acceleration agrees with a finite-difference potential gradient to 1.75e-13
  km/s². Render basis matrices agree with independently evaluated SPICE orientation
  to 5.6e-16; determinants remain unity.
- All arrays have finite positions/velocities, inclusive cadence, and positive
  clearance above the equatorial radius. These are interpolation/integration errors,
  not uncertainty estimates for real spacecraft or the omitted force models.
- Earth generation validates initialized adapter identity and energy drift; its
  source is OrbitFleet commit `138eb2540c27df86fbbac045420de9018865ccb7`.

The Earth audit fixed empty initial observations for paused sessions and invalid-time
packets being masked by healthy packets. The resulting 45 backend tests, Ruff and
strict backend typing pass. Existing independent Kepler, 6,000-case geometry and
causal-outcome checks also pass; frontend CI covers 23 tests and its production build.

For the future Mars operations model, do not carry across Earth's fixed solar input,
atmospheric scale height, magnetorquer authority, trapped-radiation assumptions, or
instantaneous ground commands. Mars requires solar-distance-dependent power,
altitude/season/solar-activity-dependent upper-atmosphere density and composition,
appropriate spacecraft area/mass/drag coefficients, and explicit radiation fault
assumptions. A lack of a global Earth-like magnetic field does not itself provide a
numeric fault probability. Earth-to-Mars command delay and local authority must be
separate from the common mission clock. None of those effects is claimed by these
static trajectory samples.

## Deployment validation results

Astro production build passes (32 pages). Desktop and 375 px mobile browser review
passes for four panels, NASA embed, textured bodies, explicit 60× play/pause,
reset, time scrubbing, fit-path camera control, object selection and expanded source
notes. Camera drag leaves sample time unchanged. Narrow-screen page width equals
viewport width; no horizontal overflow. Long object lists remain collapsed by default.

Earth JSON is 659,701 bytes (308,973 gzip); Mars JSON is 1,254,411 bytes
(579,040 gzip). The new NASA/GSFC Blue Marble composite texture is 1,511,379 bytes;
Mars reuses the existing ~4.3 MB site texture. Texture weather/surface appearance
is illustrative, not a contemporaneous image of the historical epoch. Client code
loads lazily and uses demand rendering; playback suspends offscreen. There are no
new runtime dependencies or hosting services. Existing hosting transfer quotas still
apply, especially with the separate NASA embed and two WebGL views.

OrbitFleet release `138eb25`, tag `observatory-20260909`: CI run `34323685633`
and container publication run `34323685492` both passed. Deployment and public
asset verification follow the release push; see the release confirmation below.
