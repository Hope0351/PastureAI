# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "backend" / "services" / "aiAnalyzer.ts"
text = p.read_text(encoding="utf-8")
start = text.find("    if (lang === 'am') {")
end2 = text.find(
    "    return {\n"
    "      districtId: data.districtId,\n"
    "      districtName: data.districtName,\n"
    "      timelineDays: data.timelineDays,\n"
    "      priority,\n"
    "      summary: `${data.districtName} is predicted"
)
if start < 0 or end2 < 0:
    raise SystemExit(f"markers not found: {start=} {end2=}")

raw = r"""    if (lang === 'am') {
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
        summary: `${data.districtName} \u1260\u121a\u1240\u1325\u1209\u1275 ${data.timelineDays} \u1240\u1293\u1275 ${condition} \u12a5\u1295\u12f0\u121a\u12eb\u130b\u1325\u1218\u12cd \u12ed\u1270\u1290\u1265\u12eb\u120d\u1362 \u1260\u1240\u1295 ${interventionImpact.bestActionByDay} \u12c8\u1233\u129d \u12a5\u122d\u121d\u1333 \u12a8\u1270\u12c8\u1230\u12f0 \u12c8\u12f0 ~${best.animalsSavedIfActionTaken.toLocaleString()} \u132d\u1295\u1245\u120b\u1275 \u120a\u12f5\u1295 \u12ed\u127d\u120b\u120d\u1362`,
        reason: `\u12e8\u1233\u1270\u120b\u12ed\u1275 \u121d\u120d\u12a8\u1273 \u12a0\u1201\u1295 NDVI ${data.currentNdvi} \u12eb\u1233\u12eb\u120d\u1363 \u12e8${data.timelineDays}-\u1240\u1295 \u1275\u1295\u1260\u12eb NDVI \u12f0\u130d\u121e ${data.forecastNdvi} (${data.trend}) \u1290\u12cd\u1362 \u12e87-\u1240\u1295 \u12dd\u1293\u1265 ${data.weather.rainfall7DaySum}mm \u1290\u12cd\u1362 \u12e8\u12a8\u1265\u1276\u127d \u1325\u130d\u130d\u1275 (${data.livestock.densityTLUPerKm2} TLU/km\u00b2) \u12e8\u130d\u1326\u123d \u132b\u1293\u1295 \u12eb\u130e\u120b\u120d\u1362`,
        recommendedAction: isCritical
          ? `\u12a8 ${data.logisticsRoute.assignedDepot} \u1270\u1328\u121b\u122a \u1218\u1296\u1295 \u1260${data.feedRequirement.urgencyDays} \u1240\u1293\u1275 \u12cd\u1235\u1325 \u12eb\u1295\u1240\u1233\u1245\u1231\u1362 \u1260\u1240\u1295 15 \u121b\u12f5\u1228\u130d \u12a8\u1240\u1295 60 \u1218\u1320\u1260\u1245 \u12ed\u120d\u1245 \u12e8\u121a\u12f5\u1291 \u12a8\u1265\u1276\u127d\u1295 \u12eb\u1260\u12db\u120d\u1362`
          : `\u12e8\u1233\u1270\u120b\u12ed\u1275 \u1235\u1265\u1235\u1266\u127d\u1295 \u12a5\u1293 \u12e8\u12cd\u1203 \u1290\u1325\u1266\u127d\u1295 \u12ed\u12a8\u1273\u1270\u1209\u1364 NDVI \u121b\u123d\u1246\u120d\u1246\u1209\u1295 \u12a8\u1240\u1320\u1208 \u1218\u1296\u1295 \u1245\u12f5\u1218 \u12a0\u1240\u121b\u1218\u1325 \u12eb\u12f5\u122d\u1309\u1362`,
        distributionStrategy: `\u12a8 ${data.logisticsRoute.assignedDepot} ${data.feedRequirement.feedNeededTons} \u121c\u1275\u122a\u12ad \u1276\u1295 \u1260 ${data.logisticsRoute.assignedTruckType} \u1260 ${data.logisticsRoute.distanceKm}km \u1218\u1295\u1308\u12f5 (${data.logisticsRoute.algorithm || 'CVRP'}) \u12eb\u1230\u122b\u1329\u1362`,
        confidence: '\u12a8\u134d\u1270\u129b',
        plainLanguageExplanation: `\u12e8${data.districtName} \u1233\u122d \u1260\u132d\u1295\u1240\u1275 \u120b\u12ed \u1290\u12cd\u1362 \u12eb\u1208 \u1218\u1296 \u12a5\u122d\u12f3\u1273 \u1260\u1240\u1295 ${active.actionByDay} \u12c8\u12f0 ${active.projectedMortalityWithoutAction.toLocaleString()} \u12a5\u1295\u1235\u1233\u1275 \u120a\u121e\u1271 \u12ed\u127d\u120b\u1209\u1362 \u1260\u12da\u12eb \u1240\u1295 \u12c8\u1233\u129d \u12a5\u122d\u121d\u1333 \u12c8\u12f0 ${active.animalsSavedIfActionTaken.toLocaleString()} \u132d\u1295\u1245\u120b\u1275 \u120a\u12eb\u12f5\u1295 \u12ed\u127d\u120b\u120d\u1362`,
        livestockSavedPrediction: this.buildLivestockSavedNarrative(interventionImpact, 'am'),
        interventionImpact,
        generatedAt: new Date().toISOString(),
        generatedBy: 'rules-engine',
      };
    }

"""

block = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), raw)
new = text[:start] + block + text[end2:]
if "\ufffd" in new[start:end2 + 500]:
    raise SystemExit("still has replacement chars")
p.write_text(new, encoding="utf-8")
print("fixed", p, "fffd=", new.count("\ufffd"))
