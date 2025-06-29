import type { LocationData } from '../types/location';

export const marsLocations: LocationData[] = [
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    coordinates: { lat: 18.38, lng: 77.58 },
    elevation: -2700,
    description:
      'Ancient lake-delta rich in clays; Mars 2020 is caching the first samples for return.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Ancient lake sediments rich in clays',
        'Diverse geological history',
        'Sample return mission site',
        'Potential for organic preservation',
      ],
      challenges: [
        'Dust accumulation',
        'Radiation exposure',
        'Temperature extremes',
      ],
    },
    relatedArticles: ['perseverance-mission', 'mars-sample-return'],
    externalLinks: [
      {
        title: 'Jezero (crater) - Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Jezero_%28crater%29',
        type: 'wiki',
      },
    ],
  },
  {
    id: 'gale-crater',
    name: 'Gale Crater',
    coordinates: { lat: -5.4, lng: 137.8 },
    elevation: -4500,
    description:
      'Layered Mt. Sharp preserves 3-billion-year climate record; rover found organic molecules.',
    terraformingPotential: {
      rating: 8,
      factors: [
        '3-billion-year climate record',
        'Organic molecules detected',
        'Layered geological history',
        'Mount Sharp provides elevation diversity',
      ],
      challenges: [
        'Extreme elevation changes',
        'Dust storms',
        'Limited water resources',
      ],
    },
    relatedArticles: ['curiosity-rover', 'mount-sharp'],
    externalLinks: [
      {
        title: 'Gale (crater) - Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Gale_%28crater%29',
        type: 'wiki',
      },
    ],
  },
  {
    id: 'gusev-crater',
    name: 'Gusev Crater (Columbia Memorial Station)',
    coordinates: { lat: -14.6, lng: 175.5 },
    elevation: -1900,
    description:
      'Basaltic plains altered by hydrothermal water hint at early habitability.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Hydrothermal alteration evidence',
        'Basaltic plains for construction',
        'Early habitability indicators',
        'Relatively flat terrain',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['spirit-rover', 'hydrothermal-activity'],
  },
  {
    id: 'meridiani-planum',
    name: 'Meridiani Planum',
    coordinates: { lat: -1.95, lng: 354.47 },
    elevation: -1400,
    description:
      'Hematite "blueberries" proved long-lasting acidic groundwater.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Hematite deposits',
        'Evidence of past groundwater',
        'Flat terrain for construction',
        'Mineral resources',
      ],
      challenges: [
        'Acidic groundwater history',
        'Limited current water',
        'Dust storms',
      ],
    },
    relatedArticles: ['opportunity-rover', 'hematite-deposits'],
  },
  {
    id: 'chryse-planitia',
    name: 'Chryse Planitia (Viking 1)',
    coordinates: { lat: 22.3, lng: -48.0 },
    elevation: -2700,
    description:
      'First successful Mars landing (1976); benchmark soil & atmosphere data.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Well-characterized site',
        'Baseline atmospheric data',
        'Relatively flat terrain',
        'Historical significance',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['viking-missions', 'mars-atmosphere'],
  },
  {
    id: 'utopia-planitia-viking2',
    name: 'Viking 2 landing, Utopia Planitia',
    coordinates: { lat: 48.0, lng: 134.3 },
    elevation: -4300,
    description:
      'High-latitude soils and seasonal frost studies; periglacial terrain.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Seasonal frost presence',
        'Periglacial terrain',
        'High-latitude water ice',
        'Cold climate adaptation',
      ],
      challenges: [
        'Extreme cold temperatures',
        'Limited sunlight',
        'Seasonal variations',
      ],
    },
    relatedArticles: ['viking-missions', 'seasonal-frost'],
  },
  {
    id: 'zhurong-site',
    name: 'Zhurong rover site, Utopia Planitia',
    coordinates: { lat: 25.07, lng: 109.93 },
    elevation: -4100,
    description:
      "China's rover is probing shallow ice and ancient shoreline deposits.",
    terraformingPotential: {
      rating: 8,
      factors: [
        'Shallow subsurface ice',
        'Ancient shoreline deposits',
        'Water resource potential',
        'Recent exploration data',
      ],
      challenges: [
        'Dust accumulation',
        'Radiation exposure',
        'Temperature extremes',
      ],
    },
    relatedArticles: ['zhurong-rover', 'subsurface-ice'],
    externalLinks: [
      {
        title:
          'Geomorphic contexts and science focus of the Zhurong landing site on Mars',
        url: 'https://www.nature.com/articles/s41550-021-01519-5',
        type: 'research',
      },
    ],
  },
  {
    id: 'elysium-planitia',
    name: 'Elysium Planitia (InSight)',
    coordinates: { lat: 4.5, lng: 135.9 },
    elevation: -2600,
    description:
      'InSight recorded >1,000 marsquakes, revealing crust–mantle structure.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Seismic data available',
        'Crust-mantle structure known',
        'Flat terrain for construction',
        'Geological stability data',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['insight-lander', 'mars-seismology'],
  },
  {
    id: 'isidis-planitia',
    name: 'Isidis Planitia (Beagle 2)',
    coordinates: { lat: 11.5, lng: 90.4 },
    elevation: -3700,
    description: 'Basin rim exposes some of the oldest hydrated crust on Mars.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Oldest hydrated crust',
        'Basin rim geology',
        'Water history evidence',
        'Diverse terrain',
      ],
      challenges: [
        'Limited current water',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['beagle-2', 'hydrated-crust'],
  },
  {
    id: 'ares-vallis',
    name: 'Ares Vallis (Pathfinder)',
    coordinates: { lat: 19.13, lng: -33.22 },
    elevation: -1900,
    description:
      'Flood channel delivered a rock field from many Martian regions.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Diverse rock samples',
        'Flood channel history',
        'Relatively flat terrain',
        'Geological diversity',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['pathfinder-mission', 'flood-channels'],
  },
  {
    id: 'oxia-planum',
    name: 'Oxia Planum',
    coordinates: { lat: 18.2, lng: 335.5 },
    elevation: -2000,
    description:
      'Clay-rich plains ideal for drilling >2 m for ancient organics.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Clay-rich plains',
        'Deep drilling potential',
        'Ancient organic preservation',
        'Water history evidence',
      ],
      challenges: [
        'Dust accumulation',
        'Radiation exposure',
        'Temperature extremes',
      ],
    },
    relatedArticles: ['exomars-2028', 'clay-deposits'],
  },
  {
    id: 'arcadia-planitia',
    name: 'Arcadia Planitia',
    coordinates: { lat: 46.7, lng: 171.9 },
    elevation: -3000,
    description:
      'SWIM map shows ice <30 cm deep—prime ISRU site for astronauts.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Shallow subsurface ice',
        'Prime ISRU location',
        'Water resource abundance',
        'Accessible depth',
      ],
      challenges: [
        'Cold temperatures',
        'Seasonal variations',
        'Limited sunlight',
      ],
    },
    relatedArticles: ['subsurface-ice', 'isru-technology'],
    externalLinks: [
      {
        title: 'Arcadia Planitia - Gazetteer of Planetary Nomenclature',
        url: 'https://planetarynames.wr.usgs.gov/Feature/348',
        type: 'nasa',
      },
      {
        title: 'Best places to find ice on Mars revealed in new NASA map',
        url: 'https://earthsky.org/space/ice-on-mars-mars-map-subsurface-water-ice-mapping-project/',
        type: 'other',
      },
    ],
  },
  {
    id: 'deuteronilus-mensae',
    name: 'Deuteronilus Mensae',
    coordinates: { lat: 42, lng: 330 },
    elevation: -1000,
    description: 'Lobate debris aprons interpreted as debris-covered glaciers.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Debris-covered glaciers',
        'Water ice resources',
        'Elevation diversity',
        'Cold climate adaptation',
      ],
      challenges: [
        'Extreme cold temperatures',
        'Limited sunlight',
        'Seasonal variations',
      ],
    },
    relatedArticles: ['glaciers-mars', 'debris-aprons'],
  },
  {
    id: 'cerberus-fossae',
    name: 'Cerberus Fossae',
    coordinates: { lat: 11, lng: 166 },
    elevation: -2000,
    description:
      'Young fissures that produced marsquakes and recent volcanic/ash flows.',
    terraformingPotential: {
      rating: 5,
      factors: [
        'Recent geological activity',
        'Volcanic resources',
        'Seismic data available',
        'Young surface features',
      ],
      challenges: [
        'Geological instability',
        'Limited water resources',
        'Dust accumulation',
      ],
    },
    relatedArticles: ['marsquakes', 'volcanic-activity'],
  },
  {
    id: 'eberswalde-crater',
    name: 'Eberswalde Crater',
    coordinates: { lat: -24, lng: 327 },
    elevation: -1000,
    description:
      'Textbook inverted-channel delta; once finalist for Mars 2020.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Inverted channel delta',
        'Water history evidence',
        'Diverse geology',
        'Elevation diversity',
      ],
      challenges: [
        'Limited current water',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['inverted-channels', 'delta-systems'],
  },
  {
    id: 'nili-fossae',
    name: 'Nili Fossae',
    coordinates: { lat: 21, lng: 78 },
    elevation: -500,
    description:
      'Carbonate & olivine bedrock records a less-acidic early Mars.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Carbonate deposits',
        'Less-acidic history',
        'Mineral resources',
        'Diverse geology',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['carbonate-deposits', 'early-mars-climate'],
  },
  {
    id: 'mawrth-vallis',
    name: 'Mawrth Vallis',
    coordinates: { lat: 24, lng: 342 },
    elevation: -2000,
    description:
      'Thick phyllosilicate layers point to long-lived surface water.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Thick phyllosilicate layers',
        'Long-lived water history',
        'Clay deposits',
        'Water resource potential',
      ],
      challenges: [
        'Limited current water',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['phyllosilicates', 'ancient-water'],
  },
  {
    id: 'hellas-basin',
    name: 'Hellas Basin',
    coordinates: { lat: -42.7, lng: 70 },
    elevation: -7000,
    description:
      '7-km-deep basin drives massive dust storms and traps volatiles.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Deep basin environment',
        'Volatile trapping',
        'Unique atmospheric conditions',
        'Elevation extremes',
      ],
      challenges: [
        'Massive dust storms',
        'Extreme elevation',
        'Harsh environment',
      ],
    },
    relatedArticles: ['hellas-basin', 'dust-storms'],
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris (Central canyon)',
    coordinates: { lat: -14, lng: 290 },
    elevation: -4000,
    description:
      'Solar-system-scale canyon exposes 8 km of crust; hosts recurring slope lineae.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Deep canyon environment',
        'Crustal exposure',
        'Elevation diversity',
        'Unique microclimates',
      ],
      challenges: [
        'Extreme elevation changes',
        'Limited water resources',
        'Dust accumulation',
      ],
    },
    relatedArticles: ['valles-marineris', 'recurring-slope-lineae'],
  },
  {
    id: 'olympus-mons',
    name: 'Olympus Mons (Tharsis)',
    coordinates: { lat: 18.65, lng: 226.2 },
    elevation: 21200,
    description:
      'Tallest known volcano; lava tubes are candidate human habitats.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Lava tube habitats',
        'Elevation advantages',
        'Volcanic resources',
        'Natural protection',
      ],
      challenges: [
        'Extreme elevation',
        'Limited water resources',
        'Thin atmosphere',
      ],
    },
    relatedArticles: ['olympus-mons', 'lava-tubes'],
  },
  {
    id: 'planum-boreum',
    name: 'Planum Boreum (North polar cap)',
    coordinates: { lat: 85, lng: 0 },
    elevation: 3000,
    description:
      'Multi-km water-ice reserve; drives Martian water cycle each summer.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Massive water ice reserves',
        'Water cycle driver',
        'Cold climate adaptation',
        'Resource abundance',
      ],
      challenges: [
        'Extreme cold temperatures',
        'Limited sunlight',
        'Seasonal variations',
      ],
    },
    relatedArticles: ['north-polar-cap', 'water-cycle'],
  },
  {
    id: 'planum-australe',
    name: 'Planum Australe (South polar cap)',
    coordinates: { lat: -85, lng: 0 },
    elevation: 3000,
    description:
      'CO₂ slab ice atop water ice; radar hints at sub-ice brine lakes.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Water ice reserves',
        'CO₂ resources',
        'Potential sub-ice lakes',
        'Cold climate adaptation',
      ],
      challenges: [
        'Extreme cold temperatures',
        'Limited sunlight',
        'Seasonal variations',
      ],
    },
    relatedArticles: ['south-polar-cap', 'sub-ice-lakes'],
  },
  {
    id: 'medusae-fossae',
    name: 'Medusae Fossae Formation',
    coordinates: { lat: -5, lng: 213 },
    elevation: -1000,
    description:
      'Easily-mined volcanic ash deposit; major source of Martian dust.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Easily-mined deposits',
        'Volcanic resources',
        'Construction materials',
        'Dust source understanding',
      ],
      challenges: [
        'Dust accumulation',
        'Limited water resources',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['medusae-fossae', 'volcanic-ash'],
  },
  {
    id: 'arabia-terra',
    name: 'Arabia Terra',
    coordinates: { lat: 5, lng: 30 },
    elevation: 0,
    description:
      'Site of possible super-volcano calderas; abundant clay-bearing rocks.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Clay-bearing rocks',
        'Super-volcano calderas',
        'Mineral resources',
        'Diverse geology',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['arabia-terra', 'super-volcanoes'],
  },
  {
    id: 'protonilus-mensae',
    name: 'Protonilus Mensae lobate debris aprons',
    coordinates: { lat: 42, lng: 45 },
    elevation: -1000,
    description:
      'Accessible buried ice beneath thin debris—natural refrigeration.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Accessible buried ice',
        'Natural refrigeration',
        'Water resources',
        'Cold climate adaptation',
      ],
      challenges: [
        'Extreme cold temperatures',
        'Limited sunlight',
        'Seasonal variations',
      ],
    },
    relatedArticles: ['lobate-debris-aprons', 'buried-ice'],
  },
  {
    id: 'horowitz-crater',
    name: 'Horowitz Crater RSL',
    coordinates: { lat: -32.1, lng: 165.9 },
    elevation: -2000,
    description:
      'Recurring dark streaks may involve seasonal brines or dry flows.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Recurring slope lineae',
        'Seasonal activity',
        'Water-related features',
        'Recent geological activity',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['recurring-slope-lineae', 'seasonal-brines'],
  },
  {
    id: 'athabasca-valles',
    name: 'Athabasca Valles',
    coordinates: { lat: 10, lng: 155 },
    elevation: -2000,
    description:
      'Geologically young flood-lava channel, possible recent groundwater release.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Recent geological activity',
        'Flood lava channels',
        'Groundwater evidence',
        'Young surface features',
      ],
      challenges: [
        'Limited water resources',
        'Dust accumulation',
        'Radiation exposure',
      ],
    },
    relatedArticles: ['flood-lava', 'recent-groundwater'],
  },
];

export default marsLocations;
