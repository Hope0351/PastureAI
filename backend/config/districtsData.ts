import { DistrictGeoData, FeedDepot } from '../../src/types';

/**
 * Livestock heads are literature-aligned zone estimates (rounded), not live CSA API pulls.
 *
 * Primary sources used for correction (Jul 2026 audit):
 * - Behnke (2010) / CSA aerial + AgSS for Somali zones (Shinile, Jijiga, Liben) — IFPRI ESSP
 * - Afar Regional State / peer-reviewed papers: ~2.34M cattle, 4.27M goats, 2.46M sheep,
 *   0.85M camels region-wide; Zone 1 ≈ ~20–25% share
 * - Borena: peer-reviewed PPR study (~603k cattle, ~63k camels) vs older Borena Pastoral
 *   Development Bureau (~1.6M cattle, ~700k camels); STAR “>1M cattle” → mid estimate used
 * - South Omo Zone livestock office / IISTE: ~906k cattle, ~847k goats, ~497k sheep, ~88k equines
 * - Jimma: CSA AgSS-based district samples (IDOSI 2015); zone scaled from cattle-dominant mixed systems
 *
 * Growth: Somali CSA ~2009 figures scaled ~1.4× for herd recovery/growth to present-day order of magnitude.
 * Feed depots: design capacities + available stocks sized to typical emergency-project buffers (hundreds–~1.2k t),
 * not multi-thousand-ton permanent national reserves.
 */

export interface DistrictRawConfig {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  areaKm2: number;
  capital: string;
  baseNdvi: number;
  livestock: {
    cattle: number;
    camels: number;
    goats: number;
    sheep: number;
    equines: number;
  };
  geoCoordinates: number[][]; // [lng, lat] polygon ring
}

export const FEED_DEPOTS: FeedDepot[] = [
  {
    id: 'depot-yabelo',
    name: 'Yabelo Strategic Feed Reserve',
    location: 'Yabelo, Borena Zone, Oromia',
    latitude: 4.89,
    longitude: 38.08,
    capacityTons: 1500,
    availableStockTons: 650,
    trucksAvailable: {
      heavyTransports20T: 6,
      offRoadTrucks10T: 10,
    },
  },
  {
    id: 'depot-adama',
    name: 'Adama Central Agricultural Grain & Feed Hub',
    location: 'Adama, East Shewa, Oromia',
    latitude: 8.54,
    longitude: 39.27,
    capacityTons: 2500,
    availableStockTons: 1200,
    trucksAvailable: {
      heavyTransports20T: 12,
      offRoadTrucks10T: 16,
    },
  },
  {
    id: 'depot-diredawa',
    name: 'Dire Dawa Relief & Logistics Depot',
    location: 'Dire Dawa Charter City',
    latitude: 9.60,
    longitude: 41.86,
    capacityTons: 1500,
    availableStockTons: 700,
    trucksAvailable: {
      heavyTransports20T: 7,
      offRoadTrucks10T: 12,
    },
  },
  {
    id: 'depot-hawassa',
    name: 'Hawassa Southern Rangeland Support Hub',
    location: 'Hawassa, Sidama Region',
    latitude: 7.06,
    longitude: 38.47,
    capacityTons: 1200,
    availableStockTons: 550,
    trucksAvailable: {
      heavyTransports20T: 6,
      offRoadTrucks10T: 10,
    },
  },
  {
    id: 'depot-jijiga',
    name: 'Jijiga Eastern Pastoral Feed Hub',
    location: 'Jijiga, Somali Region',
    latitude: 9.35,
    longitude: 42.80,
    capacityTons: 1400,
    availableStockTons: 600,
    trucksAvailable: {
      heavyTransports20T: 6,
      offRoadTrucks10T: 12,
    },
  },
];

