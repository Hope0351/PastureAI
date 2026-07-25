import axios from 'axios';
import { DataSource, WeatherData } from '../../src/types';
import { ETHIOPIAN_DISTRICTS_CONFIG, DistrictRawConfig } from '../config/districtsData';
import { appCache } from './cache';

/**
 * Weather Service integrating Open-Meteo Live API
 * Marks each response with dataSource: live | fallback
 */
export class WeatherService {
  private static instance: WeatherService;
  public lastLiveCount = 0;
  public lastFallbackCount = 0;

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  public async getDistrictWeather(districtId: string): Promise<WeatherData> {
    const cacheKey = `weather:${districtId}`;
    const cached = appCache.get<WeatherData>(cacheKey);
    if (cached) return cached;

    const district = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === districtId);
    if (!district) {
      throw new Error(`Unknown district: ${districtId}`);
    }

    try {
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: district.latitude,
          longitude: district.longitude,
          current: 'temperature_2m,relative_humidity_2m,rain,wind_speed_10m',
          daily: 'rain_sum,temperature_2m_max,temperature_2m_min',
          timezone: 'Africa/Addis_Ababa',
          forecast_days: 7,
        },
        timeout: 5000,
      });

      const current = response.data?.current || {};
      const daily = response.data?.daily || {};

      const currentTemp = current.temperature_2m ?? 28.5;
      const relativeHumidity = current.relative_humidity_2m ?? 35;
      const rainfallToday = current.rain ?? 0.0;
      const windSpeed = current.wind_speed_10m ?? 14.2;

      const rainSumArray: number[] = daily.rain_sum || [0, 0, 0, 0, 0, 0, 0];
      const rainfall7DaySum = rainSumArray.reduce((acc: number, val: number) => acc + (val || 0), 0);

      const maxTemp = daily.temperature_2m_max?.[0] ?? currentTemp + 4;
      const minTemp = daily.temperature_2m_min?.[0] ?? currentTemp - 6;

      const droughtSeverityIndex = Math.min(
        100,
        Math.max(0, Math.round((maxTemp - 20) * 2.5 - rainfall7DaySum * 1.8))
      );

      const heatStressIndex = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            currentTemp * 1.8 + 32 - (0.55 - 0.0055 * relativeHumidity) * (currentTemp * 1.8 - 26)
          )
        )
      );

      let weatherCondition = 'Clear & Dry';
      if (rainfallToday > 5) weatherCondition = 'Moderate Rain';
      else if (rainfallToday > 0) weatherCondition = 'Light Showers';
      else if (relativeHumidity < 25) weatherCondition = 'Arid & Low Moisture';

      const data: WeatherData = {
        districtId: district.id,
        districtName: district.name,
        latitude: district.latitude,
        longitude: district.longitude,
        currentTemp: Number(currentTemp.toFixed(1)),
        maxTemp: Number(maxTemp.toFixed(1)),
        minTemp: Number(minTemp.toFixed(1)),
        relativeHumidity: Math.round(relativeHumidity),
        rainfallToday: Number(rainfallToday.toFixed(1)),
        rainfall7DaySum: Number(rainfall7DaySum.toFixed(1)),
        windSpeed: Number(windSpeed.toFixed(1)),
        droughtSeverityIndex,
        heatStressIndex,
        weatherCondition,
        lastUpdated: new Date().toISOString(),
        dataSource: 'live',
      };

      this.lastLiveCount += 1;
      appCache.set(cacheKey, data, 180_000);
      return data;
    } catch {
      const fallback = this.getFallbackWeather(district);
      this.lastFallbackCount += 1;
      appCache.set(cacheKey, fallback, 60_000);
      return fallback;
    }
  }

  public async getAllWeather(): Promise<WeatherData[]> {
    return Promise.all(ETHIOPIAN_DISTRICTS_CONFIG.map((d) => this.getDistrictWeather(d.id)));
  }

  private getFallbackWeather(district: DistrictRawConfig): WeatherData {
    const isArid = district.baseNdvi < 0.3;
    const currentTemp = isArid ? 33.5 : 24.0;

    return {
      districtId: district.id,
      districtName: district.name,
      latitude: district.latitude,
      longitude: district.longitude,
      currentTemp,
      maxTemp: currentTemp + 5,
      minTemp: currentTemp - 7,
      relativeHumidity: isArid ? 22 : 55,
      rainfallToday: isArid ? 0 : 2.5,
      rainfall7DaySum: isArid ? 1.2 : 18.4,
      windSpeed: 16.5,
      droughtSeverityIndex: isArid ? 78 : 28,
      heatStressIndex: isArid ? 82 : 35,
      weatherCondition: isArid ? 'Extreme Heat & Drought' : 'Partly Cloudy',
      lastUpdated: new Date().toISOString(),
      dataSource: 'fallback',
    };
  }
}
