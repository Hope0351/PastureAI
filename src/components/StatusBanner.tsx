import React from 'react';
import { SystemStatus } from '../types';
import { Radio, Satellite, Brain, Route, LineChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n';

interface StatusBannerProps {
  status: SystemStatus | null;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ status }) => {
  const { t } = useLanguage();

  if (!status) return null;

  const chips = [
    {
      label: t.status.openMeteo,
      icon: Radio,
      ok: status.services.weather.status === 'live',
      text: status.services.weather.status === 'live' ? t.common.live : t.common.fallback,
      detail: status.services.weather.detail,
    },
    {
      label: t.status.satellite,
      icon: Satellite,
      ok: status.services.satellite.status === 'live',
      text: status.services.satellite.status === 'live' ? t.status.liveGee : t.common.modeled,
      detail: status.services.satellite.detail,
    },
    {
      label: t.status.forecast,
      icon: LineChart,
      ok: true,
      text: t.status.ensembleFitted,
      detail: status.services.forecasting.detail,
    },
    {
      label: t.status.routing,
      icon: Route,
      ok: true,
      text: t.status.clarkeWright,
      detail: status.services.routing.detail,
    },
    {
      label: t.status.aiBrief,
      icon: Brain,
      ok: status.services.gemini.status === 'configured',
      text: status.services.gemini.status === 'configured' ? t.status.gemini : t.status.rulesEngine,
      detail: status.services.gemini.detail,
    },
  ];

  return (
    <div className="gf-panel-glass p-1 inline-flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-soft px-2">{t.status.systems}</span>
      <div className="w-px h-4 bg-line" />
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <div 
            key={chip.label} 
            className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-default ${
              chip.ok 
                ? 'bg-ok-soft/60 hover:bg-ok-soft' 
                : 'bg-signal-soft/60 hover:bg-signal-soft'
            }`}
            title={chip.detail}
          >
            <Icon className={`h-3.5 w-3.5 ${chip.ok ? 'text-ok' : 'text-signal'}`} />
            <span className="font-semibold text-ink">{chip.label}</span>
            <span className={`flex items-center gap-1 ${chip.ok ? 'text-ok' : 'text-signal'}`}>
              {chip.ok ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {chip.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};
