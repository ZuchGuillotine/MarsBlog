import type { LocationData } from '../types/mars';

export const marsLocations: LocationData[] = [
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    coordinates: {
      lat: 18.65,
      lng: -133.8
    },
    elevation: 21287,
    type: 'volcano',
    description: 'The largest volcano in the solar system, Olympus Mons stands at over 21 kilometers high and spans roughly 600 kilometers in diameter. This massive shield volcano could potentially provide geothermal energy for future Mars colonies.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Geothermal energy potential',
        'High elevation for atmospheric processing',
        'Diverse mineral resources',
        'Unique geological features'
      ]
    },
    relatedArticles: [
      'olympus-mons-exploration',
      'mars-volcanism-terraforming',
      'geothermal-energy-mars'
    ],
    discoveredBy: 'Mariner 9',
    discoveryDate: '1971',
    significance: 'Largest known volcano in the solar system',
    size: {
      diameter: 600000,
      depth: 21287
    }
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    coordinates: {
      lat: -14.0,
      lng: -59.0
    },
    elevation: -3000,
    type: 'canyon',
    description: 'The largest canyon system in the solar system, stretching over 4,000 kilometers long and reaching depths of up to 7 kilometers. This massive rift could serve as a natural shelter and potential site for underground colonies.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Natural shelter from radiation',
        'Protected from dust storms',
        'Evidence of past water activity',
        'Stable temperature variations',
        'Mineral-rich canyon walls'
      ]
    },
    relatedArticles: [
      'valles-marineris-habitat',
      'underground-mars-colonies',
      'mars-canyon-exploration'
    ],
    discoveredBy: 'Mariner 9',
    discoveryDate: '1971',
    significance: 'Largest canyon system in the solar system',
    size: {
      length: 4000000,
      width: 200000,
      depth: 7000
    }
  },
  {
    id: 'hellas-basin',
    name: 'Hellas Basin',
    coordinates: {
      lat: -42.4,
      lng: 70.5
    },
    elevation: -8180,
    type: 'crater',
    description: 'One of the largest impact basins in the solar system, Hellas Basin is over 2,300 kilometers in diameter. Its low elevation creates higher atmospheric pressure, making it one of the most Earth-like locations on Mars.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Highest atmospheric pressure on Mars',
        'Potential for liquid water',
        'Large flat area for development',
        'Protected from global dust storms',
        'Evidence of past hydrothermal activity'
      ]
    },
    relatedArticles: [
      'hellas-basin-atmosphere',
      'mars-impact-basins',
      'atmospheric-pressure-terraforming'
    ],
    discoveredBy: 'Giovanni Schiaparelli',
    discoveryDate: '1877',
    significance: 'Deepest point on Mars with highest atmospheric pressure',
    size: {
      diameter: 2300000,
      depth: 8180
    }
  },
  {
    id: 'north-polar-cap',
    name: 'North Polar Ice Cap',
    coordinates: {
      lat: 85.0,
      lng: 0.0
    },
    elevation: 0,
    type: 'polar',
    description: 'Mars\' northern ice cap contains vast amounts of water ice and some dry ice. This represents one of the largest accessible water reserves on Mars, crucial for any terraforming efforts.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Massive water ice reserves',
        'Seasonal CO2 sublimation',
        'Potential for atmospheric modification',
        'Extreme but manageable temperatures'
      ]
    },
    relatedArticles: [
      'mars-polar-ice-caps',
      'water-extraction-mars',
      'polar-base-designs'
    ],
    discoveredBy: 'William Herschel',
    discoveryDate: '1784',
    significance: 'Largest water ice reservoir on Mars',
    size: {
      diameter: 1000000
    }
  },
  {
    id: 'gale-crater',
    name: 'Gale Crater',
    coordinates: {
      lat: -5.4,
      lng: 137.8
    },
    elevation: -4500,
    type: 'crater',
    description: 'Home to NASA\'s Curiosity rover, Gale Crater contains Mount Sharp (Aeolis Mons) and shows extensive evidence of past water activity. The crater\'s layered geology tells the story of Mars\' climate history.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Confirmed past habitability',
        'Diverse mineral composition',
        'Evidence of ancient rivers and lakes',
        'Central mountain for varied elevations',
        'Active research and mapping'
      ]
    },
    relatedArticles: [
      'gale-crater-exploration',
      'curiosity-rover-discoveries',
      'mars-ancient-climate'
    ],
    discoveredBy: 'Walter F. Gale',
    discoveryDate: '1919',
    significance: 'Site of major rover exploration and habitability evidence',
    size: {
      diameter: 154000
    }
  },
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    coordinates: {
      lat: 18.38,
      lng: 77.58
    },
    elevation: -2500,
    type: 'crater',
    description: 'The landing site of NASA\'s Perseverance rover, Jezero Crater was once a lake fed by rivers. Its preserved river delta and diverse geology make it an ideal location for studying past life and future habitability.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Ancient lake environment',
        'Preserved organic materials',
        'River delta deposits',
        'Carbonate and clay minerals',
        'Potential biosignatures'
      ]
    },
    relatedArticles: [
      'jezero-crater-astrobiology',
      'perseverance-rover-mission',
      'mars-ancient-lakes'
    ],
    discoveredBy: 'Mars Global Surveyor',
    discoveryDate: '1997',
    significance: 'Prime location for astrobiology research',
    size: {
      diameter: 45000
    }
  },
  {
    id: 'tharsis-region',
    name: 'Tharsis Volcanic Region',
    coordinates: {
      lat: 0.0,
      lng: -100.0
    },
    elevation: 5000,
    type: 'volcano',
    description: 'The largest volcanic region on Mars, containing several massive shield volcanoes including Olympus Mons. This region represents enormous geothermal potential and mineral resources.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Multiple geothermal sources',
        'Rich mineral deposits',
        'Elevated terrain',
        'Volcanic soil for agriculture',
        'Natural landmarks for navigation'
      ]
    },
    relatedArticles: [
      'tharsis-volcanism',
      'mars-geological-history',
      'volcanic-soil-agriculture'
    ],
    discoveredBy: 'Mariner 9',
    discoveryDate: '1971',
    significance: 'Largest volcanic province in the solar system',
    size: {
      diameter: 4000000
    }
  },
  {
    id: 'chryse-planitia',
    name: 'Chryse Planitia',
    coordinates: {
      lat: 22.7,
      lng: -50.0
    },
    elevation: -2500,
    type: 'plain',
    description: 'The landing site of Viking 1, Chryse Planitia is a large plain that shows evidence of massive ancient floods. Its relatively flat terrain and moderate elevation make it suitable for large-scale development.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Flat terrain for construction',
        'Evidence of past water flow',
        'Moderate elevation',
        'Well-studied geology',
        'Historical landing site'
      ]
    },
    relatedArticles: [
      'chryse-planitia-geology',
      'viking-landing-sites',
      'mars-flood-plains'
    ],
    discoveredBy: 'Viking 1',
    discoveryDate: '1976',
    significance: 'First successful Mars landing site',
    size: {
      diameter: 1600000
    }
  },
  {
    id: 'arcadia-planitia',
    name: 'Arcadia Planitia',
    coordinates: {
      lat: 40.0,
      lng: -120.0
    },
    elevation: -3000,
    type: 'plain',
    description: 'A smooth plain in Mars\' northern lowlands with significant subsurface ice deposits. Recent studies suggest this region has some of the most accessible water ice on Mars.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Abundant subsurface ice',
        'Smooth terrain',
        'Low elevation for higher pressure',
        'Protected from dust storms',
        'Potential for ice mining'
      ]
    },
    relatedArticles: [
      'arcadia-planitia-ice',
      'mars-subsurface-water',
      'ice-mining-techniques'
    ],
    discoveredBy: 'Mars Global Surveyor',
    discoveryDate: '1997',
    significance: 'Major subsurface ice deposits',
    size: {
      diameter: 1000000
    }
  },
  {
    id: 'amazonis-planitia',
    name: 'Amazonis Planitia',
    coordinates: {
      lat: 0.0,
      lng: -160.0
    },
    elevation: -1000,
    type: 'plain',
    description: 'One of the smoothest and youngest plains on Mars, Amazonis Planitia shows evidence of recent volcanic activity. Its flat surface and central location make it ideal for a major spaceport.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Extremely flat surface',
        'Young geological age',
        'Central location',
        'Potential recent volcanism',
        'Ideal for large infrastructure'
      ]
    },
    relatedArticles: [
      'amazonis-planitia-geology',
      'mars-spaceport-design',
      'recent-mars-volcanism'
    ],
    discoveredBy: 'Mariner 9',
    discoveryDate: '1971',
    significance: 'Youngest large plain on Mars',
    size: {
      diameter: 1600000
    }
  }
];

// Export additional location categories
export const locationsByType = {
  volcano: marsLocations.filter(loc => loc.type === 'volcano'),
  crater: marsLocations.filter(loc => loc.type === 'crater'),
  plain: marsLocations.filter(loc => loc.type === 'plain'),
  canyon: marsLocations.filter(loc => loc.type === 'canyon'),
  polar: marsLocations.filter(loc => loc.type === 'polar')
};

export const highPotentialLocations = marsLocations.filter(
  loc => loc.terraformingPotential.rating >= 8
);

export const landingSites = marsLocations.filter(
  loc => ['gale-crater', 'jezero-crater', 'chryse-planitia'].includes(loc.id)
);

export default marsLocations;