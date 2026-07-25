export type RiskLevel = 'Healthy' | 'Warning' | 'Critical';
export type DataSource = 'live' | 'modeled' | 'fallback';
export type AiGenerator = 'gemini' | 'rules-engine';

export interface LivestockData {
  cattle: number;
  camels: number;
  goats: number;
  sheep: number;
  equines: number;
  totalTLU: number; // Tropical Livestock Units
  densityTLUPerKm2: number;
}

export interface WeatherData {
  districtId: string;
  districtName: string;
  latitude: number;
  longitude: number;
  currentTemp: number; // °C
  maxTemp: number;
  minTemp: number;
  relativeHumidity: number; // %
  rainfallToday: number; // mm
  rainfall7DaySum: number; // mm
  windSpeed: number; // km/h
  droughtSeverityIndex: number; // 0-100
  heatStressIndex: number; // 0-100
  weatherCondition: string;
  lastUpdated: string;
  dataSource?: DataSource;
}

export interface NdviRecord {
  date: string;
  ndvi: number;
  vhi: number; // Vegetation Health Index
  qualityScore?: number;
}

export interface DistrictGeoData {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    region: string;
    areaKm2: number;
    capital: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface DistrictData {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  areaKm2: number;
  capital: string;
  currentNdvi: number;
  meanNdvi: number;
  satelliteDate: string;
  satelliteSensor: string; // e.g., COPERNICUS/S2_SR_HARMONIZED
  satelliteDataSource?: DataSource;
  livestock: LivestockData;
  weather: WeatherData;
  forageConditionIndex: number; // 0-100
  vegetationHealthIndex: number; // 0-100
  grazingPressure: number; // TLU / forage capacity
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  geoJson: DistrictGeoData;
}

export interface ForecastPoint {
  day: number; // 0, 15, 30, 45, 60
  date: string;
  movingAverageNdvi: number;
  exponentialSmoothingNdvi: number;
  polynomialRegressionNdvi: number;
  forecastNdvi: number; // Ensembled / Selected best
  confidenceLower: number;
  confidenceUpper: number;
  expectedForageCondition: string;
  predictedRiskScore: number;
  predictedRiskLevel: RiskLevel;
}

export interface DistrictForecast {
  districtId: string;
  districtName: string;
  currentNdvi: number;
  trend: 'Rapid Decline' | 'Moderate Decline' | 'Stable' | 'Improving';
  forecasts: Record<number, ForecastPoint>; // 0, 15, 30, 45, 60
  modelMeta?: {
    method: string;
    historyPoints: number;
    residualStd: number;
    fittedOn: string;
  };
}

export interface FeedRequirement {
  districtId: string;
  districtName: string;
  timelineDays: number;
  feedNeededTons: number;
  animalsAtRisk: number;
  priorityScore: number; // 0-100
  estimatedEconomicLossUSD: number;
  estimatedEconomicLossETB: number;
  assignedDepotId: string;
  assignedDepotName: string;
  urgencyDays: number;
}

/** Outcome if decisive feed intervention is completed by this forecast horizon */
export interface InterventionScenario {
  actionByDay: 15 | 30 | 45 | 60;
  animalsAtRisk: number;
  projectedMortalityWithoutAction: number;
  animalsSavedIfActionTaken: number;
  saveRatePercent: number;
  economicLossAvoidedUSD: number;
  feedNeededTons: number;
  predictedRiskScore: number;
  predictedRiskLevel: RiskLevel;
  forecastNdvi: number;
}

export interface InterventionImpact {
  districtId: string;
  districtName: string;
  trend: string;
  currentNdvi: number;
  bestActionByDay: 15 | 30 | 45 | 60;
  scenarios: InterventionScenario[];
  summary: string;
}

export interface FeedDepot {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  capacityTons: number;
  availableStockTons: number;
  trucksAvailable: {
    heavyTransports20T: number;
    offRoadTrucks10T: number;
  };
}

export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'depot' | 'delivery_stop';
  cargoTons?: number;
  sequenceOrder: number;
}

export interface OptimizedRoute {
  routeId: string;
  depotId: string;
  depotName: string;
  targetDistrictId: string;
  targetDistrictName: string;
  assignedTruckType: string;
  allocatedFeedTons: number;
  distanceKm: number;
  estimatedTimeHours: number;
  fuelConsumptionLiters: number;
  waypoints: RouteWaypoint[];
  stopsCount?: number;
  feasible?: boolean;
  stockShortfallTons?: number;
  algorithm?: string;
  geoJsonPolyline: {
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: number[][]; // [lng, lat]
    };
    properties: {
      routeId: string;
      color: string;
      distanceKm: number;
    };
  };
}

export interface AiRecommendation {
  districtId: string;
  districtName: string;
  timelineDays: number;
  priority: 'Critical' | 'High' | 'Warning' | 'Moderate' | 'Low';
  summary: string;
  reason: string;
  recommendedAction: string;
  distributionStrategy: string;
  confidence: 'High' | 'Medium' | 'Low';
  plainLanguageExplanation: string;
  generatedAt: string;
  generatedBy?: AiGenerator;
  /** Livestock saved if decisive action is taken by each horizon */
  interventionImpact?: InterventionImpact;
  livestockSavedPrediction?: string;
}

export interface DashboardSummary {
  monitoredDistrictsCount: number;
  highRiskDistrictsCount: number;
  warningDistrictsCount: number;
  healthyDistrictsCount: number;
  totalLivestockAtRisk: number;
  totalFeedDeficitTons: number;
  averageRegionalNdvi: number;
  activeSupplyRoutesCount: number;
  droughtAlertLevel: string;
  lastSatelliteUpdate: string;
  timelineDays?: number;
  estimatedEconomicLossUSD?: number;
}

export interface SystemStatus {
  ok: boolean;
  timestamp: string;
  services: {
    weather: { status: 'live' | 'degraded' | 'unknown'; detail: string };
    satellite: { status: 'live' | 'modeled'; detail: string };
    gemini: { status: 'configured' | 'fallback'; detail: string };
    routing: { status: 'ready'; detail: string };
    forecasting: { status: 'ready'; detail: string };
  };
  cache: { keys: number };
}
