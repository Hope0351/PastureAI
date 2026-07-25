import { FeedRequirement, InterventionImpact, InterventionScenario, RiskLevel } from '../../src/types';
import { FEED_DEPOTS } from '../config/districtsData';
import { DataProcessorService } from './dataProcessor';
import { ForecastingService } from './forecasting';

/** Share of projected mortality averted if decisive feed action completes by this horizon */
const ACTION_SAVE_RATE: Record<15 | 30 | 45 | 60, number> = {
  15: 0.88,
  30: 0.74,
  45: 0.55,
  60: 0.38,
};

/**
 * Livestock Feed Requirement & Economic Deficit Estimator
 * Calculates supplementary feed needed (metric tons), animals at risk, priority score, and financial loss
 */
export class FeedEstimatorService {
  private static instance: FeedEstimatorService;
  private dataProcessor: DataProcessorService;
  private forecastingService: ForecastingService;

  private constructor() {
    this.dataProcessor = DataProcessorService.getInstance();
    this.forecastingService = ForecastingService.getInstance();
  }

  public static getInstance(): FeedEstimatorService {
    if (!FeedEstimatorService.instance) {
      FeedEstimatorService.instance = new FeedEstimatorService();
    }
    return FeedEstimatorService.instance;
  }

  /**
   * Estimates feed requirements for a district given a target timeline (0, 15, 30, 45, 60 days)
   */
  public async estimateFeedRequirement(districtId: string, timelineDays: number = 30): Promise<FeedRequirement> {
    const districtData = await this.dataProcessor.processDistrict(districtId);
    const forecast = await this.forecastingService.forecastDistrict(districtId);

    const validTimeline = [0, 15, 30, 45, 60].includes(timelineDays) ? timelineDays : 30;
    const forecastPoint = forecast.forecasts[validTimeline] || forecast.forecasts[30];
    const computed = this.computeRiskMetrics(districtData, forecastPoint, validTimeline);

    const assignedDepot = this.findNearestDepot(districtData.latitude, districtData.longitude);

    let urgencyDays = 14;
    if (computed.priorityScore >= 80) urgencyDays = 5;
    else if (computed.priorityScore >= 60) urgencyDays = 9;

    return {
      districtId: districtData.id,
      districtName: districtData.name,
      timelineDays: validTimeline,
      feedNeededTons: computed.feedNeededTons,
      animalsAtRisk: computed.animalsAtRisk,
      priorityScore: computed.priorityScore,
      estimatedEconomicLossUSD: computed.estimatedLossUSD,
      estimatedEconomicLossETB: computed.estimatedLossETB,
      assignedDepotId: assignedDepot.id,
      assignedDepotName: assignedDepot.name,
      urgencyDays,
    };
  }