export const ETHIOPIAN_DISTRICTS_CONFIG: DistrictRawConfig[] = [
  {
    id: 'borena',
    name: 'Borena Zone',
    region: 'Oromia',
    latitude: 4.88,
    longitude: 38.08,
    areaKm2: 48340,
    capital: 'Yabelo',
    baseNdvi: 0.28, // Currently low / drought affected
    // Mid estimate: PPR study (~603k cattle) ↔ bureau/STAR (~1M+ cattle); camels below 2011 bureau after drought losses
    livestock: {
      cattle: 950000,
      camels: 180000,
      goats: 750000,
      sheep: 480000,
      equines: 70000,
    },
    geoCoordinates: [
      [37.5, 5.4],
      [38.6, 5.5],
      [39.1, 4.8],
      [38.9, 4.0],
      [38.0, 3.8],
      [37.2, 4.5],
      [37.5, 5.4],
    ],
  },
  {
    id: 'afar-zone1',
    name: 'Afar Zone 1 (Awash)',
    region: 'Afar',
    latitude: 11.75,
    longitude: 40.95,
    areaKm2: 32100,
    capital: 'Asaita',
    baseNdvi: 0.22, // Critical drought rangeland
    // ~22% of Afar region totals (ARS ~2010 / peer-reviewed): cattle-heavy but camel & goat dominant pastoral mix
    livestock: {
      cattle: 515000,
      camels: 210000,
      goats: 940000,
      sheep: 540000,
      equines: 45000,
    },
    geoCoordinates: [
      [40.2, 12.4],
      [41.5, 12.5],
      [41.8, 11.2],
      [40.8, 11.0],
      [40.0, 11.8],
      [40.2, 12.4],
    ],
  },
  {
    id: 'siti-shinile',
    name: 'Siti (Shinile)',
    region: 'Somali',
    latitude: 10.20,
    longitude: 42.20,
    areaKm2: 38400,
    capital: 'Shinile',
    baseNdvi: 0.25, // Critical rangeland
    // CSA/Behnke Shinile × ~1.4: 207k cattle, 103k camels, 849k goats, 671k sheep
    livestock: {
      cattle: 290000,
      camels: 145000,
      goats: 1190000,
      sheep: 940000,
      equines: 40000,
    },
    geoCoordinates: [
      [41.5, 10.8],
      [42.9, 10.9],
      [43.0, 9.8],
      [41.8, 9.6],
      [41.5, 10.8],
    ],
  },
  {
    id: 'bale-lowlands',
    name: 'Bale Lowlands',
    region: 'Oromia',
    latitude: 6.80,
    longitude: 40.20,
    areaKm2: 29500,
    capital: 'Goba Lowland Depot',
    baseNdvi: 0.38, // Warning state
    // Lowland/pastoral slice of Bale (not full highland zone); moderated agro-pastoral estimate
    livestock: {
      cattle: 520000,
      camels: 75000,
      goats: 420000,
      sheep: 380000,
      equines: 55000,
    },
    geoCoordinates: [
      [39.5, 7.3],
      [40.8, 7.4],
      [41.0, 6.2],
      [39.8, 6.1],
      [39.5, 7.3],
    ],
  },
  {
    id: 'liben-dawa',
    name: 'Liben & Dawa Zone',
    region: 'Somali',
    latitude: 4.40,
    longitude: 39.50,
    areaKm2: 26800,
    capital: 'Filtu',
    baseNdvi: 0.26, // Severe drought risk
    // CSA 2009 Liben × ~1.4: 229k cattle, 150k camels, 488k goats, 182k sheep
    livestock: {
      cattle: 320000,
      camels: 210000,
      goats: 680000,
      sheep: 255000,
      equines: 35000,
    },
    geoCoordinates: [
      [39.0, 5.0],
      [40.2, 5.1],
      [40.3, 3.9],
      [38.9, 3.8],
      [39.0, 5.0],
    ],
  },
  {
    id: 'guji-zone',
    name: 'Guji Zone',
    region: 'Oromia',
    latitude: 5.30,
    longitude: 38.80,
    areaKm2: 18500,
    capital: 'Negele Borana',
    baseNdvi: 0.44, // Moderate / Warning
    // Cattle-oriented agro-pastoral; below previous inflated 1.15M cattle
    livestock: {
      cattle: 720000,
      camels: 55000,
      goats: 450000,
      sheep: 380000,
      equines: 80000,
    },
    geoCoordinates: [
      [38.2, 5.8],
      [39.4, 5.9],
      [39.3, 4.8],
      [38.3, 4.7],
      [38.2, 5.8],
    ],
  },
  {
    id: 'south-omo',
    name: 'South Omo',
    region: 'South Ethiopia',
    latitude: 5.20,
    longitude: 36.60,
    areaKm2: 24200,
    capital: 'Jinka',
    baseNdvi: 0.49, // Moderate Healthy
    // Zone livestock office / IISTE: ~906k cattle, ~847k goats, ~497k sheep, ~311 camels, ~88k equines
    livestock: {
      cattle: 910000,
      camels: 800,
      goats: 850000,
      sheep: 500000,
      equines: 88000,
    },
    geoCoordinates: [
      [35.9, 5.8],
      [37.2, 5.7],
      [37.1, 4.6],
      [36.0, 4.5],
      [35.9, 5.8],
    ],
  },
  {
    id: 'north-wollo',
    name: 'North Wollo Lowlands',
    region: 'Amhara',
    latitude: 11.90,
    longitude: 39.50,
    areaKm2: 16200,
    capital: 'Woldiya',
    baseNdvi: 0.35, // Warning state
    // Amhara mixed/lowland slice; cattle + shoats, few camels
    livestock: {
      cattle: 480000,
      camels: 12000,
      goats: 620000,
      sheep: 580000,
      equines: 95000,
    },
    geoCoordinates: [
      [38.9, 12.4],
      [40.0, 12.3],
      [40.1, 11.4],
      [39.0, 11.5],
      [38.9, 12.4],
    ],
  },
  {
    id: 'fafan-jijiga',
    name: 'Fafan (Jijiga)',
    region: 'Somali',
    latitude: 9.35,
    longitude: 42.80,
    areaKm2: 19800,
    capital: 'Jijiga',
    baseNdvi: 0.32, // Warning state
    // CSA 2009 Jijiga × ~1.4: 373k cattle, 77k camels, 603k goats, 852k sheep
    livestock: {
      cattle: 520000,
      camels: 110000,
      goats: 845000,
      sheep: 1190000,
      equines: 45000,
    },
    geoCoordinates: [
      [42.2, 9.8],
      [43.4, 9.9],
      [43.3, 8.8],
      [42.3, 8.9],
      [42.2, 9.8],
    ],
  },
  {
    id: 'jimma-zone',
    name: 'Jimma Zone',
    region: 'Oromia',
    latitude: 7.67,
    longitude: 36.83,
    areaKm2: 15500,
    capital: 'Jimma',
    baseNdvi: 0.68, // Healthy reference green zone
    // Highland mixed crop-livestock; CSA district samples scale to ~1.1M cattle zone-wide (not 1.85M)
    livestock: {
      cattle: 1100000,
      camels: 2000,
      goats: 280000,
      sheep: 420000,
      equines: 140000,
    },
    geoCoordinates: [
      [36.2, 8.2],
      [37.4, 8.1],
      [37.3, 7.1],
      [36.3, 7.2],
      [36.2, 8.2],
    ],
  },
];

export function buildDistrictGeoJson(raw: DistrictRawConfig): DistrictGeoData {
  return {
    type: 'Feature',
    properties: {
      id: raw.id,
      name: raw.name,
      region: raw.region,
      areaKm2: raw.areaKm2,
      capital: raw.capital,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [raw.geoCoordinates],
    },
  };
}
