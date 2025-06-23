import type { MarsLocation } from '../types';

export const marsLocations: MarsLocation[] = [
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    coordinates: { lat: 18.65, lng: -133.8 },
    elevation: 21287,
    description: 'The largest volcano in the solar system, standing at 21.9 km above mean elevation.',
    terraformingRationale: 'High elevation provides thinner atmosphere for easier launch operations and potential geothermal energy source.',
    externalLinks: [
      {
        title: 'NASA - Olympus Mons',
        url: 'https://www.nasa.gov/mission_pages/mars/images/olympus-mons.html'
      },
      {
        title: 'Geothermal Potential Study',
        url: 'https://example.com/geothermal-mars'
      }
    ],
    blogSlug: 'olympus-mons-terraforming-potential'
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    coordinates: { lat: -14, lng: -59 },
    elevation: -8000,
    description: 'A vast canyon system extending over 4,000 km, up to 7 km deep and 600 km wide.',
    terraformingRationale: 'Protected environment with potential water ice deposits and natural shelter from radiation.',
    externalLinks: [
      {
        title: 'ESA - Valles Marineris Canyon',
        url: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Valles_Marineris'
      },
      {
        title: 'Water Evidence Research',
        url: 'https://example.com/valles-water'
      }
    ],
    blogSlug: 'valles-marineris-underground-cities'
  },
  {
    id: 'hellas-basin',
    name: 'Hellas Basin',
    coordinates: { lat: -42.7, lng: 70.5 },
    elevation: -8200,
    description: 'The largest visible impact crater on Mars, approximately 2,300 km in diameter.',
    terraformingRationale: 'Deep basin could trap atmosphere and has highest atmospheric pressure on Mars.',
    externalLinks: [
      {
        title: 'Hellas Basin Research',
        url: 'https://example.com/hellas-research'
      }
    ],
    blogSlug: 'hellas-basin-atmospheric-engineering'
  },
  {
    id: 'polar-ice-cap',
    name: 'North Polar Ice Cap',
    coordinates: { lat: 85, lng: 0 },
    elevation: -5000,
    description: 'Permanent ice cap containing water ice and dry ice, crucial for terraforming.',
    terraformingRationale: 'Primary water source for global terraforming efforts and atmosphere thickening.',
    externalLinks: [
      {
        title: 'Mars Polar Ice Research',
        url: 'https://example.com/polar-ice'
      }
    ],
    blogSlug: 'polar-ice-water-extraction'
  },
  {
    id: 'amazonis-planitia',
    name: 'Amazonis Planitia',
    coordinates: { lat: 15, lng: -158 },
    elevation: -3000,
    description: 'A smooth plain in the northern lowlands, ideal for large-scale settlements.',
    terraformingRationale: 'Flat terrain perfect for cities, spaceports, and agricultural domes.',
    externalLinks: [
      {
        title: 'Settlement Planning Study',
        url: 'https://example.com/amazonis-settlement'
      }
    ],
    blogSlug: 'amazonis-planitia-future-cities'
  },
  {
    id: 'chryse-planitia',
    name: 'Chryse Planitia',
    coordinates: { lat: 22.5, lng: -49.97 },
    elevation: -2500,
    description: 'Landing site of Viking 1, known for ancient flood channels.',
    terraformingRationale: 'Evidence of ancient water flows and potential subsurface water deposits.',
    externalLinks: [
      {
        title: 'Viking Landing Site',
        url: 'https://example.com/viking-chryse'
      }
    ],
    blogSlug: 'chryse-planitia-ancient-waters'
  }
];

export function getLocationById(id: string): MarsLocation | undefined {
  return marsLocations.find(location => location.id === id);
}

export function getLocationsByCategory(category: string): MarsLocation[] {
  // This could be expanded with actual categorization
  return marsLocations;
}