  /**
   * Compare livestock saved if decisive feed intervention is taken by +15 / +30 / +45 / +60 days.
   * Uses the same NDVI/risk/feed model as the live site estimates.
   */
  public async estimateInterventionImpact(districtId: string): Promise<InterventionImpact> {
    const districtData = await this.dataProcessor.processDistrict(districtId);
    const forecast = await this.forecastingService.forecastDistrict(districtId);
    const horizons: Array<15 | 30 | 45 | 60> = [15, 30, 45, 60];

    const scenarios: InterventionScenario[] = horizons.map((actionByDay) => {
      const point = forecast.forecasts[actionByDay] || forecast.forecasts[30];
      const metrics = this.computeRiskMetrics(districtData, point, actionByDay);
      const saveRate = ACTION_SAVE_RATE[actionByDay];
      const animalsSavedIfActionTaken = Math.round(metrics.projectedMortality * saveRate);
      const economicLossAvoidedUSD = Math.round(animalsSavedIfActionTaken * 220);

      return {
        actionByDay,
        animalsAtRisk: metrics.animalsAtRisk,
        projectedMortalityWithoutAction: metrics.projectedMortality,
        animalsSavedIfActionTaken,
        saveRatePercent: Math.round(saveRate * 100),
        economicLossAvoidedUSD,
        feedNeededTons: metrics.feedNeededTons,
        predictedRiskScore: point.predictedRiskScore,
        predictedRiskLevel: point.predictedRiskLevel as RiskLevel,
        forecastNdvi: point.forecastNdvi,
      };
    });

    const best = [...scenarios].sort(
      (a, b) => b.animalsSavedIfActionTaken - a.animalsSavedIfActionTaken
    )[0];

    const s15 = scenarios.find((s) => s.actionByDay === 15)!;
    const s60 = scenarios.find((s) => s.actionByDay === 60)!;
    const extraSavedByActingEarly = Math.max(0, s15.animalsSavedIfActionTaken - s60.animalsSavedIfActionTaken);

    const summary =
      best.animalsSavedIfActionTaken > 0
        ? `Decisive feed action by day ${best.actionByDay} could save ~${best.animalsSavedIfActionTaken.toLocaleString()} head ` +
          `(vs doing nothing). Acting by day 15 instead of day 60 protects ~${extraSavedByActingEarly.toLocaleString()} additional animals.`
        : `Projected forage stress is limited; decisive feed action yields little incremental livestock savings over this horizon.`;

    return {
      districtId: districtData.id,
      districtName: districtData.name,
      trend: forecast.trend,
      currentNdvi: districtData.currentNdvi,
      bestActionByDay: best.actionByDay,
      scenarios,
      summary,
    };
  }

  /**
   * Estimates feed requirement for all districts
   */
  public async estimateAllFeedRequirements(timelineDays: number = 30): Promise<FeedRequirement[]> {
    const districts = await this.dataProcessor.processAllDistricts();
    const promises = districts.map((d) => this.estimateFeedRequirement(d.id, timelineDays));
    return Promise.all(promises);
  }

  private computeRiskMetrics(
    districtData: Awaited<ReturnType<DataProcessorService['processDistrict']>>,
    forecastPoint: { predictedRiskScore: number },
    timelineDays: number
  ) {
    const totalTLU = districtData.livestock.totalTLU;
    const deficitIntensity = Math.max(0, (forecastPoint.predictedRiskScore - 25) / 75.0);
    const atRiskTLU = totalTLU * deficitIntensity * 0.055;
    const feedNeededTons = Math.round((atRiskTLU * 2.5 * Math.max(1, timelineDays)) / 1000);

    const herdHead =
      districtData.livestock.cattle +
      districtData.livestock.camels +
      districtData.livestock.goats +
      districtData.livestock.sheep;

    const animalsAtRisk = Math.round(herdHead * deficitIntensity * 0.42);
    const priorityScore = Math.min(
      100,
      Math.round(forecastPoint.predictedRiskScore * 0.65 + Math.min(35, (feedNeededTons / 50) * 3.5))
    );

    // Mortality without intervention rises with deficit and longer exposure windows
    const timeStress = 0.7 + Math.min(0.55, timelineDays / 110);
    const projectedMortality = Math.round(animalsAtRisk * 0.12 * Math.max(0.15, deficitIntensity) * timeStress);
    const estimatedLossUSD = Math.round(projectedMortality * 220);
    const estimatedLossETB = Math.round(estimatedLossUSD * 125.0);

    return {
      deficitIntensity,
      feedNeededTons,
      animalsAtRisk,
      priorityScore,
      projectedMortality,
      estimatedLossUSD,
      estimatedLossETB,
    };
  }

  private findNearestDepot(districtLat: number, districtLng: number) {
    let nearest = FEED_DEPOTS[0];
    let minDistance = Infinity;

    FEED_DEPOTS.forEach((depot) => {
      const dLat = (depot.latitude - districtLat) * 111; // Approx km per degree
      const dLng = (depot.longitude - districtLng) * 111 * Math.cos((districtLat * Math.PI) / 180);
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = depot;
      }
    });

    return nearest;
  }
}
