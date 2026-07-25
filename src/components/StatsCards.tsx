import React from 'react';
import { AlertTriangle, ShieldCheck, Truck, Users, Activity, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardSummary } from '../types';

interface StatsCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 stagger-children">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="gf-panel p-5 h-32 gf-skeleton" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Zones',
      value: summary.monitoredDistrictsCount,
      unit: 'monitored',
      icon: Activity,
      tone: 'sky',
      subtext: `${summary.healthyDistrictsCount} healthy · ${summary.warningDistrictsCount} warning`,
      trend: 'neutral' as const,
    },
    {
      title: 'Critical',
      value: summary.highRiskDistrictsCount,
      unit: 'high risk',
      icon: AlertTriangle,
      tone: summary.highRiskDistrictsCount > 0 ? 'critical' : 'ok',
      subtext: summary.droughtAlertLevel,
      trend: summary.highRiskDistrictsCount > 0 ? 'down' as const : 'up' as const,
    },
    {
      title: 'Feed deficit',
      value: summary.totalFeedDeficitTons.toLocaleString(),
      unit: 'tons',
      icon: Truck,
      tone: 'signal',
      subtext: `${summary.activeSupplyRoutesCount} active routes`,
      trend: 'neutral' as const,
    },
    {
      title: 'At risk',
      value: summary.totalLivestockAtRisk.toLocaleString(),
      unit: 'head',
      icon: Users,
      tone: 'critical',
      subtext: 'Estimated first-wave cohort',
      trend: 'down' as const,
    },
    {
      title: 'Mean NDVI',
      value: summary.averageRegionalNdvi.toFixed(3),
      unit: 'index',
      icon: ShieldCheck,
      tone: summary.averageRegionalNdvi >= 0.4 ? 'ok' : 'signal',
      subtext: `Updated ${summary.lastSatelliteUpdate}`,
      trend: summary.averageRegionalNdvi >= 0.4 ? 'up' : 'down' as const,
    },
    {
      title: 'Loss at risk',
      value: summary.estimatedEconomicLossUSD
        ? `$${(summary.estimatedEconomicLossUSD / 1_000_000).toFixed(2)}M`
        : '—',
      unit: 'USD',
      icon: DollarSign,
      tone: 'signal',
      subtext: 'Without intervention',
      trend: 'down' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`gf-panel group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg gf-glow-${card.tone}`}
          >
            {/* Background accent */}
            <div 
              className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.06] bg-${card.tone} transition-transform duration-500 group-hover:scale-150`}
            />

            <div className="relative">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="gf-label text-[11px]">{card.title}</span>
                <div className={`rounded-lg bg-${card.tone}-soft p-2 transition-colors group-hover:bg-${card.tone}/20`}>
                  <Icon className={`h-4 w-4 text-${card.tone}`} />
                </div>
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-1.5">
                <span className="gf-metric text-2xl tabular-nums">{card.value}</span>
                <span className="text-[11px] font-medium text-soft">{card.unit}</span>
              </div>

              {/* Subtext & trend */}
              <div className="mt-3 flex items-center gap-2">
                {card.trend === 'up' && <TrendingUp className="h-3 w-3 text-ok" />}
                {card.trend === 'down' && <TrendingDown className="h-3 w-3 text-critical" />}
                <p className="truncate text-[11px] text-muted leading-tight">{card.subtext}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
