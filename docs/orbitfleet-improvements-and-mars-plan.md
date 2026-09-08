# OrbitFleet improvements and Mars simulation plan

Prepared September 6, 2026. Proposal only; no application or deployment changes.

## Recommendation

Develop one simulation and control engine with Earth and Mars domain adapters. Give visitors a guided, visual experience and engineers an inspectable operations console over the same underlying events. Prioritize causal behavior, traceable evidence, and a complete incident story before adding scenario breadth.

The portfolio claim should be: **A reproducible fleet-operations simulator using public orbital data, modeled subsystem behavior, and constrained autonomous responses whose effects are measured.** Flight-qualified control, live mission telemetry, and operational collision warnings are outside that claim.

## Review scope and findings

Reviewed the production landing page and launch interaction, the local MarsBlog orbit page, and OrbitFleet repository commit `ff1872f5873c45c35c9c9c66581a1cd12c873eed`. The production console could not be entered: launch returned `this client already has an active or queued session`, with no visible recovery option. Console and mechanics findings below are source observations; the deployed backend revision was not independently confirmed. No tests or load benchmarks were run for this planning review.

The current implementation already provides 11 scenario definitions, bounded candidate actions, an advisory model restricted to candidate identifiers, human approval, deterministic validation, delayed outcome checks, sequenced events, and session exports. These are worth preserving.

Important gaps in the inspected source:

- `backend/orbitfleet/satellite.py`: burn/rephase actions decrement delta-v and reduce a drift field; subsequent positions still come from the original propagator. Coverage is an average of mutable per-asset scores; rerouting sets communication availability to true. These support a workflow demonstration but do not yet establish physical or service recovery.
- The same file creates incidents directly from injected scenario labels and assigns confidence from severity. Candidate scores follow list order. Detection and ranking quality cannot yet be inferred from those numbers.
- `backend/orbitfleet/session.py`: `telemetry.csv` contains final subsystem state, without time or position columns. The event JSON contains richer fleet snapshots, so historical data are partly available but not conveniently exposed in the CSV.
- `web/src/App.tsx`: the asset-detail sparkline uses fleet mean battery history. Approved incidents leave the approval queue; streamed verification events do not update the incident model in the event handler. Session state lives in React memory and the socket error handler does not implement an automatic reconnect loop.
- `web/src/FleetGlobe.tsx`: selected orbit paths are constructed as circles; planet rotation is cosmetic wall-clock animation. Geographic coverage needs consistent simulation time and coordinate transformations.
- The backend includes an Orekit service boundary, but the inspected Python runtime uses its own SGP4 adapter. Treat higher-fidelity service integration as work to complete, not demonstrated fidelity.

