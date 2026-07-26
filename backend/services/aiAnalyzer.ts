import { GoogleGenAI, Type } from '@google/genai';
import { AiRecommendation } from '../../src/types';
import { DataProcessorService } from './dataProcessor';
import { FeedEstimatorService } from './feedEstimator';
import { ForecastingService } from './forecasting';
import { RouteOptimizerService } from './routeOptimizer';
import { appCache } from './cache';

/**
 * Gemini AI Executive Brief & Recommendation Engine
 * Falls back to a deterministic rules engine when Gemini is unavailable.
 */
export class AiAnalyzerService {
  private static instance: AiAnalyzerService;
  private dataProcessor: DataProcessorService;
  private forecastingService: ForecastingService;
  private feedEstimator: FeedEstimatorService;
  private routeOptimizer: RouteOptimizerService;
  public lastGenerator: 'gemini' | 'rules-engine' = 'rules-engine';

  private constructor() {
    this.dataProcessor = DataProcessorService.getInstance();
    this.forecastingService = ForecastingService.getInstance();
    this.feedEstimator = FeedEstimatorService.getInstance();
    this.routeOptimizer = RouteOptimizerService.getInstance();
  }

  public static getInstance(): AiAnalyzerService {
    if (!AiAnalyzerService.instance) {
      AiAnalyzerService.instance = new AiAnalyzerService();
    }
    return AiAnalyzerService.instance;
  }

  public async generateDistrictAnalysis(districtId: string, timelineDays: number = 30): Promise<AiRecommendation> {
    const cacheKey = `ai:${districtId}:${timelineDays}:v2-impact`;
    const cached = appCache.get<AiRecommendation>(cacheKey);
    if (cached) return cached;

    const districtData = await this.dataProcessor.processDistrict(districtId);
    const forecast = await this.forecastingService.forecastDistrict(districtId);
    const feedReq = await this.feedEstimator.estimateFeedRequirement(districtId, timelineDays);
    const route = await this.routeOptimizer.optimizeDistrictRoute(districtId, timelineDays);
    const interventionImpact = await this.feedEstimator.estimateInterventionImpact(districtId);

    const validTimeline = [0, 15, 30, 45, 60].includes(timelineDays) ? timelineDays : 30;
    const forecastPoint = forecast.forecasts[validTimeline] || forecast.forecasts[30];

    const structuredPayload = {
      districtId: districtData.id,
      districtName: districtData.name,
      region: districtData.region,
      timelineDays: validTimeline,
      currentNdvi: districtData.currentNdvi,
      forecastNdvi: forecastPoint.forecastNdvi,
      trend: forecast.trend,
      weather: {
        temp: districtData.weather.currentTemp,
        rainfallToday: districtData.weather.rainfallToday,
        rainfall7DaySum: districtData.weather.rainfall7DaySum,
        droughtSeverityIndex: districtData.weather.droughtSeverityIndex,
        condition: districtData.weather.weatherCondition,
        dataSource: districtData.weather.dataSource,
      },
      livestock: {
        cattle: districtData.livestock.cattle,
        camels: districtData.livestock.camels,
        goatsAndSheep: districtData.livestock.goats + districtData.livestock.sheep,
        totalTLU: districtData.livestock.totalTLU,
        densityTLUPerKm2: districtData.livestock.densityTLUPerKm2,
      },
      scientificRiskScore: districtData.riskScore,
      riskLevel: districtData.riskLevel,
      feedRequirement: {
        feedNeededTons: feedReq.feedNeededTons,
        animalsAtRisk: feedReq.animalsAtRisk,
        priorityScore: feedReq.priorityScore,
        urgencyDays: feedReq.urgencyDays,
        estimatedLossUSD: feedReq.estimatedEconomicLossUSD,
      },
      logisticsRoute: {
        assignedDepot: route.depotName,
        assignedTruckType: route.assignedTruckType,
        distanceKm: route.distanceKm,
        travelTimeHours: route.estimatedTimeHours,
        feasible: route.feasible,
        algorithm: route.algorithm,
      },
      interventionImpact: {
        summary: interventionImpact.summary,
        bestActionByDay: interventionImpact.bestActionByDay,
        scenarios: interventionImpact.scenarios.map((s) => ({
          actionByDay: s.actionByDay,
          animalsAtRisk: s.animalsAtRisk,
          projectedMortalityWithoutAction: s.projectedMortalityWithoutAction,
          animalsSavedIfActionTaken: s.animalsSavedIfActionTaken,
          saveRatePercent: s.saveRatePercent,
          economicLossAvoidedUSD: s.economicLossAvoidedUSD,
          feedNeededTons: s.feedNeededTons,
          predictedRiskScore: s.predictedRiskScore,
          forecastNdvi: s.forecastNdvi,
        })),
      },
    };

    const apiKey = process.env.GEMINI_API_KEY;
    let result: AiRecommendation | null = null;

    if (apiKey) {
      result = await this.callGemini(
        apiKey,
        districtData.name,
        validTimeline,
        structuredPayload,
        districtData.id,
        interventionImpact
      );
    }

    if (!result) {
      result = this.getFallbackRecommendation(structuredPayload, interventionImpact);
      this.lastGenerator = 'rules-engine';
    }

    appCache.set(cacheKey, result, 180_000);
    return result;
  }

