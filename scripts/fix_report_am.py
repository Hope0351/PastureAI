# -*- coding: utf-8 -*-
"""Patch am.ts keys + rewrite aiAnalyzer Amharic report generation for full Ethiopic output."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def u(s: str) -> str:
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)


# --- patch am.ts ---
am_path = ROOT / "src" / "i18n" / "am.ts"
am = am_path.read_text(encoding="utf-8")

# Fix risk block to include trends
am = re.sub(
    r"  risk: \{[\s\S]*?\n  \},",
    u(
        "  risk: {\n"
        "    Critical: '\\u12a0\\u1233\\u1233\\u1262',\n"
        "    Warning: '\\u121b\\u1235\\u1320\\u1295\\u1240\\u1242\\u12eb',\n"
        "    Healthy: '\\u1324\\u1293\\u121b',\n"
        "    Low: '\\u12dd\\u1245\\u1270\\u129b',\n"
        "    Stable: '\\u12e8\\u1270\\u1228\\u130b\\u130b',\n"
        "    'Rapid Decline': '\\u1348\\u1323\\u1295 \\u121b\\u123d\\u1246\\u120d\\u1246\\u120d',\n"
        "    'Moderate Decline': '\\u1218\\u12ab\\u12a8\\u1208\\u129b \\u121b\\u123d\\u1246\\u120d\\u1246\\u120d',\n"
        "    Improving: '\\u12a5\\u12e8\\u121b\\u123d\\u122b\\u120d'\n"
        "  },"
    ),
    am,
    count=1,
)

# Patch brief section keys for report chrome + narrative
if "reportId:" not in am:
    am = am.replace(
        u("    priorityLabel: '{level} \\u1245\\u12f5\\u121a\\u12eb'"),
        u(
            "    priorityLabel: '{level}',\n"
            "    reportId: '\\u1218\\u1208\\u12eb: {id}',\n"
            "    narrativeIntro: '{summary}',\n"
            "    narrativeByDay: '\\u1260\\u1240\\u1295 {day}\\u1361 \\u1218\\u1296 \\u12a5\\u122d\\u121d\\u1333 \\u12a8\\u1270\\u1320\\u1293\\u1240\\u1240 ~{saved} \\u132d\\u1295\\u1245\\u120b\\u1275 \\u12eb\\u12f5\\u1291 ({pct}% \\u12e8\\u1270\\u1320\\u1260\\u1240 \\u121e\\u1275\\u1364 ~${usd} USD \\u12ed\\u12a8\\u120b\\u12a8\\u1209)\\u1362'"
        ),
    )
else:
    # ensure narrative keys exist
    if "narrativeByDay:" not in am:
        am = am.replace(
            "    reportId:",
            u(
                "    narrativeIntro: '{summary}',\n"
                "    narrativeByDay: '\\u1260\\u1240\\u1295 {day}\\u1361 \\u1218\\u1296 \\u12a5\\u122d\\u121d\\u1333 \\u12a8\\u1270\\u1320\\u1293\\u1240\\u1240 ~{saved} \\u132d\\u1295\\u1245\\u120b\\u1275 \\u12eb\\u12f5\\u1291 ({pct}% \\u12e8\\u1270\\u1320\\u1260\\u1240 \\u121e\\u1275\\u1364 ~${usd} USD \\u12ed\\u12a8\\u120b\\u12a8\\u1209)\\u1362',\n"
                "    reportId:"
            ),
        )

# Fix known typos
am = am.replace("እደገና", "እንደገና")
am = am.replace("በመሰባሳ ላይ", "በማመቻቸት ላይ")
am = am.replace("የተፍጠር", "የተ�ቻቸት ላይ")
am = am.replace("የተፍጠር", "የተፈጠረ")
am = am.replace("እርምጳ", "እርምጃ")

am_path.write_text(am, encoding="utf-8")
print("patched am.ts")

# --- rewrite aiAnalyzer Amharic helpers via full method replacement ---
ai_path = ROOT / "backend" / "services" / "aiAnalyzer.ts"
ai = ai_path.read_text(encoding="utf-8")

# bump cache key
ai = ai.replace("v3-i18n", "v4-am-reports")

# After Gemini call, validate Ethiopic for am
old_flow = """    if (apiKey) {
      result = await this.callGemini(
        apiKey,
        districtData.name,
        validTimeline,
        structuredPayload,
        districtData.id,
        interventionImpact,
        lang
      );
    }

    if (!result) {
      result = this.getFallbackRecommendation(structuredPayload, interventionImpact, lang);
      this.lastGenerator = 'rules-engine';
    }

    appCache.set(cacheKey, result, 180_000);
    return result;
  }"""

new_flow = """    if (apiKey) {
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
      'Rapid Decline': '\\u1348\\u1323\\u1295 \\u121b\\u123d\\u1246\\u120d\\u1246\\u120d',
      'Moderate Decline': '\\u1218\\u12ab\\u12a8\\u1208\\u129b \\u121b\\u123d\\u1246\\u120d\\u1246\\u120d',
      Stable: '\\u12e8\\u1270\\u1228\\u130b\\u130b',
      Improving: '\\u12a5\\u12e8\\u121b\\u123d\\u122b\\u120d',
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
        ? `\\u12c8\\u1233\\u129d \\u1218\\u1296 \\u12a5\\u122d\\u121d\\u1333 \\u1260\\u1240\\u1295 ${best.actionByDay} ~${best.animalsSavedIfActionTaken.toLocaleString()} \\u132d\\u1295\\u1245\\u120b\\u1275 \\u120a\\u12eb\\u12f5\\u1295 \\u12ed\\u127d\\u120b\\u120d\\u1362 \\u1260\\u1240\\u1295 15 \\u12a8\\u1240\\u1295 60 \\u12ed\\u120d\\u1245 \\u121b\\u12f5\\u1228\\u130d ~${extra.toLocaleString()} \\u1270\\u1328\\u121b\\u122a \\u12a5\\u1295\\u1235\\u1233\\u1275\\u1295 \\u12ed\\u1320\\u1265\\u1243\\u120d\\u1362`
        : `\\u12e8\\u1270\\u1270\\u1290\\u1260\\u12e8 \\u12e8\\u1233\\u122d \\u132d\\u1295\\u1240\\u1275 \\u12a0\\u1295\\u1235\\u1270\\u129b \\u1290\\u12cd\\u1364 \\u12c8\\u1233\\u129d \\u1218\\u1296 \\u12a5\\u122d\\u121d\\u1333 \\u12a0\\u1295\\u1235\\u1270\\u129b \\u12e8\\u12a8\\u1265\\u1276\\u127d \\u121b\\u12f5\\u1295 \\u12eb\\u1218\\u1323\\u120d\\u1362`;
    return { ...impact, summary };
  }"""

new_flow = u(new_flow)
if old_flow not in ai:
    raise SystemExit("flow block not found")
ai = ai.replace(old_flow, new_flow)

# Replace getFallbackRecommendation Amharic branch + buildLivestockSavedNarrative entirely
start = ai.find("  private getFallbackRecommendation(")
end = ai.rfind("}")  # class closing
# Find end of class methods - from getFallback to end of buildLivestockSavedNarrative
start = ai.find("  private getFallbackRecommendation(")
# End after buildLivestockSavedNarrative closing brace before final class }
marker = "  private buildLivestockSavedNarrative("
mpos = ai.find(marker)
if start < 0 or mpos < 0:
    raise SystemExit("methods not found")
# find closing of buildLivestockSavedNarrative: last method before class end
# Take from start to end of file's last method
rest = ai[mpos:]
# closing of buildLivestockSavedNarrative is first `\n  }\n}` at end - actually `\n  }\n}\n` 
close_rel = rest.find("\n  }\n}")
if close_rel < 0:
    raise SystemExit("method end not found")
end = mpos + close_rel + len("\n  }")

methods = u(r'''  private getFallbackRecommendation(
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
        ? '\u12a8\u1263\u12f5 \u12e8\u1233\u122d \u12a5\u1325\u1228\u1275'
        : isWarning
          ? '\u1218\u12ab\u12a8\u1208\u129b \u12e8\u1233\u122d \u132d\u1295\u1240\u1275'
          : '\u12e8\u1270\u1228\u130b\u130b \u12e8\u1233\u122d \u1218\u122c\u1275 \u1201\u1294\u1273';
      return {
        districtId: data.districtId,
        districtName: data.districtName,
        timelineDays: data.timelineDays,
        priority,
        summary: `${data.districtName} \u1260\u121a\u1240\u1325\u1209\u1275 ${data.timelineDays} \u1240\u1293\u1275 ${condition} \u12a5\u1295\u12f0\u121a\u12eb\u130b\u1325\u1218\u12cd \u12ed\u1270\u1290\u1265\u12eb\u120d\u1362 \u1260\u1240\u1295 ${interventionImpact.bestActionByDay} \u12c8\u1233\u129d \u12a5\u122d\u121d\u1333 \u12a8\u1270\u12c8\u1230\u12f0 ~${best.animalsSavedIfActionTaken.toLocaleString()} \u132d\u1295\u1245\u120b\u1275 \u120a\u12f5\u1295 \u12ed\u127d\u120b\u120d\u1362`,
        reason: `\u12e8\u1233\u1270\u120b\u12ed\u1275 \u121d\u120d\u12a8\u1273 \u12a0\u1201\u1295 NDVI ${data.currentNdvi} \u12eb\u1233\u12eb\u120d\u1363 \u12e8${data.timelineDays}-\u1240\u1295 \u1275\u1295\u1260\u12eb NDVI \u12f0\u130d\u121e ${data.forecastNdvi} (${trend}) \u1290\u12cd\u1362 \u12e87-\u1240\u1295 \u12dd\u1293\u1265 ${data.weather.rainfall7DaySum}mm \u1290\u12cd\u1362 \u12e8\u12a8\u1265\u1276\u127d \u1325\u130d\u130d\u1275 (${data.livestock.densityTLUPerKm2} TLU/km\u00b2) \u12e8\u130d\u1326\u123d \u132b\u1293\u1295 \u12eb\u130e\u120b\u120d\u1362`,
        recommendedAction: isCritical
          ? `\u12a8 ${data.logisticsRoute.assignedDepot} \u1270\u1328\u121b\u122a \u1218\u1296\u1295 \u1260${data.feedRequirement.urgencyDays} \u1240\u1293\u1275 \u12cd\u1235\u1325 \u12eb\u1295\u1240\u1233\u1245\u1231\u1362 \u1260\u1240\u1295 15 \u121b\u12f5\u1228\u130d \u12a8\u1240\u1295 60 \u1218\u1320\u1260\u1245 \u12ed\u120d\u1245 \u12e8\u121a\u12f5\u1291 \u12a8\u1265\u1276\u127d\u1295 \u12eb\u1260\u12db\u120d\u1362`
          : `\u12e8\u1233\u1270\u120b\u12ed\u1275 \u1235\u1265\u1235\u1266\u127d\u1295 \u12a5\u1293 \u12e8\u12cd\u1203 \u1290\u1325\u1266\u127d\u1295 \u12ed\u12a8\u1273\u1270\u1209\u1364 NDVI \u121b\u123d\u1246\u120d\u1246\u1209\u1295 \u12a8\u1240\u1320\u1208 \u1218\u1296\u1295 \u1245\u12f5\u1218 \u12a0\u1240\u121b\u1218\u1325 \u12eb\u12f5\u122d\u1309\u1362`,
        distributionStrategy: `\u12a8 ${data.logisticsRoute.assignedDepot} ${data.feedRequirement.feedNeededTons} \u121c\u1275\u122a\u12ad \u1276\u1295 \u1260 ${data.logisticsRoute.assignedTruckType} \u1260 ${data.logisticsRoute.distanceKm}km \u1218\u1295\u1308\u12f5 (${data.logisticsRoute.algorithm || 'CVRP'}) \u12eb\u1230\u122b\u1329\u1362`,
        confidence: 'High',
        plainLanguageExplanation: `\u12e8${data.districtName} \u1233\u122d \u1260\u132d\u1295\u1240\u1275 \u120b\u12ed \u1290\u12cd\u1362 \u12eb\u1208 \u1218\u1296 \u12a5\u122d\u12f3\u1273 \u1260\u1240\u1295 ${active.actionByDay} \u12c8\u12f0 ${active.projectedMortalityWithoutAction.toLocaleString()} \u12a5\u1295\u1235\u1233\u1275 \u120a\u121e\u1271 \u12ed\u127d\u120b\u1209\u1362 \u1260\u12da\u12eb \u1240\u1295 \u12c8\u1233\u129d \u12a5\u122d\u121d\u1333 \u12c8\u12f0 ${active.animalsSavedIfActionTaken.toLocaleString()} \u132d\u1295\u1245\u120b\u1275 \u120a\u12eb\u12f5\u1295 \u12ed\u127d\u120b\u120d\u1362`,
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
      reason: `Satellite observation shows current NDVI at ${data.currentNdvi} with a ${data.timelineDays}-day forecast NDVI of ${data.forecastNdvi} (${data.trend}). 7-day rainfall is ${data.weather.rainfall7DaySum}mm. Livestock density (${data.livestock.densityTLUPerKm2} TLU/km\u00b2) elevates grazing pressure.`,
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
          `\u1260\u1240\u1295 ${s.actionByDay}\u1361 \u1218\u1296 \u12a5\u122d\u121d\u1333 \u12a8\u1270\u1320\u1293\u1240\u1240 ~${s.animalsSavedIfActionTaken.toLocaleString()} \u132d\u1295\u1245\u120b\u1275 \u12eb\u12f5\u1291 (${s.saveRatePercent}% \u12e8\u1270\u1320\u1260\u1240 \u121e\u1275\u1364 ~$${s.economicLossAvoidedUSD.toLocaleString()} USD \u12ed\u12a8\u120b\u12a8\u1209)\u1362`
      );
      return `${impact.summary} ${lines.join(' ')}`;
    }
    const lines = impact.scenarios.map(
      (s) =>
        `By day ${s.actionByDay}: save ~${s.animalsSavedIfActionTaken.toLocaleString()} head (${s.saveRatePercent}% of projected mortality; avoid ~$${s.economicLossAvoidedUSD.toLocaleString()} USD) if feed action is completed.`
    );
    return `${impact.summary} ${lines.join(' ')}`;
  }
''')

ai = ai[:start] + methods + ai[end:]
# Fix double-escaped unicode in localizeTrend/localizeImpact that were inserted via new_flow with u()
# Those should already be decoded. Check for literal \u1200 in file from localizeTrend map - in new_flow I had '\\u1348' inside the TS string which after u() becomes actual chars inside TS source as Ethiopian in the JS string - good.

# But wait - in new_flow localizeTrend I had:
# 'Rapid Decline': '\\u1348\\u1323\\u1295 ...'
# After u(), those become real Ethiopic inside the TypeScript source as string values - good.

ai_path.write_text(ai, encoding="utf-8")
assert "\ufffd" not in ai
assert "isEthiopicText" in ai
assert "localizeImpact" in ai
print("patched aiAnalyzer.ts")
print("ethiopic sample ok", "ወሳኝ" in ai or "በቀን" in ai)
