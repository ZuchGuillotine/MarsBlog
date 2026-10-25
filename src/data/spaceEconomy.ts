export type SpaceCompany = {
  name: string;
  url: string;
  summary: string;
  projectSource?: string;
  // Referral or affiliate link, shown as a disclosed partner link next to the company site.
  partner?: {
    url: string;
    label: string;
  };
  update?: {
    date: string;
    label: string;
    status: string;
    source: string;
  };
};

export type SpaceCategory = {
  id: string;
  title: string;
  description: string;
  companies: SpaceCompany[];
};

// A curated map of commercial organizations, not a claim to list every legal entity.
// Company links are first-party sites; dated updates link to the underlying announcement.
export const spaceCategories: SpaceCategory[] = [
  {
    id: 'launch', title: 'Launch & access',
    description: 'Launch vehicles, launch services, and the infrastructure that gets payloads off Earth.',
    companies: [
      { name: 'SpaceX', url: 'https://www.spacex.com/', summary: 'Reusable launch vehicles, Dragon spacecraft, Starship development, and the Starlink network.', update: { date: '2026-06-12', label: 'Nasdaq listing · SPCX', status: 'Public; launching and operating', source: 'https://ir.spacex.com/faqs-and-contact/' } },
      { name: 'Rocket Lab', url: 'https://www.rocketlabusa.com/', summary: 'Electron launch, Neutron development, spacecraft, and space systems.' },
      { name: 'Blue Origin', url: 'https://www.blueorigin.com/', summary: 'New Shepard and New Glenn launch systems, lunar landers, and engines.' },
      { name: 'United Launch Alliance', url: 'https://www.ulalaunch.com/', summary: 'Vulcan and Atlas V launch services for government and commercial missions.' },
      { name: 'Arianespace', url: 'https://www.arianespace.com/', summary: 'European launch service provider for Ariane and Vega missions.' },
      { name: 'Firefly Aerospace', url: 'https://fireflyspace.com/', summary: 'Alpha launch, lunar delivery, and in-space transportation.' },
      { name: 'Stoke Space', url: 'https://www.stokespace.com/', summary: 'Developing the fully reusable Nova launch vehicle.', update: { date: '2026-09-08', label: '$1B Series E', status: 'Nova Pathfinder in integration; first flight targeted for early 2027', source: 'https://www.stokespace.com/news/stoke-space-series-e' } },
      { name: 'Relativity Space', url: 'https://www.relativityspace.com/', summary: 'Developing Terran R with a focus on large-scale additive manufacturing.' },
      { name: 'PLD Space', url: 'https://www.pldspace.com/', summary: 'Spanish developer of the MIURA launch vehicle family.' },
      { name: 'Isar Aerospace', url: 'https://www.isaraerospace.com/', summary: 'European launch company developing and testing the Spectrum rocket.' },
      { name: 'Rocket Factory Augsburg', url: 'https://www.rfa.space/', summary: 'German launch developer focused on small and medium payloads.' },
      { name: 'Skyroot Aerospace', url: 'https://skyroot.in/', summary: 'Indian launch company developing the Vikram rocket family.' },
      { name: 'Agnikul Cosmos', url: 'https://agnikul.in/', summary: 'Indian launch developer using additively manufactured rocket engines.' },
      { name: 'LandSpace', url: 'https://www.landspace.com/', summary: 'Chinese developer and operator of Zhuque launch vehicles.' },
      { name: 'Galactic Energy', url: 'https://www.galactic-energy.cn/', summary: 'Chinese commercial launch provider behind the Ceres rocket family.' },
      { name: 'Stratolaunch', url: 'https://www.stratolaunch.com/', summary: 'Air-launch and hypersonic flight-test platforms.' },
      { name: 'Virgin Galactic', url: 'https://www.virgingalactic.com/', summary: 'Suborbital human spaceflight and research flights.' },
    ],
  },
  {
    id: 'spacecraft', title: 'Spacecraft & payloads',
    description: 'Satellite platforms, instruments, and mission manufacturing.',
    companies: [
      { name: 'Apex', url: 'https://www.apexspace.com/', summary: 'Productized satellite buses for commercial and national security constellations.', update: { date: '2026-06-05', label: 'More than $200M growth funding', status: 'Scaling satellite production', source: 'https://www.apexspace.com/news/apex-announces-additional-fundraising-at-2b-valuation-to-scale-high-rate-satellite-production-for-proliferated-constellations' } },
      { name: 'K2 Space', url: 'https://www.k2space.com/', summary: 'Large, high-power satellite platforms for communications and defense.', update: { date: '2026-07-30', label: '$500M Series D', status: 'Scaling high-power satellite manufacturing', source: 'https://www.prnewswire.com/news-releases/k2-space-raises-500m-series-d-at-6-8b-valuation-to-scale-large-high-power-satellites-302838793.html' } },
      { name: 'Muon Space', url: 'https://www.muonspace.com/', summary: 'Designs, builds, and operates integrated satellite constellations.', update: { date: '2026-08-20', label: '$250M Series C', status: 'Flying customer satellites; expanding production', source: 'https://www.muonspace.com/muon-space-closes-250-million-series-c-to-scale-space-infrastructure/' } },
      { name: 'Astranis', url: 'https://www.astranis.com/', summary: 'Small geostationary and other high-orbit spacecraft for dedicated capacity.', update: { date: '2026-05-06', label: '$300M Series E plus credit facility', status: 'Scaling spacecraft production', source: 'https://www.astranis.com/blog/series-e-raise-advanced-high-orbit-spacecraft' } },
      { name: 'Loft Orbital', url: 'https://www.loftorbital.com/', summary: 'Standardized satellites and hosted payload services that let customers fly missions faster.' },
      { name: 'York Space Systems', url: 'https://www.yorkspacesystems.com/', summary: 'Satellite platforms and constellation manufacturing for government and commercial customers.' },
      { name: 'CesiumAstro', url: 'https://www.cesiumastro.com/', summary: 'Active phased-array communications payloads and space electronics.', update: { date: '2026-02-02', label: '$270M equity plus $200M financing', status: 'Scaling communications hardware', source: 'https://www.cesiumastro.com/press-release/cesiumastro-closes-470m-series-c' } },
      { name: 'MDA Space', url: 'https://mda.space/', summary: 'Satellite systems, robotics, and geointelligence infrastructure.' },
      { name: 'Airbus Defence and Space', url: 'https://www.airbus.com/en/products-services/space', summary: 'Large spacecraft, Earth observation systems, and space exploration hardware.' },
      { name: 'Thales Alenia Space', url: 'https://www.thalesaleniaspace.com/', summary: 'Satellite systems, orbital infrastructure, and exploration hardware.' },
      { name: 'Lockheed Martin Space', url: 'https://www.lockheedmartin.com/en-us/capabilities/space.html', summary: 'Civil, commercial, and national security spacecraft and deep-space systems.' },
      { name: 'Northrop Grumman Space Systems', url: 'https://www.northropgrumman.com/space', summary: 'Spacecraft, launch components, payloads, and mission systems.' },
      { name: 'Boeing Space', url: 'https://www.boeing.com/space', summary: 'Satellite platforms, human spaceflight hardware, and exploration systems.' },
      { name: 'NanoAvionics', url: 'https://nanoavionics.com/', summary: 'Small satellite buses, components, and mission integration.' },
      { name: 'EnduroSat', url: 'https://www.endurosat.com/', summary: 'Shared satellite platforms, hardware, and mission services.' },
      { name: 'GomSpace', url: 'https://gomspace.com/', summary: 'Nanosatellite platforms, subsystems, and constellation services.' },
      { name: 'ReOrbit', url: 'https://www.reorbit.space/', summary: 'Software-defined satellites and sovereign space systems.' },
    ],
  },
  {
    id: 'connectivity', title: 'Connectivity & spectrum',
    description: 'Broadband, direct-to-device, relay networks, and the rights to use radio spectrum.',
    companies: [
      { name: 'AST SpaceMobile', url: 'https://ast-science.com/', summary: 'Building a cellular broadband network that connects standard phones via satellite.' },
      { name: 'Amazon Leo', url: 'https://www.aboutamazon.com/what-we-do/devices-services/project-kuiper', summary: 'Amazon’s low-Earth-orbit broadband satellite network, formerly Project Kuiper.' },
      { name: 'Eutelsat', url: 'https://www.eutelsat.com/', summary: 'GEO and OneWeb LEO satellite connectivity services.' },
      { name: 'SES', url: 'https://www.ses.com/', summary: 'Multi-orbit satellite connectivity for enterprises, government, and media.' },
      { name: 'Viasat', url: 'https://www.viasat.com/', summary: 'Satellite broadband and mobility connectivity across air, sea, and land.' },
      { name: 'Iridium', url: 'https://www.iridium.com/', summary: 'Global satellite voice, data, and Internet of Things connectivity.' },
      { name: 'Telesat', url: 'https://www.telesat.com/', summary: 'Satellite operator developing the Lightspeed LEO network.' },
      { name: 'Globalstar', url: 'https://www.globalstar.com/en-us', summary: 'Mobile satellite services and spectrum assets.' },
      { name: 'Lynk Global', url: 'https://lynk.world/', summary: 'Direct-to-phone satellite connectivity for mobile network operators.' },
      { name: 'Sateliot', url: 'https://sateliot.space/', summary: 'Satellite-based 5G Internet of Things connectivity.' },
      { name: 'OQ Technology', url: 'https://www.oqtec.space/', summary: 'Satellite 5G Internet of Things network and service.' },
      { name: 'Kepler Communications', url: 'https://www.keplercommunications.com/', summary: 'Space data relay and in-orbit connectivity.' },
      { name: 'Omnispace', url: 'https://omnispace.com/', summary: 'Satellite and terrestrial network integration for 5G connectivity.' },
      { name: 'Grain Management', url: 'https://graingp.com/', summary: 'Communications infrastructure investor and spectrum asset owner. Its nationwide 800 MHz portfolio is under a definitive agreement to be sold to SpaceX for direct-to-device use; the transaction was announced, not described as closed.', update: { date: '2026-10-08', label: '800 MHz sale agreement with SpaceX', status: 'Agreement announced; regulatory process pending', source: 'https://www.prnewswire.com/news-releases/grain-management-announces-definitive-agreement-to-sell-nationwide-800-mhz-spectrum-portfolio-to-spacex-302902974.html' } },
    ],
  },
  {
    id: 'earth-data', title: 'Earth data & intelligence',
    description: 'Images and measurements from orbit, plus tools that turn them into decisions.',
    companies: [
      { name: 'Planet Labs', url: 'https://www.planet.com/', summary: 'Daily Earth imagery, analytics, and satellite services.' },
      { name: 'Maxar Intelligence', url: 'https://www.maxar.com/', summary: 'High-resolution satellite imagery, mapping, and geospatial intelligence.' },
      { name: 'BlackSky', url: 'https://www.blacksky.com/', summary: 'High-revisit Earth imagery and real-time intelligence software.' },
      { name: 'ICEYE', url: 'https://www.iceye.com/', summary: 'Synthetic-aperture radar imagery and disaster intelligence.' },
      { name: 'Capella Space', url: 'https://www.capellaspace.com/', summary: 'Commercial synthetic-aperture radar imagery and analytics.' },
      { name: 'Umbra', url: 'https://umbra.space/', summary: 'High-resolution synthetic-aperture radar satellites and data.' },
      { name: 'Satellogic', url: 'https://satellogic.com/', summary: 'Earth-imaging satellites and geospatial data.' },
      { name: 'Spire Global', url: 'https://spire.com/', summary: 'Space-based weather data, radio-frequency geolocation, and satellite services.' },
      { name: 'HawkEye 360', url: 'https://www.he360.com/', summary: 'Radio-frequency geolocation and analytics from satellite constellations.' },
      { name: 'GHGSat', url: 'https://www.ghgsat.com/', summary: 'Satellite measurement and monitoring of greenhouse gas emissions.' },
      { name: 'Hydrosat', url: 'https://hydrosat.com/', summary: 'Thermal imagery and analytics for water and agriculture.' },
      { name: 'constellr', url: 'https://www.constellr.com/', summary: 'Thermal Earth observation for agriculture, industry, and security.', update: { date: '2026-02-10', label: '€37M Series A', status: 'Expanding thermal intelligence constellation', source: 'https://www.constellr.com/article/constellr-secures-eu37-million-series-a-funding-to-deliver-defence-grade-thermal-intelligence' } },
      { name: 'Pixxel', url: 'https://www.pixxel.space/', summary: 'Hyperspectral satellite imagery and analytics.' },
      { name: 'Synspective', url: 'https://synspective.com/', summary: 'Synthetic-aperture radar satellites and geospatial analytics.' },
      { name: 'SatVu', url: 'https://www.satellitevu.com/', summary: 'High-resolution thermal imaging from orbit.' },
      { name: 'OroraTech', url: 'https://ororatech.com/', summary: 'Thermal satellite data and wildfire intelligence.' },
      { name: 'EarthDaily Analytics', url: 'https://earthdaily.com/', summary: 'Earth observation data and analytics for agriculture and other sectors.' },
    ],
  },
  {
    id: 'mobility', title: 'In-space mobility & servicing',
    description: 'Orbit transfers, rendezvous, inspection, refueling, and debris removal.',
    companies: [
      { name: 'Impulse Space', url: 'https://www.impulsespace.com/', summary: 'Mira and Helios vehicles move and host payloads after launch.', update: { date: '2026-09-16', label: '$808M combined Series D', status: 'Mira flight-proven; scaling mobility fleet', source: 'https://www.impulsespace.com/updates/impulse-space-announces-308-million-series-d-extension-to-meet-increasing-demand-for-in-space-mobility' } },
      { name: 'D-Orbit', url: 'https://www.dorbit.space/', summary: 'Orbital transfer, satellite deployment, and logistics services.' },
      { name: 'Exolaunch', url: 'https://www.exolaunch.com/', summary: 'Launch integration, deployment hardware, and mission management.' },
      { name: 'Astroscale', url: 'https://astroscale.com/', summary: 'On-orbit servicing and debris-removal missions.' },
      { name: 'Starfish Space', url: 'https://www.starfishspace.com/', summary: 'Autonomous satellite life extension and disposal services.', update: { date: '2026-04-07', label: 'More than $100M Series B', status: 'Demonstrations flown; first full Otter missions contracted', source: 'https://www.starfishspace.com/press-release/starfish-space-raises-over-100-million-series-b/' } },
      { name: 'Orbit Fab', url: 'https://www.orbitfab.com/', summary: 'In-orbit refueling interfaces and fuel-delivery infrastructure.' },
      { name: 'ClearSpace', url: 'https://clearspace.today/', summary: 'Active debris removal and in-orbit servicing.' },
      { name: 'True Anomaly', url: 'https://www.trueanomaly.space/', summary: 'Maneuverable spacecraft and software for space security.' },
      { name: 'Portal Space Systems', url: 'https://www.portalsystems.space/', summary: 'Highly maneuverable spacecraft for operations across orbital regimes.', update: { date: '2026-04-09', label: '$50M Series A', status: 'Developing maneuverable spacecraft', source: 'https://www.portalsystems.space/news/press-release-portal-space-systems-raises-50-million-series-a-to-advance-rapidly-maneuverable-spacecraft-capabilities' } },
      { name: 'Fortastra', url: 'https://www.fortastra.com/', summary: 'Maneuverable spacecraft for on-orbit security missions.', update: { date: '2026-10-08', label: '$30M Series A', status: 'Watchdog V0 launched; platform development continuing', source: 'https://www.fortastra.com/newsroom/fortastra-series-a' } },
      { name: 'PAVE Space', url: 'https://pave.space/', summary: 'Developing rapid orbital transfer vehicles for high-energy destinations.', update: { date: '2026-03-25', label: '$40M seed', status: 'Vehicle development', source: 'https://pave.space/logs/pave-space-raises-40m-seed-funding-round/' } },
      { name: 'Rogue Space Systems', url: 'https://rogue.space/', summary: 'Satellite inspection, servicing, and orbital robotics.' },
      { name: 'Turion Space', url: 'https://www.turionspace.com/', summary: 'Space situational awareness and autonomous in-orbit mobility.' },
      { name: 'TransAstra', url: 'https://www.transastracorp.com/', summary: 'Developing orbital debris capture and space-resource technologies.' },
    ],
  },
  {
    id: 'lunar', title: 'Lunar & deep space',
    description: 'Landers, surface mobility, resources, and infrastructure beyond Earth orbit.',
    companies: [
      { name: 'Intuitive Machines', url: 'https://www.intuitivemachines.com/', summary: 'Lunar delivery, communications, and exploration infrastructure.' },
      { name: 'ispace', url: 'https://ispace-inc.com/', summary: 'Lunar landers, payload delivery, and planned lunar data services.' },
      { name: 'Astrobotic', url: 'https://www.astrobotic.com/', summary: 'Lunar landers, rovers, and surface-delivery services.' },
      { name: 'Lunar Outpost', url: 'https://www.lunaroutpost.com/', summary: 'Robotic lunar mobility and surface infrastructure.' },
      { name: 'Astrolab', url: 'https://www.astrolab.space/', summary: 'FLEX lunar rover and surface mobility systems.' },
      { name: 'Interlune', url: 'https://www.interlune.space/', summary: 'Developing technology to extract and return lunar resources.' },
      { name: 'Lunar Resources', url: 'https://www.lunarresources.space/', summary: 'Power, extraction, and industrial systems for lunar operations.' },
      { name: 'ICON', url: 'https://www.iconbuild.com/', summary: 'NASA contractor developing the Olympus robotic construction system for lunar surface infrastructure, including potential landing pads, roads, and habitats.', projectSource: 'https://www.nasa.gov/centers-and-facilities/marshall/nasa-icon-advance-lunar-construction-technology-for-moon-missions/' },
      { name: 'Space Applications Services', url: 'https://www.spaceapplications.com/', summary: 'Space robotics, lunar systems, and mission operations.' },
    ],
  },
  {
    id: 'stations', title: 'Stations, manufacturing & power',
    description: 'Destinations and utility systems for sustained work in orbit.',
    companies: [
      { name: 'Vast', url: 'https://www.vastspace.com/', summary: 'Developing Haven commercial space stations and crewed orbital infrastructure.', update: { date: '2026-03-05', label: '$300M equity plus $200M debt', status: 'Haven Demo flown; Haven-1 in development', source: 'https://www.vastspace.com/updates/vast-secures-500m-in-funding-to-accelerate-production-of-haven-space-stations' } },
      { name: 'Axiom Space', url: 'https://www.axiomspace.com/', summary: 'Private astronaut missions, spacesuits, and the planned Axiom Station.', update: { date: '2026-06-04', label: 'More than $525M financing', status: 'Flying private missions; station in development', source: 'https://www.axiomspace.com/release/axiom-space-closes-oversubscribed-financing-at-525m' } },
      { name: 'Voyager Space', url: 'https://voyagertechnologies.com/', summary: 'Space infrastructure and the Starlab commercial station program.' },
      { name: 'Sierra Space', url: 'https://www.sierraspace.com/', summary: 'Dream Chaser spaceplane and inflatable habitat technology.' },
      { name: 'Varda Space Industries', url: 'https://www.varda.com/', summary: 'Reentry capsules and microgravity pharmaceutical processing.', update: { date: '2026-09-30', label: '$251M Series D', status: 'Reentry missions flown; two vehicles launched together in October 2026', source: 'https://www.varda.com/media' } },
      { name: 'Space Forge', url: 'https://www.spaceforge.com/', summary: 'Returnable orbital manufacturing platforms for advanced materials.' },
      { name: 'Redwire', url: 'https://redwirespace.com/', summary: 'Space infrastructure, components, and in-space manufacturing systems.' },
      { name: 'Space Tango', url: 'https://spacetango.com/', summary: 'Automated microgravity research and manufacturing platforms.' },
      { name: 'Star Catcher', url: 'https://www.star-catcher.com/', summary: 'Developing orbital optical power-beaming infrastructure.', update: { date: '2026-05-12', label: '$65M Series A', status: 'Preparing orbital power demonstration', source: 'https://www.star-catcher.com/news/star-catcher-raises-65-million-to-build-the-first-power-grid-in-space' } },
      { name: 'Mantis Space', url: 'https://www.mantisspace.com/', summary: 'Developing satellites that transmit power to spacecraft in eclipse.', update: { date: '2026-03-12', label: 'More than $10M seed', status: 'Orbital energy system in development', source: 'https://www.prnewswire.com/news-releases/mantis-space-emerges-from-stealth-with-10m-seed-round-to-deliver-sunlight-anywhere-in-orbit-302711576.html' } },
      { name: 'Starcloud', url: 'https://www.starcloud.com/', summary: 'Developing orbital data-center infrastructure.' },
      { name: 'Sophia Space', url: 'https://sophia.space/', summary: 'Developing space-based computing infrastructure.', update: { date: '2026-02-24', label: '$10M seed', status: 'Orbital edge-computing platform in development', source: 'https://sophia.space/news/sophia-space-closes-10m-seed-round-to-accelerate-orbital-edge-computing' } },
      { name: 'Cowboy Space', url: 'https://www.cowboyspace.com/', summary: 'Developing an integrated launch, satellite, and optical-network platform for orbital compute.', update: { date: '2026-05-11', label: '$275M Series B', status: 'Orbital infrastructure platform in development', source: 'https://www.cowboyspace.com/news/introducing-cowboy-space-series-b' } },
      { name: 'Orbital', url: 'https://orbital.inc/', summary: 'Developing solar-powered AI compute satellites for low Earth orbit.', update: { date: '2026-06-09', label: '$5M pre-seed', status: 'Pathfinder mission planned for 2027', source: 'https://www.globenewswire.com/news-release/2026/06/09/3308756/0/en/orbital-raises-oversubscribed-5m-pre-seed-round-to-build-ai-data-centers-in-space.html' } },
    ],
  },
  {
    id: 'ground', title: 'Ground systems & orbital awareness',
    description: 'Ground stations, mission software, tracking, and collision avoidance.',
    companies: [
      { name: 'LeoLabs', url: 'https://leolabs.space/', summary: 'Radar tracking and analytics for objects in low Earth orbit.' },
      { name: 'Slingshot Aerospace', url: 'https://www.slingshot.space/', summary: 'Space tracking, simulation, and orbital intelligence software.' },
      { name: 'NorthStar Earth & Space', url: 'https://northstar-data.com/', summary: 'Space situational awareness and environmental intelligence.' },
      { name: 'HEO', url: 'https://www.heo-robotics.com/', summary: 'Non-Earth imaging for satellite inspection and characterization.' },
      { name: 'COMSPOC', url: 'https://comspoc.com/', summary: 'Space traffic monitoring and mission safety services.' },
      { name: 'Kayhan Space', url: 'https://www.kayhan.space/', summary: 'Conjunction assessment and autonomous collision-avoidance tools.' },
      { name: 'Privateer', url: 'https://www.privateer.com/', summary: 'Space object data and orbital environment intelligence.' },
      { name: 'Aldoria', url: 'https://www.aldoria.com/', summary: 'Optical space surveillance and orbital safety services.' },
      { name: 'KSAT', url: 'https://www.ksat.no/', summary: 'Global ground-station networks and satellite operations.' },
      { name: 'SSC Space', url: 'https://sscspace.com/', summary: 'Ground networks, launch services, and mission operations.' },
      { name: 'RBC Signals', url: 'https://rbcsignals.com/', summary: 'Ground-station network and satellite communications services.' },
      { name: 'Atlas Space Operations', url: 'https://atlasspace.com/', summary: 'Ground-station access and satellite operations software.' },
      { name: 'Aalyria', url: 'https://www.aalyria.com/', summary: 'Software-defined network orchestration and optical communications.' },
      { name: 'GMV', url: 'https://www.gmv.com/', summary: 'Space mission software, ground systems, and navigation.' },
    ],
  },
  {
    id: 'components', title: 'Propulsion & critical components',
    description: 'The engines, electronics, robotics, and subsystems inside space missions.',
    companies: [
      { name: 'Ursa Major', url: 'https://www.ursamajor.com/', summary: 'Rocket propulsion systems and manufacturing.' },
      { name: 'Agile Space Industries', url: 'https://agilespaceindustries.com/', summary: 'In-space propulsion hardware and testing.' },
      { name: 'Benchmark Space Systems', url: 'https://www.benchmarkspacesystems.com/', summary: 'Propulsion systems for satellite maneuvering.' },
      { name: 'Phase Four', url: 'https://www.phasefour.io/', summary: 'Electric propulsion systems for satellites.' },
      { name: 'Exotrail', url: 'https://www.exotrail.com/', summary: 'Electric propulsion and orbital mobility software.' },
      { name: 'ThrustMe', url: 'https://www.thrustme.fr/', summary: 'Electric propulsion systems using iodine propellant.' },
      { name: 'Morpheus Space', url: 'https://www.morpheus-space.com/', summary: 'Electric propulsion and mission design for small satellites.' },
      { name: 'ENPULSION', url: 'https://www.enpulsion.com/', summary: 'Field-emission electric propulsion systems.' },
      { name: 'Busek', url: 'https://www.busek.com/', summary: 'Space propulsion, power electronics, and research hardware.' },
      { name: 'Bradford Space', url: 'https://www.bradford-space.com/', summary: 'Propulsion, attitude control, and other satellite subsystems.' },
      { name: 'Honeybee Robotics', url: 'https://www.honeybeerobotics.com/', summary: 'Robotic drilling, sampling, and mobility systems for planetary missions.' },
      { name: 'Teledyne Space', url: 'https://www.teledynespace.com/en-us', summary: 'Sensors, electronics, and instruments for space missions.' },
    ],
  },
  {
    id: 'capital', title: 'Capital & market infrastructure',
    description: 'Specialist investors and asset owners that finance the sector’s growth.',
    companies: [
      { name: 'Space Capital', url: 'https://www.spacecapital.com/', summary: 'Venture investor and publisher of the Space IQ investment data series.' },
      { name: 'Seraphim Space', url: 'https://seraphim.vc/', summary: 'Space technology investor and publisher of a quarterly investment index.' },
      { name: 'Alpine Space Ventures', url: 'https://www.alpinespace.vc/', summary: 'European venture investor focused on space technologies.' },
      { name: 'SpaceFund', url: 'https://spacefund.com/', summary: 'Venture investor focused on space companies and infrastructure.' },
      { name: 'NewSpace Capital', url: 'https://www.newspace.capital/', summary: 'Growth investor in space technology and the supply chain.' },
    ],
  },
];

export const companyCount = spaceCategories.reduce((total, category) => total + category.companies.length, 0);
export const recentFunding = spaceCategories.flatMap((category) =>
  category.companies
    .filter((company) => company.update && company.update.label !== 'Nasdaq listing · SPCX' && !company.update.label.includes('sale agreement'))
    .map((company) => ({ ...company, category: category.title }))
).sort((a, b) => b.update!.date.localeCompare(a.update!.date));
