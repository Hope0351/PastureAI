import React from 'react';
import {
  AlertCircle,
  Calendar,
  CloudRain,
  Cpu,
  FileText,
  MapPin,
  ShieldAlert,
  Truck,
  Users,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import {
  AiRecommendation,
  DistrictData,
  DistrictForecast,
  FeedRequirement,
  OptimizedRoute,
} from '../types';
import { InterventionImpactPanel } from './InterventionImpactPanel';

interface DistrictPanelProps {
  district: DistrictData | null;
  forecast: DistrictForecast | null;
  feedRequirement: FeedRequirement | null;
  route: OptimizedRoute | null;
  aiBrief: AiRecommendation | null;
  onClose: () => void;
  timelineDays: number;
}

export const DistrictPanel: React.FC<DistrictPanelProps> = ({
  district,
  forecast,
  feedRequirement,
  route,
  aiBrief,
  onClose,
  timelineDays,
}) => {
  if (!district) return null;

  const currentForecastPoint = forecast?.forecasts[timelineDays] || forecast?.forecasts[30];

  return (
    <div className="gf-panel-elevated overflow-hidden animate-fade-up">
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-field via-sky to-signal" />

      <div className="custom-scrollbar max-h-[85vh] space-y-6 overflow-y-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-line-subtle">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-muted">
                <MapPin className="h-4 w-4 text-field" />
                <span className="text-xs font-medium">Zone Profile</span>
              </div>
            </div>
            
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink mt-2 flex items-center gap-3">
              {district.name}
              <span className={
                district.riskLevel === 'Critical'
                  ? 'inline-flex items-center gap-1.5 rounded-full bg-critical-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-critical'
                  : district.riskLevel === 'Warning'
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-signal-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-signal'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-ok'
              }>
                {district.riskLevel} · {district.riskScore}/100
              </span>
            </h2>

            <p className="mt-2 text-sm text-muted">
              {district.region} · {district.capital} · {district.areaKm2.toLocaleString()} km²
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => window.print()} 
              className="gf-btn !rounded-xl"
              title="Export Briefing Report"
            >
              <FileText className="h-4 w-4 text-field" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button 
              onClick={onClose} 
              className="gf-btn !rounded-xl" 
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label="Sentinel-2 NDVI"
            value={district.currentNdvi.toFixed(3)}
            hint="MSI 10m resolution"
            icon={<Calendar className="h-5 w-5" />}
            tone="field"
          />
          <MetricCard
            label={`Forecast (+${timelineDays}d)`}
            value={currentForecastPoint?.forecastNdvi.toFixed(3) || 'N/A'}
            hint={`Trend: ${forecast?.trend || 'Stable'}`}
            icon={<AlertCircle className="h-5 w-5" />}
            tone="signal"
          />
          <MetricCard
            label="7-Day Rainfall"
            value={`${district.weather.rainfall7DaySum}`}
            unit="mm"
            hint={`Temp: ${district.weather.currentTemp}°C`}
            icon={<CloudRain className="h-5 w-5" />}
            tone="sky"
          />
          <MetricCard
            label="Livestock TLU"
            value={district.livestock.totalTLU.toLocaleString()}
            hint={`${district.livestock.densityTLUPerKm2} TLU/km²`}
            icon={<Users className="h-5 w-5" />}
            tone="critical"
          />
        </div>

        {/* AI Brief section */}
        {aiBrief && (
          <section className="space-y-4 rounded-2xl border border-line-subtle bg-canvas p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-field/5 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-field-soft p-2.5 text-field">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">AI Decision Brief</h3>
                </div>
                <span className={
                  aiBrief.priority === 'Critical' 
                    ? 'gf-badge-critical' 
                    : 'gf-badge-warn'
                }>
                  {aiBrief.priority} Priority
                </span>
              </div>

              <div className="rounded-xl border border-line-subtle bg-panel p-5 mb-4">
                <p className="text-sm font-semibold text-field mb-2 uppercase tracking-wider text-xs">Executive Summary</p>
                <p className="text-base leading-relaxed text-ink">{aiBrief.summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-line-subtle bg-panel p-4">
                  <p className="text-xs font-bold text-field mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Recommended Action
                  </p>
                  <p className="text-sm leading-relaxed text-muted">{aiBrief.recommendedAction}</p>
                </div>
                <div className="rounded-xl border border-line-subtle bg-panel p-4">
                  <p className="text-xs font-bold text-sky mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Feed Distribution
                  </p>
                  <p className="text-sm leading-relaxed text-muted">{aiBrief.distributionStrategy}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-signal/20 bg-signal-soft/50 p-4">
                <p className="text-xs font-bold text-signal mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> Plain Language
                </p>
                <p className="text-sm leading-relaxed text-ink">{aiBrief.plainLanguageExplanation}</p>
              </div>

              {aiBrief.interventionImpact && (
                <InterventionImpactPanel
                  impact={aiBrief.interventionImpact}
                  activeTimelineDays={timelineDays}
                  narrative={aiBrief.livestockSavedPrediction}
                  compact
                />
              )}
            </div>
          </section>
        )}

        {/* Feed & Logistics section */}
        {feedRequirement && route && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Feed deficit card */}
            <div className="rounded-2xl border border-critical/20 bg-gradient-to-br from-critical-soft/50 to-transparent p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-line-subtle">
                <div className="rounded-xl bg-critical-soft p-2.5 text-critical">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Feed Deficit</h3>
              </div>
              
              <div className="space-y-3">
                <DetailRow label="Analysis Window" value={`+${timelineDays} days`} />
                <DetailRow label="Feed Required" value={`${feedRequirement.feedNeededTons.toLocaleString()} t`} accent="signal" bold />
                <DetailRow label="Animals at Risk" value={`${feedRequirement.animalsAtRisk.toLocaleString()} head`} accent="critical" bold />
                <DetailRow label="Urgency Window" value={`Within ${feedRequirement.urgencyDays} days`} />
                <DetailRow
                  label="Economic Loss at Risk"
                  value={`$${feedRequirement.estimatedEconomicLossUSD.toLocaleString()} USD`}
                  accent="signal"
                  bold
                  last
                />
              </div>
            </div>

            {/* Dispatch logistics card */}
            <div className="rounded-2xl border border-sky/20 bg-gradient-to-br from-sky-soft/50 to-transparent p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-line-subtle">
                <div className="rounded-xl bg-sky-soft p-2.5 text-sky">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Dispatch Logistics</h3>
              </div>
              
              <div className="space-y-3">
                <DetailRow label="Assigned Depot" value={route.depotName} accent="sky" bold />
                <DetailRow label="Vehicle Type" value={route.assignedTruckType} />
                <DetailRow label="Route Distance" value={`${route.distanceKm} km`} />
                <DetailRow label="Estimated Travel Time" value={`${route.estimatedTimeHours} h`} />
                <DetailRow
                  label="Fuel Consumption (Roundtrip)"
                  value={`${route.fuelConsumptionLiters} L`}
                  accent="signal"
                  bold
                  last
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  unit,
  tone = 'field',
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  unit?: string;
  tone?: string;
}) {
  return (
    <div className="group rounded-xl border border-line-subtle bg-canvas p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-line">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        <div className={`rounded-lg p-1.5 bg-${tone}-soft text-${tone} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-2xl font-bold tabular-nums ${tone === 'field' ? 'text-field' : tone === 'sky' ? 'text-sky' : tone === 'signal' ? 'text-signal' : 'text-critical'}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-soft ml-1">{unit}</span>}
      </div>
      <p className="mt-1.5 text-[11px] text-soft">{hint}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  accent,
  bold = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-2.5 ${
        last ? 'mt-2 pt-4 border-t border-line-subtle' : ''
      }`}
    >
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold tabular-nums' : 'font-medium tabular-nums'} ${
        accent === 'signal' ? 'text-signal' :
        accent === 'critical' ? 'text-critical' :
        accent === 'sky' ? 'text-sky' :
        'text-ink'
      }`}>
        {value}
      </span>
    </div>
  );
}
