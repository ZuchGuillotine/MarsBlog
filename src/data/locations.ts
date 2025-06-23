import type { LocationData } from '../types/location';

export const sampleLocations: LocationData[] = [
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    coordinates: {
      lat: 18.65,
      lng: -133.8
    },
    elevation: 21287,
    description: 'The largest volcano in the solar system, offering unique opportunities for resource extraction and elevated positioning for settlements.',
    terraformingPotential: {
      rating: 8,
      factors: [
        'Elevated position above dust storms',
        'Potential geothermal energy',
        'Rich mineral deposits',
        'Strategic location for communications'
      ],
      challenges: [
        'Extreme elevation and low atmospheric pressure',
        'Harsh volcanic terrain',
        'Distance from water sources'
      ]
    },
    relatedArticles: ['volcanic-resources', 'elevated-settlements'],
    externalLinks: [
      {
        title: 'NASA: Olympus Mons Overview',
        url: 'https://www.nasa.gov/olympus-mons',
        type: 'nasa'
      }
    ]
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    coordinates: {
      lat: -14.0,
      lng: -59.0
    },
    elevation: -3000,
    description: 'A vast canyon system that could provide natural shelter and access to subsurface water and minerals.',
    terraformingPotential: {
      rating: 9,
      factors: [
        'Natural wind protection',
        'Access to subsurface layers',
        'Potential water ice deposits',
        'Varied elevation zones for different purposes'
      ],
      challenges: [
        'Landslide risks',
        'Complex terrain navigation',
        'Variable atmospheric conditions'
      ]
    },
    relatedArticles: ['canyon-settlements', 'water-extraction'],
    externalLinks: [
      {
        title: 'ESA: Valles Marineris Canyon',
        url: 'https://www.esa.int/valles-marineris',
        type: 'other'
      }
    ]
  },
  {
    id: 'polar-ice-caps',
    name: 'Polar Ice Caps',
    coordinates: {
      lat: 85.0,
      lng: 0.0
    },
    elevation: 0,
    description: 'Massive reservoirs of water ice essential for life support, fuel production, and atmospheric modification.',
    terraformingPotential: {
      rating: 10,
      factors: [
        'Abundant water ice',
        'CO2 ice for atmosphere thickening',
        'Potential for large-scale processing facilities',
        'Strategic resource location'
      ],
      challenges: [
        'Extreme cold temperatures',
        'Seasonal variations',
        'Transportation distances',
        'Complex extraction requirements'
      ]
    },
    relatedArticles: ['water-resources', 'atmospheric-modification'],
    externalLinks: [
      {
        title: 'NASA: Mars Polar Ice',
        url: 'https://www.nasa.gov/mars-ice',
        type: 'nasa'
      }
    ]
  },
  {
    id: 'hellas-basin',
    name: 'Hellas Basin',
    coordinates: {
      lat: -42.0,
      lng: 70.0
    },
    elevation: -8200,
    description: 'The deepest and largest impact crater on Mars, offering higher atmospheric pressure and potential for large settlements.',
    terraformingPotential: {
      rating: 7,
      factors: [
        'Higher atmospheric pressure',
        'Large flat area for construction',
        'Potential subsurface water',
        'Protected from global dust storms'
      ],
      challenges: [
        'Very deep location',
        'Potential for temperature inversions',
        'Limited access routes'
      ]
    },
    relatedArticles: ['impact-basins', 'atmospheric-pressure'],
    externalLinks: [
      {
        title: 'Research: Hellas Basin Studies',
        url: 'https://example.com/hellas-research',
        type: 'research'
      }
    ]
  },
  {
    id: 'amazonis-planitia',
    name: 'Amazonis Planitia',
    coordinates: {
      lat: 15.0,
      lng: -158.0
    },
    elevation: -3000,
    description: 'A smooth plain ideal for landing sites and initial settlement construction with good solar exposure.',
    terraformingPotential: {
      rating: 6,
      factors: [
        'Flat terrain for easy construction',
        'Good solar exposure',
        'Relatively few obstacles',
        'Potential underground water'
      ],
      challenges: [
        'Limited natural shelter',
        'Exposure to dust storms',
        'Distance from major resource deposits'
      ]
    },
    relatedArticles: ['landing-sites', 'solar-power'],
    externalLinks: [
      {
        title: 'Mars Landing Sites Analysis',
        url: 'https://example.com/landing-analysis',
        type: 'research'
      }
    ]
  }
];