Source: [OrbitFleet at reviewed commit](https://github.com/ZuchGuillotine/orbitfleet/tree/ff1872f5873c45c35c9c9c66581a1cd12c873eed).

## A. Prioritized Earth improvements

| Priority | Improvement | Deliverable and acceptance condition |
| --- | --- | --- |
| P0 | Reliable entry and recovery | Resume an authenticated session after refresh; reconnect from a sequence cursor; show queue position, expiry, and useful error copy. A prepared replay remains available when live capacity is exhausted. Shared-IP visitors should not be treated as the same authenticated user. Never recover tokens using IP alone. |
| P0 | Guided incident story | A 60–90 second scenario shows normal service, fault, affected region, proposed response, execution, and measured outcome. Visitors can identify what failed, who lost service, and what improved. |
| P0 | Visible incident lifecycle | Preserve incidents through suspected, confirmed, proposed, approved, executing, verifying, recovered/degraded/failed/inconclusive states. Show a readable event description, affected assets, evidence, and result rather than only event-type strings. |
| P1 | Actions change the simulated system | Burns alter velocity and all subsequent trajectory samples; link actions change viable routes and scheduled capacity; derating changes power draw and delivered service. A failed radio cannot be repaired merely by choosing a route. |
| P1 | Real service consequences | Compute coverage from surface demand, geometry, antenna constraints, availability, and capacity. Show outage minutes, delivered data, backlog, and priority traffic preserved. Keep asset health and customer service separate. |
| P1 | Honest telemetry and detection | Separate hidden simulated truth, sensor observations, and estimated state. Inject sensor noise, missing data, bias, delay, and out-of-order samples. Detectors see observations, not scenario labels. Remove uncalibrated confidence percentages. |
| P1 | Useful decision comparison | Compare hold/observe, reduce payload, reroute, and maneuver where applicable. Calculate service gain, delay, power and fuel cost, uncertainty, and constraints. Let visitors inspect alternatives and why validation rejected an option. |
| P1 | Evidence-quality logs | Export timestamped position, velocity, frame, units, subsystem measurements, data quality, event and command IDs, and state provenance. Add a browser timeline with seek, before/after plots, and no-action comparison. |
| P2 | Bounded autonomy | Offer observe-only, approval-required, and policy-authorized operation. Preauthorize selected reversible responses with budgets and cooldowns; retain approval for burns by default. Model onboard versus ground authority explicitly. |
| P2 | Portfolio presentation | Publish a fidelity table, architecture, one annotated incident, downloadable run, and evaluation results. Add keyboard asset selection, color-independent status, reduced motion, mobile layout, and a 2D fallback. |

### Mechanics and verification details

Start with four fully modeled scenarios: power loss, thermal degradation, link loss, and maneuver underperformance. Show physically meaningful outcomes rather than automatic success. A spacecraft may stabilize while permanently losing capacity; a route may restore priority traffic while imagery accumulates; an action may fail because the command path is unavailable.

For an Earth burn, initialize a numerical trajectory from a correctly transformed state at the maneuver epoch and apply the impulse there. Subsequent predictions must follow that state rather than revert to the original public orbital elements. Use actual trajectory samples for displayed paths. Orekit supplies numerical force models and maneuver support, but integration and validation remain necessary. [Orekit forces](https://www.orekit.org/static/architecture/forces.html), [maneuvers](https://www.orekit.org/site-orekit-latest/architecture/maneuvers.html).

Validate the promised outcome: closest-approach improvement for avoidance, restored delivered traffic for routing, and sustained battery/thermal recovery for protection. Fuel expenditure alone does not prove an avoidance maneuver succeeded. Collision probability requires a defensible uncertainty model; otherwise label results as synthetic encounter scores and modeled separation.

Export a run manifest containing fixed epoch, seed, initial states, ephemeris inputs and hashes, model/policy versions, solver settings, event order, and recorded advisor decisions. The same seed alone is insufficient because the current initialization uses wall-clock time. Distinguish exact event playback from deterministic re-simulation.

## B. Mars simulation design

### Experience

Present Mars as a network serving named places: Jezero, Gale, and one explicitly hypothetical outpost selected from Population Mars. Visitors can toggle existing missions, proposed relays, proposed imagers, surface demand, footprints, scheduled links, and an imagery-age map. Separate “can see a satellite,” “can transmit now,” and “data have reached Earth.”

Use three views: a guided incident, an operations console, and a constellation comparison. The default remains understandable without orbital terminology. Keep technical provenance and uncertainty one click away.

### Existing mission data

NASA currently lists Odyssey, Mars Reconnaissance Orbiter, Mars Express, and Trace Gas Orbiter as the four Mars Relay Network spacecraft. MAVEN's mission ended June 3, 2026; the local `src/pages/orbit.astro` still lists it as active. Use dated mission status and separate physical presence from service availability. Historical MAVEN scenarios remain possible when supported by the selected data interval. [NASA Mars Relay Network](https://science.nasa.gov/mars/mars-relay-network/), [NASA MAVEN announcement](https://www.nasa.gov/news-release/nasa-says-farewell-to-maven-mars-mission-hosts-media-call-today/).

Build a per-mission data manifest from NASA NAIF/PDS and ESA SPICE products. Record source URL, kernel hash, coordinate origin and frame, time system, coverage interval, reconstructed/predicted status, and retrieval date. Include supporting planetary ephemerides, orientation, leap-second, and mission frame kernels as needed. Attitude/instrument data are separate dependencies if modeling real pointing. [NAIF data](https://naif.jpl.nasa.gov/naif/data.html), [Mars mission kernels](https://naif.jpl.nasa.gov/naif/data_mars.html), [ESA Mars Express SPICE](https://www.cosmos.esa.int/web/spice/spice-for-mex), [ESA TGO archive](https://archives.esac.esa.int/psa/ftp/ExoMars2016/).

First release: select a fixed epoch with overlapping verified kernel coverage and ship a reproducible interval. Add refreshed prediction windows later. Never silently extend a real mission trajectory beyond its supported interval; offer historical replay or an explicitly modeled continuation. Horizons can assist with supported objects and comparisons, but its spacecraft trajectories may become stale. [Horizons spacecraft caveats](https://ssd.jpl.nasa.gov/horizons/manual.html).

Existing spacecraft remain reference trajectories. Any simulated failure, health, capacity, or response associated with them must be labeled as a hypothetical scenario. Do not assume crosslinks, spare capacity, pointing freedom, or permission to task all missions. Broader spacecraft inventory, including other agencies, can follow a separate source-availability audit; the four relay spacecraft are not a claim of a complete Mars-orbiter census.

### Proposed fleet

Start with an intentionally small, adjustable design: six telecom spacecraft in two inclined planes plus three near-polar imaging spacecraft. Counts and orbits are experiment inputs, not an optimized mission architecture or a promise of continuous coverage.

Compare three cases over identical epochs, demand, and fault seeds: existing reference network under documented service assumptions; that baseline plus proposed relays; and the expanded network plus dedicated imaging. Explore altitude, inclination, plane spacing, phasing, payload field of view, radio capacity, and power/storage budgets before choosing defaults. Higher-altitude relay designs can be a later trade study.

### Shared engine and Mars models

Preserve sessions, event contracts, proposal/approval flow, policy validation, exports, and evaluation. Generalize the existing domain interface and session factory; remove assumptions that all assets have Earth LEO state fields.

1. **Trajectory provider:** existing mission states from SPICE; proposed spacecraft from a Mars-centered propagator. Start with two-body validation, then Mars gravity including J2 for the scenario timescale. Add other perturbations only when error testing warrants them. Do not substitute Mars constants into the Earth SGP4 pipeline.
2. **Geometry:** use an explicit Mars-centered inertial frame for dynamics and Mars body-fixed coordinates for maps, surface sites, footprints, and local horizons. Model rotation and illumination from simulation time. Apply full state transformations when velocities are needed. [NAIF frames](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/FORTRAN/req/frames.html).
3. **Service graph:** links exist only when geometry, pointing, radio compatibility, power, schedule, and capacity permit. Include surface-to-orbiter, supported synthetic crosslinks, and Earth downlinks with finite availability.
4. **Data delivery:** priority queues, finite storage, contact plans, retransmission assumptions, and store-and-forward delivery. Compute light time from distance; distinguish event time, reception time, and command arrival time. NASA describes roughly 3–22.4 minutes of one-way Earth–Mars delay. Additional Mars relays improve access but cannot remove that propagation delay. [NASA relay network](https://science.nasa.gov/mars/mars-relay-network/), [NASA DTN](https://www.nasa.gov/communicating-with-missions/delay-disruption-tolerant-networking/).
5. **Imaging:** modeled swath, pointing/slew limits, illumination, resolution assumptions, storage, and downlink deadlines. Measure usable collected coverage and delivered image age separately. Archived basemaps are context; newly simulated acquisitions are footprints and data products, not invented live photography.
6. **Subsystems and autonomy:** reduced-order power, thermal, radio, attitude, and payload models. A telemetry-observation layer feeds detectors; deterministic candidate generation and validation constrain the advisor. Local preauthorized protection can act before Earth hears of a fault.

### Mars scenarios

| Scenario | Visible consequence | Recovery to demonstrate |
| --- | --- | --- |
| Relay failure | Priority surface traffic waits; imagery backlog grows | Protect bus, route over the next feasible contact, preserve priority packets, defer imagery |
| Eclipse plus weak power system | Battery reserve falls and payload capacity shrinks | Derate payload, reschedule collection, verify sustained recovery |
| Pointing/attitude fault | Radio link margin or image usability deteriorates | Hold imaging, select a supported alternate link, verify pointing recovery |
| Dust-obscured optical imaging | New optical collection becomes less useful | Reschedule or select an explicitly modeled alternative sensor; dust does not arbitrarily switch every radio link off |
| Earth downlink restriction/conjunction scenario | Mars-local traffic continues while Earth delivery waits | Store data, prioritize buffers, respect command restrictions; do not imply Mars-local relays route around the Sun |
| Underperforming maneuver | Predicted ground track diverges from actual trajectory | Estimate residual from noisy observations, compare another burn against fuel cost and delayed service recovery |

Lead with relay failure during Earth-command delay. Compare no response, Earth approval, and preauthorized local response from the same initial state. Show time to protect the asset, priority data delivered, lost/deferred imagery, energy use, and eventual recovery. Synthetic incident details must not be presented as a reconstruction of an actual mission failure.

## Delivery sequence and release gates

| Milestone | Work | Exit evidence |
| --- | --- | --- |
| 1. Dependable Earth demo | Session recovery, guided scenario, complete incident lifecycle, asset-specific plots | Refresh/reconnect and capacity-exhaustion paths remain usable; visitor can explain an incident |
| 2. Shared causal engine | Separate truth/observations, real service graph, persistent maneuver effects, full logs | No physical link means no delivered traffic; a burn changes future position; recovery can fail |
| 3. Mars reference scene | Kernel manifests, fixed epoch, Mars frames, existing orbiters and surface anchors | Sampled vectors and contact windows agree with reference calculations within documented tolerances |
| 4. Proposed Mars fleet | Configurable relays/imagers, demand, coverage and delivery maps | Identical conditions support a repeatable baseline-versus-expansion comparison |
| 5. Mars autonomy demonstration | Three initial faults: relay loss, eclipse/power degradation, pointing fault | Local responses respect authority/budgets; delayed commands cannot act instantaneously |
| 6. Portfolio release | Guided story, replay viewer, evidence package, fidelity statement | A reviewer can reproduce outcomes and inspect failures without a live AI dependency |

Indicative effort for one developer with AI assistance: roughly 6–10 focused development weeks across these milestones, subject to data availability and the chosen fidelity. This is a planning range, not a delivery commitment. The visitor/session improvements should land first; higher-fidelity orbit and service work drives the largest uncertainty.

Acceptance suite should include frame/time consistency, ephemeris interpolation error, maneuver continuity, eclipse/contact boundaries, capacity and buffer conservation, stale-data refusal, unavailable command paths, overlapping faults, delayed verification, and deterministic replay. Set numerical tolerances from the intended horizon and reference comparisons before publishing precision claims.

Evaluate detectors on held-out fault seeds and nuisance conditions, reporting false alarms and detection delay. Evaluate policies against no-action and deterministic baselines, including unsuccessful and inconclusive runs. Report service availability per site, delivered priority data, worst outage, image age, fuel/energy cost, and time to recovery. Do not hide poor outcomes inside a single fleet score.

## First implementation slice

Ship reliable session resume and a guided communications-loss demonstration with a real, small service graph, per-asset time-series export, and persistent recovery results. Reuse that graph and event contract for the first Mars relay scenario. This establishes the shared foundation before expanding the fleet or anomaly catalog.

## Implementation progress and parallel Mars start

**Slice 1 shipped September 7, 2026:** session resume/reconnect, a guided communications outage, capacity-limited primary/standby routes, persistent verification results, per-asset telemetry exports, and an offline recorded replay are deployed at OrbitFleet. The service graph uses configured connections; it does not yet establish line of sight, radio link budgets, or ground coverage from geometry.

**Slice 2A — persistent orbital dynamics and honest 3D (implemented locally; release pending):** make an approved impulse change future spacecraft states, preserve position at the instant of the burn, debit fuel in consistent units, and validate reserve and predicted perigee. Replace the selected spacecraft's decorative circular ring with sampled predictions and an unburned comparison when available. Expose coordinate frame, model, sample times, and limitations. Initially support maneuvers on the designed inertial fleet; public SGP4/TEME trajectories remain reference trajectories until a verified maneuver-frame conversion exists. A successful impulse is not evidence that a conjunction was resolved. Validate against independent analytic two-body results and audit simulation-time behavior in the globe.

**Slice 2B — causal sensing and service (next):** separate simulation truth from received observations and detector decisions; derive supported links from explicit geometry and subsystem state; connect power, payload demand, and delivered service; exercise failed/inconclusive recovery. Preserve the existing session, event, action, and export contracts while making the trajectory/body interfaces reusable.

**Start Mars in tandem once most core Earth fleet logic is functional.** The trigger is demonstrated persistent trajectories and maneuver accounting, observation-driven incident handling, geometry-constrained service delivery, and bounded action/verification contracts with reproducible exports. This is the core exit gate for milestone 2, not a requirement to finish every Earth anomaly, visual refinement, or portfolio page. At that point begin milestone 3's fixed-epoch Mars reference scene and kernel validation in parallel with further Earth scenarios and polish. Read-only Mars data discovery can begin sooner; the Mars simulator should consume stable shared contracts rather than fork an unfinished Earth engine.

The project manager retains responsibility for independent checks of orbital calculations, coordinate/time conventions, sampled-path accuracy, and the rendered 3D scene. Delegate bounded implementation and supporting test work to Sol agents with separate file ownership, then integrate only after numerical, API, and visual evidence agree. Keep current infrastructure and paid-AI request limits; report measured CPU, memory, payload, or dependency increases before proposing capacity changes.

Slice 2A acceptance: 26 backend tests, 20 frontend tests, strict type checks, production build, and an independent two-body numerical audit pass. The full 72,000-second numerical comparison is within about 7.46 m of an ideal Kepler solution; this is solver error, not real-spacecraft accuracy. Browser checks cover paused fuel/state updates, actual sampled paths, inconclusive recovery evidence, and authenticated refresh. Local resource measurements do not justify added hosting capacity. Detailed evidence is maintained in OrbitFleet `docs/slice-2-cost-and-validation.md` and `docs/slice-2-numerical-verification.md`.
