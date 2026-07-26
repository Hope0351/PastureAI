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

  public async generateDistrictAnalysis(
    districtId: string,
    timelineDays: number = 30,
    lang: 'en' | 'am' = 'en'
  ): Promise<AiRecommendation> {
    const cacheKey = `ai:${districtId}:${timelineDays}:${lang}:v4-am-reports`;
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
        interventionImpact,
        lang
      );
      // Gemini often ignores language instructions — require Ethiopic for Amharic reports
      if (result && lang === 'am' && !this.isEthiopicText(result.summary)) {
        result = null;
      }
    }

    if (!result) {
      result = this.getFallbackRecommendation(structuredPayload, interventionImpact, lang);
      this.lastGenerator = 'rules-engine';
    }

    // Always localize nested impact summary for the report language
    result.interventionImpact = this.localizeImpact(interventionImpact, lang);
    result.livestockSavedPrediction = this.buildLivestockSavedNarrative(
      result.interventionImpact,
      lang
    );

    appCache.set(cacheKey, result, 180_000);
    return result;
  }

  private isEthiopicText(text: string): boolean {
    if (!text) return false;
    let ethiopic = 0;
    for (const ch of text) {
      const cp = ch.codePointAt(0) || 0;
      if (cp >= 0x1200 && cp <= 0x137f) ethiopic += 1;
    }
    return ethiopic >= 12;
  }

  private localizeTrend(trend: string, lang: 'en' | 'am'): string {
    if (lang !== 'am') return trend;
    const map: Record<string, string> = {
      'Rapid Decline': 'ፈጣን ማሽቆልቆል',
      'Moderate Decline': 'መካከለኛ ማሽቆልቆል',
      Stable: 'የተረጋጋ',
      Improving: 'እየተሻሻለ',
    };
    return map[trend] || trend;
  }

  private localizeImpact(
    impact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>,
    lang: 'en' | 'am'
  ) {
    if (lang !== 'am') return impact;
    const best = impact.scenarios.find((s) => s.actionByDay === impact.bestActionByDay)!;
    const s15 = impact.scenarios.find((s) => s.actionByDay === 15)!;
    const s60 = impact.scenarios.find((s) => s.actionByDay === 60)!;
    const extra = Math.max(0, s15.animalsSavedIfActionTaken - s60.animalsSavedIfActionTaken);
    const summary =
      best.animalsSavedIfActionTaken > 0
        ? `ወሳኝ መኖ እርምጃ በቀን ${best.actionByDay} ~${best.animalsSavedIfActionTaken.toLocaleString()} ጭንቅላት ሊያድን ይችላል። በቀን 15 ከቀን 60 ይልቅ ማድረግ ~${extra.toLocaleString()} ተጨማሪ እንስሳትን ይጠብቃል።`
        : `የተተነበየ የሳር ጭንቀት አንስተኛ ነው፤ ወሳኝ መኖ እርምጃ አንስተኛ የከብቶች ማድን ያመጣል።`;
    return { ...impact, summary };
  }

  private async callGemini(
    apiKey: string,
    districtName: string,
    validTimeline: number,
    structuredPayload: any,
    districtId: string,
    interventionImpact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>,
    lang: 'en' | 'am'
  ): Promise<AiRecommendation | null> {
    // Prefer currently available flash models; older IDs 404 for new API keys.
    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
    const languageRule =
      lang === 'am'
        ? 'Write ALL narrative fields (summary, reason, recommendedAction, distributionStrategy, plainLanguageExplanation, livestockSavedPrediction, confidence) in Amharic (Ethiopic script አማርኛ). Keep priority as one of: Critical, Warning, Low. Keep numbers, district names, depot names, NDVI, TLU, USD, and technical acronyms as-is.'
        : 'Write all narrative fields in clear English.';

    for (const model of models) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'mesk' } },
        });

        const prompt = `You are an expert GIS, remote sensing, and rangeland management advisor specializing in pastoral forage prediction and emergency feed logistics.

Analyze the following scientifically computed rangeland data for ${districtName} over a ${validTimeline}-day projection timeline:
${JSON.stringify(structuredPayload, null, 2)}

Use the interventionImpact.scenarios numbers EXACTLY (do not invent different headcounts). Compare livestock saved if decisive feed action is taken by day 15, 30, 45, and 60.
In livestockSavedPrediction, state clearly how many animals are saved at each horizon and why earlier action saves more.
Provide an executive decision brief formatted according to the exact JSON schema.
${languageRule}
Keep language clear, objective, and concise for non-technical operators.`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an AI decision support assistant for pastoral forage and feed logistics. Explain satellite NDVI, weather trends, livestock savings by action timing, and route logistics in plain language. Never invent livestock-saved numbers that contradict interventionImpact.scenarios. Follow the requested output language exactly.',
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
          confidence: ['High', 'Medium', 'Low'].includes(parsed.confidence)
            ? parsed.confidence
            : 'High',
          plainLanguageExplanation: parsed.plainLanguageExplanation,
          livestockSavedPrediction:
            parsed.livestockSavedPrediction ||
            this.buildLivestockSavedNarrative(interventionImpact, lang),
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
    interventionImpact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>,
    lang: 'en' | 'am' = 'en'
  ): AiRecommendation {
    const isCritical = data.scientificRiskScore >= 65;
    const isWarning = data.scientificRiskScore >= 38;
    const priority = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Low';
    const active =
      interventionImpact.scenarios.find((s) => s.actionByDay === data.timelineDays) ||
      interventionImpact.scenarios.find((s) => s.actionByDay === 30)!;
    const best = interventionImpact.scenarios.find(
      (s) => s.actionByDay === interventionImpact.bestActionByDay
    )!;
    const localizedImpact = this.localizeImpact(interventionImpact, lang);
    const trend = this.localizeTrend(String(data.trend || 'Stable'), lang);

    if (lang === 'am') {
      const condition = isCritical
        ? 'ከባድ የሳር እጥረት'
        : isWarning
          ? 'መካከለኛ የሳር ጭንቀት'
          : 'የተረጋጋ የሳር መሬት ሁኔታ';
      return {
        districtId: data.districtId,
        districtName: data.districtName,
        timelineDays: data.timelineDays,
        priority,
        summary: `${data.districtName} በሚቀጥሉት ${data.timelineDays} ቀናት ${condition} እንደሚያጋጥመው ይተነብያል። በቀን ${interventionImpact.bestActionByDay} ወሳኝ እርምጃ ከተወሰደ ~${best.animalsSavedIfActionTaken.toLocaleString()} ጭንቅላት ሊድን ይችላል።`,
        reason: `የሳተላይት ምልከታ አሁን NDVI ${data.currentNdvi} ያሳያል፣ የ${data.timelineDays}-ቀን ትንበያ NDVI ደግሞ ${data.forecastNdvi} (${trend}) ነው። የ7-ቀን ዝናብ ${data.weather.rainfall7DaySum}mm ነው። የከብቶች ጥግግት (${data.livestock.densityTLUPerKm2} TLU/km²) የግጦሽ ጫናን ያጎላል።`,
        recommendedAction: isCritical
          ? `ከ ${data.logisticsRoute.assignedDepot} ተጨማሪ መኖን በ${data.feedRequirement.urgencyDays} ቀናት ውስጥ ያንቀሳቅሱ። በቀን 15 ማድረግ ከቀን 60 መጠበቅ ይልቅ የሚድኑ ከብቶችን ያበዛል።`
          : `የሳተላይት ስብስቦችን እና የውሃ ነጥቦችን ይከታተሉ፤ NDVI ማሽቆልቆሉን ከቀጠለ መኖን ቅድመ አቀማመጥ ያድርጉ።`,
        distributionStrategy: `ከ ${data.logisticsRoute.assignedDepot} ${data.feedRequirement.feedNeededTons} ሜትሪክ ቶን በ ${data.logisticsRoute.assignedTruckType} በ ${data.logisticsRoute.distanceKm}km መንገድ (${data.logisticsRoute.algorithm || 'CVRP'}) ያሰራጩ።`,
        confidence: 'High',
        plainLanguageExplanation: `የ${data.districtName} ሳር በጭንቀት ላይ ነው። ያለ መኖ እርዳታ በቀን ${active.actionByDay} ወደ ${active.projectedMortalityWithoutAction.toLocaleString()} እንስሳት ሊሞቱ ይችላሉ። በዚያ ቀን ወሳኝ እርምጃ ወደ ${active.animalsSavedIfActionTaken.toLocaleString()} ጭንቅላት ሊያድን ይችላል።`,
        livestockSavedPrediction: this.buildLivestockSavedNarrative(localizedImpact, 'am'),
        interventionImpact: localizedImpact,
        generatedAt: new Date().toISOString(),
        generatedBy: 'rules-engine',
      };
    }

    return {
      districtId: data.districtId,
      districtName: data.districtName,
      timelineDays: data.timelineDays,
      priority,
      summary: `${data.districtName} is predicted to experience ${
        isCritical ? 'acute forage deficits' : isWarning ? 'moderate pasture stress' : 'stable rangeland conditions'
      } over the next ${data.timelineDays} days. Decisive action by day ${interventionImpact.bestActionByDay} could save ~${best.animalsSavedIfActionTaken.toLocaleString()} head.`,
      reason: `Satellite observation shows current NDVI at ${data.currentNdvi} with a ${data.timelineDays}-day forecast NDVI of ${data.forecastNdvi} (${data.trend}). 7-day rainfall is ${data.weather.rainfall7DaySum}mm. Livestock density (${data.livestock.densityTLUPerKm2} TLU/km²) elevates grazing pressure.`,
      recommendedAction: isCritical
        ? `Mobilize supplementary feed from ${data.logisticsRoute.assignedDepot} within ${data.feedRequirement.urgencyDays} days. Acting by day 15 maximizes livestock saved versus waiting until day 60.`
        : `Monitor satellite composites and water points; pre-position feed if NDVI continues to decline.`,
      distributionStrategy: `Dispatch ${data.feedRequirement.feedNeededTons} metric tons from ${data.logisticsRoute.assignedDepot} using ${data.logisticsRoute.assignedTruckType} across a ${data.logisticsRoute.distanceKm}km corridor (${data.logisticsRoute.algorithm || 'CVRP'}).`,
      confidence: 'High',
      plainLanguageExplanation: `${data.districtName} pasture is under stress. Without feed aid, about ${active.projectedMortalityWithoutAction.toLocaleString()} animals could die by day ${active.actionByDay}. Decisive action by that day could save about ${active.animalsSavedIfActionTaken.toLocaleString()} head.`,
      livestockSavedPrediction: this.buildLivestockSavedNarrative(localizedImpact, 'en'),
      interventionImpact: localizedImpact,
      generatedAt: new Date().toISOString(),
      generatedBy: 'rules-engine',
    };
  }

  private buildLivestockSavedNarrative(
    impact: Awaited<ReturnType<FeedEstimatorService['estimateInterventionImpact']>>,
    lang: 'en' | 'am' = 'en'
  ): string {
    if (lang === 'am') {
      const lines = impact.scenarios.map(
        (s) =>
          `በቀን ${s.actionByDay}፡ መኖ እርምጃ ከተጠናቀቀ ~${s.animalsSavedIfActionTaken.toLocaleString()} ጭንቅላት ያድኑ (${s.saveRatePercent}% የተጠበቀ ሞት፤ ~$${s.economicLossAvoidedUSD.toLocaleString()} USD ይከላከሉ)።`
      );
      return `${impact.summary} ${lines.join(' ')}`;
    }
    const lines = impact.scenarios.map(
      (s) =>
        `By day ${s.actionByDay}: save ~${s.animalsSavedIfActionTaken.toLocaleString()} head (${s.saveRatePercent}% of projected mortality; avoid ~$${s.economicLossAvoidedUSD.toLocaleString()} USD) if feed action is completed.`
    );
    return `${impact.summary} ${lines.join(' ')}`;
  }

}
