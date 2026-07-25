import React from 'react';
import { InterventionImpact } from '../types';
import { HeartPulse } from 'lucide-react';

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
  return (
    <section className={`rounded-lg border border-line ${compact ? 'bg-panel p-3' : 'bg-field-soft/40 p-4'} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="gf-label mb-1 flex items-center gap-1.5 text-field">
            <HeartPulse className="h-3.5 w-3.5" /> Livestock saved by decisive action
          </h3>
          <p className="text-xs leading-relaxed text-muted">{impact.summary}</p>
        </div>
        <span className="gf-badge-ok shrink-0">Best by day {impact.bestActionByDay}</span>
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
                Act by +{s.actionByDay}d
              </p>
              <p className={`gf-metric mt-1 text-xl ${isActive ? 'text-panel dark:text-canvas' : 'text-field'}`}>
                {s.animalsSavedIfActionTaken.toLocaleString()}
              </p>
              <p className={`mt-0.5 text-[10px] ${isActive ? 'text-panel/75 dark:text-canvas/75' : 'text-muted'}`}>
                head saved · {s.saveRatePercent}% avert
              </p>
              <p className={`mt-1 text-[10px] ${isActive ? 'text-panel/70 dark:text-canvas/70' : 'text-soft'}`}>
                vs {s.projectedMortalityWithoutAction.toLocaleString()} deaths if no action
              </p>
              <p className={`mt-1 text-[10px] font-medium ${isActive ? 'text-panel dark:text-canvas' : 'text-signal'}`}>
                ${s.economicLossAvoidedUSD.toLocaleString()} USD avoided
              </p>
            </div>
          );
        })}
      </div>

      {narrative && (
        <p className="rounded-md border border-line bg-panel p-3 text-xs leading-relaxed text-ink">{narrative}</p>
      )}
    </section>
  );
};
