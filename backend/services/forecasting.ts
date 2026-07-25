import { DistrictForecast, ForecastPoint, RiskLevel } from '../../src/types';
import { GeeSatelliteService } from './geeService';
import { WeatherService } from './weatherService';
import { ETHIOPIAN_DISTRICTS_CONFIG } from '../config/districtsData';
import { appCache } from './cache';

/**
 * Statistical Forecasting Engine
 * Fits Moving Average, Holt linear trend, and 2nd-degree polynomial regression
 * on the district NDVI historical series, then ensembles projections to +60 days.
 */
export class ForecastingService {
  private static instance: ForecastingService;
  private geeService: GeeSatelliteService;
  private weatherService: WeatherService;

  private constructor() {
    this.geeService = GeeSatelliteService.getInstance();
    this.weatherService = WeatherService.getInstance();
  }

  public static getInstance(): ForecastingService {
    if (!ForecastingService.instance) {
      ForecastingService.instance = new ForecastingService();
    }
    return ForecastingService.instance;
  }

  public async forecastDistrict(districtId: string): Promise<DistrictForecast> {
    const cacheKey = `forecast:${districtId}`;
    const cached = appCache.get<DistrictForecast>(cacheKey);
    if (cached) return cached;

    const config = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === districtId);
    if (!config) {
      throw new Error(`Unknown district: ${districtId}`);
    }

    const satellite = await this.geeService.getDistrictNdvi(districtId);
    const weather = await this.weatherService.getDistrictWeather(districtId);
    const series = satellite.historicalSeries;
    const values = series.map((p) => p.ndvi);
    const baseNdvi = satellite.ndvi;
    const droughtSeverity = weather.droughtSeverityIndex;

    // Fit models on observed history (time index in ~15-day composite steps)
    const maWindow = Math.min(5, values.length);
    const lastMa = this.movingAverage(values, maWindow);
    const holt = this.fitHolt(values, 0.35, 0.15);
    const poly = this.fitQuadratic(values);

    const residualStd = Math.min(
      0.08,
      this.residualStd(values, (i) => {
        const h = holt.level + holt.trend * (i - (values.length - 1));
        const p = poly.a * i * i + poly.b * i + poly.c;
        return (lastMa + h + p) / 3;
      })
    );

    // Weather stress tilts the ensemble toward decline during drought
    const droughtTilt = (droughtSeverity / 100) * 0.0018;

    const horizons = [0, 15, 30, 45, 60];
    const forecastMap: Record<number, ForecastPoint> = {};
    const stepDays = 15;

    horizons.forEach((day) => {
      const forecastDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const stepsAhead = day / stepDays;
      const t = values.length - 1 + stepsAhead;

      if (day === 0) {
        const fci = Math.max(0, Math.round((baseNdvi / 0.65) * 100));
        const riskScore = Math.min(100, Math.max(0, Math.round((1 - baseNdvi) * 70 + (droughtSeverity / 100) * 30)));
        forecastMap[0] = {
          day: 0,
          date: forecastDate,
          movingAverageNdvi: Number(baseNdvi.toFixed(3)),
          exponentialSmoothingNdvi: Number(baseNdvi.toFixed(3)),
          polynomialRegressionNdvi: Number(baseNdvi.toFixed(3)),
          forecastNdvi: Number(baseNdvi.toFixed(3)),
          confidenceLower: Number(baseNdvi.toFixed(3)),
          confidenceUpper: Number(baseNdvi.toFixed(3)),
          expectedForageCondition: this.getConditionLabel(fci),
          predictedRiskScore: riskScore,
          predictedRiskLevel: this.riskLevel(riskScore),
        };
        return;
      }

      const maForecast = this.clamp(lastMa - droughtTilt * day * 0.7, 0.08, 0.85);
      const holtForecast = this.clamp(holt.level + holt.trend * stepsAhead - droughtTilt * day, 0.08, 0.85);
      const polyForecast = this.clamp(poly.a * t * t + poly.b * t + poly.c - droughtTilt * day * 1.1, 0.08, 0.85);

      // Ensemble: Holt (recent trend) weighted highest
      const ensembleNdvi = Number((maForecast * 0.25 + holtForecast * 0.45 + polyForecast * 0.3).toFixed(3));
      const errorMargin = Math.max(0.012, residualStd * (1 + stepsAhead * 0.35)) + (day / 60) * 0.02;
      const confidenceLower = Number(Math.max(0.05, ensembleNdvi - errorMargin).toFixed(3));
      const confidenceUpper = Number(Math.min(0.85, ensembleNdvi + errorMargin).toFixed(3));

      const predictedFci = Math.max(0, Math.round((ensembleNdvi / 0.65) * 100));
      const predictedRiskScore = Math.min(
        100,
        Math.max(0, Math.round((1 - ensembleNdvi) * 70 + (droughtSeverity / 100) * 30))
      );

      forecastMap[day] = {
        day,
        date: forecastDate,
        movingAverageNdvi: Number(maForecast.toFixed(3)),
        exponentialSmoothingNdvi: Number(holtForecast.toFixed(3)),
        polynomialRegressionNdvi: Number(polyForecast.toFixed(3)),
        forecastNdvi: ensembleNdvi,
        confidenceLower,
        confidenceUpper,
        expectedForageCondition: this.getConditionLabel(predictedFci),
        predictedRiskScore,
        predictedRiskLevel: this.riskLevel(predictedRiskScore),
      };
    });

