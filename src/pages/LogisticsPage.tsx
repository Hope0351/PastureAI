import React, { useState, useEffect } from 'react';
import { FeedDepot, OptimizedRoute } from '../types';
import { Truck, MapPin, Fuel, Clock, Route as RouteIcon, Package, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../i18n';

interface LogisticsPageProps {
  depots: FeedDepot[];
  timelineDays: number;
  darkMode?: boolean;
}

export const LogisticsPage: React.FC<LogisticsPageProps> = ({ depots, timelineDays }) => {
  const { t, tf } = useLanguage();
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRouting = async () => {
      try {
        const res = await axios.get('/api/routing', { params: { timeline: timelineDays } });
        setRoutes(res.data.routes || []);
      } catch (err) {
        console.error('Error fetching CVRP vehicle routes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouting();
  }, [timelineDays]);

  const totalDistance = routes.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalFuel = routes.reduce((acc, r) => acc + r.fuelConsumptionLiters, 0);
  const feasibleCount = routes.filter((r) => r.feasible !== false).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="gf-page-header">
        <div>
          <span className="gf-kicker">{t.logistics.kicker}</span>
          <h2 className="gf-title mt-2">{t.logistics.title}</h2>
          <p className="gf-subtitle mt-3">
            {t.logistics.subtitle}
          </p>
        </div>

        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 border ${
          feasibleCount === routes.length 
            ? 'border-ok/30 bg-ok-soft' 
            : 'border-signal/30 bg-signal-soft'
        }`}>
          <Truck className={`h-5 w-5 ${feasibleCount === routes.length ? 'text-ok' : 'text-signal'}`} />
          <div>
            <p className={`text-sm font-bold ${feasibleCount === routes.length ? 'text-ok' : 'text-signal'}`}>
              {isLoading
                ? t.common.optimizing
                : tf(t.logistics.feasibleCount, { feasible: feasibleCount, total: routes.length })}
            </p>
            <p className="text-[11px] text-muted">{t.logistics.routesValidated}</p>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && <div className="gf-panel h-32 gf-skeleton rounded-2xl" />}

      {/* Feed Hubs / Depots section */}
      <div>
        <h3 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-sky" />
          {t.logistics.feedDepots}
        </h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {depots.map((depot) => {
            const fill = Math.round((depot.availableStockTons / depot.capacityTons) * 100);
            const isLow = fill < 30;
            
            return (
              <div key={depot.id} className="gf-panel group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
                {/* Top accent line */}
                <div className={`h-1 ${isLow ? 'bg-critical' : fill < 60 ? 'bg-signal' : 'bg-field'}`} />
                
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-2.5 ${isLow ? 'bg-critical-soft text-critical' : 'bg-sky-soft text-sky'}`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-ink leading-snug truncate">{depot.name}</h4>
                      <p className="text-[11px] text-muted mt-0.5">{depot.location || t.logistics.distributionHub}</p>
                    </div>
                  </div>

                  {/* Stock level */}
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-muted font-medium">{t.logistics.stockLevel}</span>
                      <span className={`font-bold tabular-nums ${isLow ? 'text-critical' : 'text-field'}`}>
                        {depot.availableStockTons.toLocaleString()} / {depot.capacityTons.toLocaleString()} t
                      </span>
                    </div>
                    <div className="gf-progress">
                      <div 
                        className={`gf-progress-bar ${isLow ? '!bg-critical' : fill < 60 ? '!bg-signal' : ''}`}
                        style={{ width: `${Math.min(100, fill)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Fleet info */}
                  <div className="pt-2 border-t border-line-subtle">
                    <p className="text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">{t.logistics.availableFleet}</p>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-[11px] font-medium text-ink">
                        <Truck className="h-3 w-3 text-sky" />
                        {depot.trucksAvailable.heavyTransports20T}×20T
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-[11px] font-medium text-ink">
                        <Package className="h-3 w-3 text-signal" />
                        {depot.trucksAvailable.offRoadTrucks10T}×10T
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryStat 
          icon={<RouteIcon className="h-6 w-6" />} 
          label={t.logistics.activeCorridors} 
          value={String(routes.length)} 
          unit={t.common.routes} 
          tone="sky"
          description={t.logistics.optimizedPaths}
        />
        <SummaryStat 
          icon={<Clock className="h-6 w-6" />} 
          label={t.logistics.networkDistance} 
          value={totalDistance.toLocaleString()} 
          unit="km" 
          tone="signal"
          description={t.logistics.totalRouteDistance}
        />
        <SummaryStat 
          icon={<Fuel className="h-6 w-6" />} 
          label={t.logistics.estimatedFuel} 
          value={totalFuel.toLocaleString()} 
          unit={t.common.liters} 
          tone="field"
          description={t.logistics.totalFuel}
        />
      </div>

      {/* Dispatch schedule table */}
      <div className="gf-panel overflow-hidden">
        <div className="p-5 pb-4 border-b border-line-subtle flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight text-ink flex items-center gap-2">
            <Truck className="h-5 w-5 text-sky" />
            {t.logistics.dispatchSchedule}
          </h3>
          <span className="text-xs text-muted">{tf(t.logistics.routesPlanned, { count: routes.length })}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="gf-table">
            <thead>
              <tr>
                <th>{t.logistics.depot}</th>
                <th>{t.logistics.targetZone}</th>
                <th>{t.logistics.feedLoad}</th>
                <th>{t.logistics.vehicle}</th>
                <th>{t.logistics.stops}</th>
                <th>{t.logistics.distance}</th>
                <th>{t.logistics.duration}</th>
                <th>{t.logistics.fuel}</th>
                <th>{t.logistics.status}</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.routeId} className="transition-colors hover:bg-canvas">
                  <td>
                    <span className="font-semibold text-sky">{r.depotName}</span>
                  </td>
                  <td className="font-semibold text-ink">{r.targetDistrictName}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 font-bold text-signal tabular-nums">
                      <Package className="h-3.5 w-3.5" />
                      {r.allocatedFeedTons} t
                    </span>
                  </td>
                  <td className="text-muted">{r.assignedTruckType}</td>
                  <td className="tabular-nums">{r.stopsCount ?? r.waypoints.filter((w) => w.type === 'delivery_stop').length}</td>
                  <td className="tabular-nums">{r.distanceKm} km</td>
                  <td className="tabular-nums font-mono text-ink">{r.estimatedTimeHours} h</td>
                  <td className="tabular-nums font-mono text-signal">{r.fuelConsumptionLiters} L</td>
                  <td>
                    {r.feasible !== false ? (
                      <span className="inline-flex items-center gap-1.5 gf-badge-ok">
                        <CheckCircle2 className="h-3 w-3" />
                        {t.logistics.feasible}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 gf-badge-critical">
                        <XCircle className="h-3 w-3" />
                        {tf(t.logistics.shortTons, { n: r.stockShortfallTons || 0 })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function SummaryStat({
  icon,
  label,
  value,
  unit,
  tone,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  tone: string;
  description?: string;
}) {
  return (
    <div className={`gf-panel p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg gf-glow-${tone}`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-xl p-3 bg-${tone}-soft text-${tone}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="gf-label !text-[10px]">{label}</p>
          <p className={`gf-metric text-2xl mt-1 ${tone === 'sky' ? 'text-sky' : tone === 'signal' ? 'text-signal' : 'text-field'} tabular-nums`}>
            {value} <span className="text-sm font-normal text-soft font-sans">{unit}</span>
          </p>
          {description && (
            <p className="mt-1 text-[11px] text-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
