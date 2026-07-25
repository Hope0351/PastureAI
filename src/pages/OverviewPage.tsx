import React from 'react';
import { MapComponent } from '../components/MapComponent';
import { StatsCards } from '../components/StatsCards';
import { TimelineSlider } from '../components/TimelineSlider';
import { DistrictPanel } from '../components/DistrictPanel';
import {
  AiRecommendation,
  DashboardSummary,
  DistrictData,
  DistrictForecast,
  FeedDepot,
  FeedRequirement,
  OptimizedRoute,
} from '../types';
import { ChevronRight, AlertTriangle, TrendingDown, MapPin, ArrowUpRight } from 'lucide-react';

interface OverviewPageProps {
  summary: DashboardSummary | null;
  districts: DistrictData[];
  selectedDistrict: DistrictData | null;
  setSelectedDistrict: (d: DistrictData) => void;
  forecast: DistrictForecast | null;
  feedRequirement: FeedRequirement | null;
  route: OptimizedRoute | null;
  aiBrief: AiRecommendation | null;
  depots: FeedDepot[];
  routes: OptimizedRoute[];
  timelineDays: number;
  setTimelineDays: (days: number) => void;
  isLoading: boolean;
  darkMode?: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  districts,
  selectedDistrict,
  setSelectedDistrict,
  forecast,
  feedRequirement,
  route,
  aiBrief,
  depots,
  routes,
  timelineDays,
  setTimelineDays,
  isLoading,
  darkMode = false,
}) => {
  const lossM = ((summary?.estimatedEconomicLossUSD || 0) / 1_000_000).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page Header with KPI highlight */}
      <div className="gf-page-header">
        <div className="max-w-2xl">
          <span className="gf-kicker">Command Overview</span>
          <h2 className="gf-title mt-2">Predict forage collapse.<br />Move feed in time.</h2>
          <p className="gf-subtitle mt-3">
            Satellite vegetation intelligence, live weather data, statistical forecasting, and capacity-aware routing — unified in one command view.
          </p>
        </div>

        {/* Loss at risk card */}
        <div className="gf-panel-gradient p-6 min-w-[14rem] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute right-4 bottom-4 h-20 w-20 rounded-full bg-white/5" />
          
          <div className="relative">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Avoidable loss</p>
            <p className="mt-2 font-display text-4xl font-bold text-white tabular-nums">${lossM}M</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80">
              <TrendingDown className="h-4 w-4" />
              USD at risk · {timelineDays}d horizon
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards summary={summary} isLoading={isLoading} />

      {/* Timeline Slider */}
      <TimelineSlider timelineDays={timelineDays} setTimelineDays={setTimelineDays} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Map section */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="gf-kicker">Situational Awareness</span>
              <h3 className="font-display text-xl font-bold tracking-tight text-ink mt-1.5">
                Pasture health & feed corridors
              </h3>
              <p className="text-sm text-muted mt-1">Real-time vegetation index across monitored zones</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted bg-field-soft px-3 py-2 rounded-xl">
              <MapPin className="h-3.5 w-3.5 text-field" />
              Select a zone to inspect details
            </div>
          </div>

          <MapComponent
            districts={districts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            depots={depots}
            routes={routes}
            timelineDays={timelineDays}
            darkMode={darkMode}
          />
        </div>

        {/* District list panel */}
        <div className="lg:col-span-4">
          <div className="gf-panel-elevated h-full flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="p-5 border-b border-line-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <p className="gf-kicker !text-[11px]">Priority Zones</p>
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink mt-0.5">
                    Rangeland status
                  </h3>
                </div>
                <span className="inline-flex items-center justify-center h-7 min-w-[2.25rem] rounded-full bg-field-soft px-2.5 text-xs font-bold text-field tabular-nums">
                  {districts.length} zones
                </span>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-1.5">
              {[...districts]
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((d) => {
                  const isSelected = selectedDistrict?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDistrict(d)}
                      className={`group relative w-full text-left rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? 'bg-field-soft border border-field shadow-sm' 
                          : 'border border-transparent hover:bg-canvas hover:border-line-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3.5 gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            {/* Risk indicator */}
                            <span className={`relative flex shrink-0 ${d.riskLevel === 'Critical' ? 'text-critical' : d.riskLevel === 'Warning' ? 'text-signal' : 'text-ok'}`}>
                              {d.riskLevel === 'Critical' && (
                                <>
                                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-current opacity-50"></span>
                                  <AlertTriangle className="h-4 w-4 relative" />
                                </>
                              )}
                              {d.riskLevel !== 'Critical' && (
                                <span className={`block h-4 w-4 rounded-full border-2 ${d.riskLevel === 'Warning' ? 'border-signal bg-signal-soft' : 'border-ok bg-ok-soft'}`} />
                              )}
                            </span>
                            <span className="truncate text-sm font-semibold text-ink">{d.name}</span>
                          </div>
                          <p className="truncate text-xs text-muted pl-6">
                            {d.region} · <span className="tabular-nums font-medium text-ink">{d.livestock.totalTLU.toLocaleString()}</span> TLU
                          </p>
                        </div>

                        <div className="flex items-center gap-3 pl-2">
                          {/* NDVI value */}
                          <div className="text-right">
                            <div className="font-display text-base font-bold tabular-nums text-field">{d.currentNdvi.toFixed(3)}</div>
                            <div className="text-[10px] uppercase tracking-wider text-soft font-medium">NDVI</div>
                          </div>
                          {/* Arrow */}
                          <ChevronRight className={`h-4 w-4 transition-all duration-200 ${isSelected ? 'text-field translate-x-0.5' : 'text-soft group-hover:text-muted group-hover:translate-x-0.5'}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* District detail panel */}
      {selectedDistrict && (
        <DistrictPanel
          district={selectedDistrict}
          forecast={forecast}
          feedRequirement={feedRequirement}
          route={route}
          aiBrief={aiBrief}
          onClose={() => setSelectedDistrict(districts[0])}
          timelineDays={timelineDays}
        />
      )}
    </div>
  );
};