    const delta30 = forecastMap[30].forecastNdvi - baseNdvi;
    let trend: DistrictForecast['trend'] = 'Stable';
    if (delta30 < -0.06) trend = 'Rapid Decline';
    else if (delta30 < -0.02) trend = 'Moderate Decline';
    else if (delta30 > 0.02) trend = 'Improving';

    const result: DistrictForecast = {
      districtId: config.id,
      districtName: config.name,
      currentNdvi: baseNdvi,
      trend,
      forecasts: forecastMap,
      modelMeta: {
        method: 'Ensemble(MA + Holt + Quadratic)',
        historyPoints: values.length,
        residualStd: Number(residualStd.toFixed(4)),
        fittedOn: series[series.length - 1]?.date || new Date().toISOString().split('T')[0],
      },
    };

    appCache.set(cacheKey, result, 90_000);
    return result;
  }

  private movingAverage(values: number[], window: number): number {
    const slice = values.slice(-window);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private fitHolt(values: number[], alpha: number, beta: number): { level: number; trend: number } {
    let level = values[0];
    let trend = values.length > 1 ? values[1] - values[0] : 0;
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }
    return { level, trend };
  }

  /** Least-squares fit for y = a x^2 + b x + c */
  private fitQuadratic(values: number[]): { a: number; b: number; c: number } {
    const n = values.length;
    let sX = 0,
      sX2 = 0,
      sX3 = 0,
      sX4 = 0,
      sY = 0,
      sXY = 0,
      sX2Y = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = values[i];
      const x2 = x * x;
      sX += x;
      sX2 += x2;
      sX3 += x2 * x;
      sX4 += x2 * x2;
      sY += y;
      sXY += x * y;
      sX2Y += x2 * y;
    }

    // Solve 3x3 normal equations via Cramer's rule
    const det =
      n * (sX2 * sX4 - sX3 * sX3) - sX * (sX * sX4 - sX3 * sX2) + sX2 * (sX * sX3 - sX2 * sX2);

    if (Math.abs(det) < 1e-9) {
      return { a: 0, b: 0, c: values[values.length - 1] };
    }

    const detC =
      sY * (sX2 * sX4 - sX3 * sX3) - sX * (sXY * sX4 - sX3 * sX2Y) + sX2 * (sXY * sX3 - sX2 * sX2Y);
    const detB =
      n * (sXY * sX4 - sX2Y * sX3) - sY * (sX * sX4 - sX2 * sX3) + sX2 * (sX * sX2Y - sXY * sX2);
    const detA =
      n * (sX2 * sX2Y - sX3 * sXY) - sX * (sX * sX2Y - sX3 * sY) + sY * (sX * sX3 - sX2 * sX2);

    return { a: detA / det, b: detB / det, c: detC / det };
  }

  private residualStd(values: number[], predict: (i: number) => number): number {
    if (values.length < 3) return 0.02;
    const residuals = values.map((y, i) => y - predict(i));
    const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const variance = residuals.reduce((a, r) => a + (r - mean) ** 2, 0) / residuals.length;
    return Math.sqrt(variance);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private riskLevel(score: number): RiskLevel {
    if (score >= 65) return 'Critical';
    if (score >= 38) return 'Warning';
    return 'Healthy';
  }

  private getConditionLabel(fci: number): string {
    if (fci >= 65) return 'Optimal Pasture & Good Canopy';
    if (fci >= 45) return 'Moderate Forage - Monitored Grazing';
    if (fci >= 28) return 'Depleted Pasture & Water Stress';
    return 'Severe Pasture Degradation / Complete Deficit';
  }
}
