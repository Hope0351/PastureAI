import React from 'react';
import { SystemStatus } from '../types';
import { Radio, Satellite, Brain, Route, LineChart, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBannerProps {
  status: SystemStatus | null;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ status }) => {
  if (!status) return null;

  const chips = [
    {
      label: 'Open-Meteo',
      icon: Radio,
      ok: status.services.weather.status === 'live',
      text: status.services.weather.status === 'live' ? 'Live' : 'Fallback',
      detail: status.services.weather.detail,
    },
    {
      label: 'Satellite',
      icon: Satellite,
      ok: status.services.satellite.status === 'live',
      text: status.services.satellite.status === 'live' ? 'Live GEE' : 'Modeled',
      detail: status.services.satellite.detail,
    },
    {
      label: 'Forecast',
      icon: LineChart,
      ok: true,
      text: 'Ensemble fitted',
      detail: status.services.forecasting.detail,
    },
    {
      label: 'Routing',
      icon: Route,
      ok: true,
      text: 'Clarke-Wright',
      detail: status.services.routing.detail,
    },
    {
      label: 'AI Brief',
      icon: Brain,
      ok: status.services.gemini.status === 'configured',
      text: status.services.gemini.status === 'configured' ? 'Gemini' : 'Rules engine',
      detail: status.services.gemini.detail,
    },
  ];

  return (
    <div className="gf-panel-glass p-1 inline-flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-soft px-2">Systems</span>
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