  private async callGemini(
    apiKey: string,
    districtName: string,
    validTimeline: number,
    structuredPayload: any,
    districtId: string,
    interventionImpact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>
  ): Promise<AiRecommendation | null> {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.6-flash'];

    for (const model of models) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'mesek-ai' } },
        });

        const prompt = `You are an expert GIS, remote sensing, and rangeland management advisor specializing in pastoral forage prediction and emergency feed logistics.

Analyze the following scientifically computed rangeland data for ${districtName} over a ${validTimeline}-day projection timeline:
${JSON.stringify(structuredPayload, null, 2)}

Use the interventionImpact.scenarios numbers EXACTLY (do not invent different headcounts). Compare livestock saved if decisive feed action is taken by day 15, 30, 45, and 60.
In livestockSavedPrediction, state clearly how many animals are saved at each horizon and why earlier action saves more.
Provide an executive decision brief formatted according to the exact JSON schema.
Keep language clear, objective, and concise for non-technical operators.`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an AI decision support assistant for pastoral forage and feed logistics. Explain satellite NDVI, weather trends, livestock savings by action timing, and route logistics in plain language. Never invent livestock-saved numbers that contradict interventionImpact.scenarios.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.STRING },
                summary: { type: Type.STRING },
                reason: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                distributionStrategy: { type: Type.STRING },
                confidence: { type: Type.STRING },
                plainLanguageExplanation: { type: Type.STRING },
                livestockSavedPrediction: { type: Type.STRING },
              },
              required: [
                'priority',
                'summary',
                'reason',
                'recommendedAction',
                'distributionStrategy',
                'confidence',
                'plainLanguageExplanation',
                'livestockSavedPrediction',
              ],
            },
          },
        });

        const jsonText = response.text?.trim() || '';
        const parsed = JSON.parse(jsonText);
        this.lastGenerator = 'gemini';

        return {
          districtId,
          districtName,
          timelineDays: validTimeline,
          priority: parsed.priority || structuredPayload.riskLevel,
          summary: parsed.summary,
          reason: parsed.reason,
          recommendedAction: parsed.recommendedAction,
          distributionStrategy: parsed.distributionStrategy,
          confidence: parsed.confidence || 'High',
          plainLanguageExplanation: parsed.plainLanguageExplanation,
          livestockSavedPrediction:
            parsed.livestockSavedPrediction || this.buildLivestockSavedNarrative(interventionImpact),
          interventionImpact,
          generatedAt: new Date().toISOString(),
          generatedBy: 'gemini',
        };
      } catch (err) {
        console.warn(`Gemini model ${model} failed, trying next…`, err);
      }
    }

    return null;
  }

  private getFallbackRecommendation(
    data: any,
    interventionImpact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>
  ): AiRecommendation {
    const isCritical = data.scientificRiskScore >= 65;
    const isWarning = data.scientificRiskScore >= 38;
    const priority = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Low';
    const active =
      interventionImpact.scenarios.find((s) => s.actionByDay === data.timelineDays) ||
      interventionImpact.scenarios.find((s) => s.actionByDay === 30)!;

    return {
      districtId: data.districtId,
      districtName: data.districtName,
      timelineDays: data.timelineDays,
      priority,
      summary: `${data.districtName} is predicted to experience ${
        isCritical ? 'acute forage deficits' : isWarning ? 'moderate pasture stress' : 'stable rangeland conditions'
      } over the next ${data.timelineDays} days. Decisive action by day ${interventionImpact.bestActionByDay} could save ~${
        interventionImpact.scenarios.find((s) => s.actionByDay === interventionImpact.bestActionByDay)!
          .animalsSavedIfActionTaken.toLocaleString()
      } head.`,
      reason: `Satellite observation shows current NDVI at ${data.currentNdvi} with a ${data.timelineDays}-day forecast NDVI of ${data.forecastNdvi} (${data.trend}). 7-day rainfall is ${data.weather.rainfall7DaySum}mm. Livestock density (${data.livestock.densityTLUPerKm2} TLU/km²) elevates grazing pressure.`,
      recommendedAction: isCritical
        ? `Mobilize supplementary feed from ${data.logisticsRoute.assignedDepot} within ${data.feedRequirement.urgencyDays} days. Acting by day 15 maximizes livestock saved versus waiting until day 60.`
        : `Monitor satellite composites and water points; pre-position feed if NDVI continues to decline.`,
      distributionStrategy: `Dispatch ${data.feedRequirement.feedNeededTons} metric tons from ${data.logisticsRoute.assignedDepot} using ${data.logisticsRoute.assignedTruckType} across a ${data.logisticsRoute.distanceKm}km corridor (${data.logisticsRoute.algorithm || 'CVRP'}).`,
      confidence: 'High',
      plainLanguageExplanation: `${data.districtName} pasture is under stress. Without feed aid, about ${active.projectedMortalityWithoutAction.toLocaleString()} animals could die by day ${active.actionByDay}. Decisive action by that day could save about ${active.animalsSavedIfActionTaken.toLocaleString()} head.`,
      livestockSavedPrediction: this.buildLivestockSavedNarrative(interventionImpact),
      interventionImpact,
      generatedAt: new Date().toISOString(),
      generatedBy: 'rules-engine',
    };
  }

  private buildLivestockSavedNarrative(
    impact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>
  ): string {
    const lines = impact.scenarios.map(
      (s) =>
        `By day ${s.actionByDay}: save ~${s.animalsSavedIfActionTaken.toLocaleString()} head (${s.saveRatePercent}% of projected mortality; avoid ~$${s.economicLossAvoidedUSD.toLocaleString()} USD) if feed action is completed.`
    );
    return `${impact.summary} ${lines.join(' ')}`;
  }
}
