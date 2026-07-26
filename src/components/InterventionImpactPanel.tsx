import React from 'react';
import { InterventionImpact } from '../types';
import { HeartPulse } from 'lucide-react';
import { useLanguage } from '../i18n';

interface InterventionImpactPanelProps {
  impact: InterventionImpact;
  activeTimelineDays?: number;
  narrative?: string;
  compact?: boolean;
}

export const InterventionImpactPanel: React.FC<InterventionImpactPanelProps> = ({
  impact,
  activeTimelineDays,
  narrative,
  compact = false,
}) => {
  const { t, tf } = useLanguage();

  const s15 = impact.scenarios.find((s) => s.actionByDay === 15);
  const s60 = impact.scenarios.find((s) => s.actionByDay === 60);
  const best = impact.scenarios.find((s) => s.actionByDay === impact.bestActionByDay);
  const extra =
    s15 && s60
      ? Math.max(0, s15.animalsSavedIfActionTaken - s60.animalsSavedIfActionTaken)
      : 0;
  const localizedSummary =
    best && best.animalsSavedIfActionTaken > 0
      ? tf(t.impact.summaryBest, {
          day: best.actionByDay,
          saved: best.animalsSavedIfActionTaken.toLocaleString(),
          extra: extra.toLocaleString(),
        })
      : t.impact.summaryLimited;

  const localizedNarrative =
    narrative &&
    `${tf(t.brief.narrativeIntro, { summary: localizedSummary })} ${impact.scenarios
      .map((s) =>
        tf(t.brief.narrativeByDay, {
          day: s.actionByDay,
          saved: s.animalsSavedIfActionTaken.toLocaleString(),
          pct: s.saveRatePercent,
          usd: s.economicLossAvoidedUSD.toLocaleString(),
        })
      )
      .join(' ')}`;

  return (
    <section className={`rounded-lg border border-line ${compact ? 'bg-panel p-3' : 'bg-field-soft/40 p-4'} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="gf-label mb-1 flex items-center gap-1.5 text-field">
            <HeartPulse className="h-3.5 w-3.5" /> {t.impact.title}
          </h3>
          <p className="text-xs leading-relaxed text-muted">{localizedSummary}</p>
        </div>
        <span className="gf-badge-ok shrink-0">{tf(t.impact.bestByDay, { n: impact.bestActionByDay })}</span>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
        {impact.scenarios.map((s) => {
          const isActive = activeTimelineDays === s.actionByDay;
          const isBest = s.actionByDay === impact.bestActionByDay;
          return (
            <div
              key={s.actionByDay}
              className={`rounded-md border p-3 ${
                isActive
                  ? 'border-field bg-field text-panel dark:text-canvas'
                  : isBest
                    ? 'border-field bg-panel'
                    : 'border-line bg-panel'
              }`}
            >
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'text-panel/80 dark:text-canvas/80' : 'text-soft'}`}>
                {tf(t.impact.actBy, { n: s.actionByDay })}
              </p>
              <p className={`gf-metric mt-1 text-xl ${isActive ? 'text-panel dark:text-canvas' : 'text-field'}`}>
                {s.animalsSavedIfActionTaken.toLocaleString()}
              </p>
              <p className={`mt-0.5 text-[10px] ${isActive ? 'text-panel/75 dark:text-canvas/75' : 'text-muted'}`}>
                {tf(t.impact.headSaved, { pct: s.saveRatePercent })}
              </p>
              <p className={`mt-1 text-[10px] ${isActive ? 'text-panel/70 dark:text-canvas/70' : 'text-soft'}`}>
                {tf(t.impact.vsDeaths, { n: s.projectedMortalityWithoutAction.toLocaleString() })}
              </p>
              <p className={`mt-1 text-[10px] font-medium ${isActive ? 'text-panel dark:text-canvas' : 'text-signal'}`}>
                {tf(t.impact.usdAvoided, { amount: s.economicLossAvoidedUSD.toLocaleString() })}
              </p>
            </div>
          );
        })}
      </div>

      {localizedNarrative && (
        <p className="rounded-md border border-line bg-panel p-3 text-xs leading-relaxed text-ink">
          {localizedNarrative}
        </p>
      )}
    </section>
  );
};
