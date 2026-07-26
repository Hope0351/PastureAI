import React from 'react';
import { useLanguage } from '../i18n';

interface TimelineSliderProps {
  timelineDays: number;
  setTimelineDays: (days: number) => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ timelineDays, setTimelineDays }) => {
  const { t, tf } = useLanguage();

  const steps = [
    { days: 0, label: t.timeline.today, subtitle: t.timeline.baseline, icon: '○' },
    { days: 15, label: '+15d', subtitle: t.timeline.nearTerm, icon: '◔' },
    { days: 30, label: '+30d', subtitle: t.timeline.decisionWindow, icon: '◑' },
    { days: 45, label: '+45d', subtitle: t.timeline.extended, icon: '◕' },
    { days: 60, label: '+60d', subtitle: t.timeline.seasonal, icon: '●' },
  ];

  return (
    <div className="gf-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="gf-kicker">{t.timeline.kicker}</span>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink mt-1.5">
            {t.timeline.title}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{t.common.active}:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-field-soft px-3 py-1 font-bold text-field tabular-nums">
            {timelineDays === 0 ? t.timeline.today : tf(t.timeline.plusDays, { days: timelineDays })}
          </span>
          <span className="text-xs text-soft hidden sm:inline">{t.timeline.ensembleNote}</span>
        </div>
      </div>

      {/* Timeline visual */}
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-line-subtle rounded-full" />
        
        {/* Active progress */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-field to-ok rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${(steps.findIndex(s => s.days === timelineDays) / (steps.length - 1)) * 100}%` 
          }}
        />

        <div className="relative grid grid-cols-5 gap-2 sm:gap-4">
          {steps.map((step, idx) => {
            const isSelected = timelineDays === step.days;
            const isPast = steps.findIndex(s => s.days === timelineDays) > idx;

            return (
              <button
                key={step.days}
                onClick={() => setTimelineDays(step.days)}
                className={`group relative flex flex-col items-center transition-all duration-300 ${
                  isSelected ? 'scale-105' : ''
                }`}
              >
                {/* Step node */}
                <div 
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-field bg-field shadow-lg shadow-field/25 scale-110'
                      : isPast
                        ? 'border-ok bg-ok text-white'
                        : 'border-line bg-panel hover:border-field/50 hover:bg-field-soft'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : isPast ? 'text-white' : 'text-muted group-hover:text-field'}`}>
                    {step.label}
                  </span>
                  
                  {/* Pulse effect for selected */}
                  {isSelected && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-field animate-ping opacity-30" />
                      <span className="absolute -inset-1 rounded-full border-2 border-field/20" />
                    </>
                  )}
                </div>

                {/* Label */}
                <div className={`mt-3 text-center transition-colors duration-200 ${isSelected ? '' : ''}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isSelected ? 'text-field' : isPast ? 'text-ok' : 'text-muted group-hover:text-ink'
                  }`}>
                    {step.subtitle}
                  </p>
                </div>

                {/* Connector dot */}
                {idx < steps.length - 1 && (
                  <div 
                    className={`absolute top-[22px] left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-px transition-colors duration-300 ${
                      isPast || (isSelected && steps[idx + 1].days === timelineDays) ? 'bg-field' : 'bg-line-subtle'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
