import { DistrictData, LivestockData, RiskLevel } from '../../src/types';
import { ETHIOPIAN_DISTRICTS_CONFIG, buildDistrictGeoJson } from '../config/districtsData';
import { GeeSatelliteService } from './geeService';
import { WeatherService } from './weatherService';
import { appCache } from './cache';

/**
 * Rangeland Data Processing Engine
 * Integrates NDVI, Open-Meteo Weather, Livestock Demographics
 * Computes Forage Condition Index (FCI), Vegetation Health, Grazing Pressure, and Risk Scores
 */
export class DataProcessorService {
  private static instance: DataProcessorService;
  private geeService: GeeSatelliteService;
  private weatherService: WeatherService;

  private constructor() {
    this.geeService = GeeSatelliteService.getInstance();
    this.weatherService = WeatherService.getInstance();
  }

  public static getInstance(): DataProcessorService {
    if (!DataProcessorService.instance) {
      DataProcessorService.instance = new DataProcessorService();
    }
    return DataProcessorService.instance;
  }

  public async processDistrict(districtId: string): Promise<DistrictData> {
    const cacheKey = `district:${districtId}`;
    const cached = appCache.get<DistrictData>(cacheKey);
    if (cached) return cached;

    const rawConfig = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === districtId);
    if (!rawConfig) {
      throw new Error(`Unknown district: ${districtId}`);
    }

    const satelliteInfo = await this.geeService.getDistrictNdvi(rawConfig.id);
    const weather = await this.weatherService.getDistrictWeather(rawConfig.id);

    const cattleTLU = rawConfig.livestock.cattle * 0.7;
    const camelTLU = rawConfig.livestock.camels * 1.0;
    const goatTLU = rawConfig.livestock.goats * 0.1;
    const sheepTLU = rawConfig.livestock.sheep * 0.1;
    const equineTLU = rawConfig.livestock.equines * 0.5;

    const totalTLU = Math.round(cattleTLU + camelTLU + goatTLU + sheepTLU + equineTLU);
    const densityTLUPerKm2 = Number((totalTLU / rawConfig.areaKm2).toFixed(2));

    const livestockData: LivestockData = {
      ...rawConfig.livestock,
      totalTLU,
      densityTLUPerKm2,
    };

    const minNdviThreshold = 0.1;
    const maxNdviThreshold = 0.75;
    const vegetationHealthIndex = Math.min(
      100,
      Math.max(0, Math.round(((satelliteInfo.ndvi - minNdviThreshold) / (maxNdviThreshold - minNdviThreshold)) * 100))
    );

    const rainfallRatio = Math.min(1.0, weather.rainfall7DaySum / 35.0);
    const heatImpactNormalized = (100 - weather.heatStressIndex) / 100.0;

    const forageConditionIndex = Math.min(
      100,
      Math.max(0, Math.round(satelliteInfo.ndvi * 60 + rainfallRatio * 25 + heatImpactNormalized * 15))
    );

    const grazingPressure = Number((densityTLUPerKm2 / (forageConditionIndex / 100 + 0.05)).toFixed(2));

    const ndviRiskFactor = (1 - satelliteInfo.ndvi) * 50;
    const droughtRiskFactor = (weather.droughtSeverityIndex / 100) * 25;
    const pressureRiskFactor = Math.min(25, (grazingPressure / 40) * 25);
    const riskScore = Math.min(100, Math.max(0, Math.round(ndviRiskFactor + droughtRiskFactor + pressureRiskFactor)));

    let riskLevel: RiskLevel = 'Healthy';
    if (riskScore >= 65) riskLevel = 'Critical';
    else if (riskScore >= 38) riskLevel = 'Warning';

    const result: DistrictData = {
      id: rawConfig.id,
      name: rawConfig.name,
      region: rawConfig.region,
      latitude: rawConfig.latitude,
      longitude: rawConfig.longitude,
      areaKm2: rawConfig.areaKm2,
      capital: rawConfig.capital,
      currentNdvi: satelliteInfo.ndvi,
      meanNdvi: Number(
        (
          satelliteInfo.historicalSeries.reduce((a, p) => a + p.ndvi, 0) /
          Math.max(1, satelliteInfo.historicalSeries.length)
        ).toFixed(3)
      ),
      satelliteDate: satelliteInfo.date,
      satelliteSensor: satelliteInfo.sensor,
      satelliteDataSource: satelliteInfo.dataSource,
      livestock: livestockData,
      weather,
      forageConditionIndex,
      vegetationHealthIndex,
      grazingPressure,
      riskScore,
      riskLevel,
      geoJson: buildDistrictGeoJson(rawConfig),
    };

    appCache.set(cacheKey, result, 90_000);
    return result;
  }

  public async processAllDistricts(): Promise<DistrictData[]> {
    return Promise.all(ETHIOPIAN_DISTRICTS_CONFIG.map((d) => this.processDistrict(d.id)));
  }
}
