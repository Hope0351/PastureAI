import React, { useState, useEffect } from 'react';
import { DistrictData, FeedRequirement, InterventionImpact } from '../types';
import { Users, AlertCircle, ShieldAlert, DollarSign, HeartPulse, Beef, Wheat } from 'lucide-react';
import axios from 'axios';
import { api } from '../services/api';
import { useLanguage } from '../i18n';

interface LivestockPageProps {
  districts: DistrictData[];
  timelineDays: number;
  darkMode?: boolean;
}

export const LivestockPage: React.FC<LivestockPageProps> = ({ districts, timelineDays }) => {
  const { t, tf } = useLanguage();
  const [feedReqs, setFeedReqs] = useState<FeedRequirement[]>([]);
  const [impacts, setImpacts] = useState<InterventionImpact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [feedRes, impactList] = await Promise.all([
          axios.get('/api/feed', { params: { timeline: timelineDays } }),
          api.getAllInterventionImpacts(),
        ]);
        setFeedReqs(feedRes.data.requirements || []);
        setImpacts(impactList);
      } catch (err) {
        console.error('Error fetching feed requirements:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, [timelineDays]);

  const totalFeedTons = feedReqs.reduce((acc, f) => acc + f.feedNeededTons, 0);
  const totalAnimalsRisk = feedReqs.reduce((acc, f) => acc + f.animalsAtRisk, 0);
  const totalLossUSD = feedReqs.reduce((acc, f) => acc + f.estimatedEconomicLossUSD, 0);
  const actionDay = ([15, 30, 45, 60].includes(timelineDays) ? timelineDays : 30) as 15 | 30 | 45 | 60;
  const totalSavedIfAct = impacts.reduce((acc, impact) => {
    const s = impact.scenarios.find((x) => x.actionByDay === actionDay);
    return acc + (s?.animalsSavedIfActionTaken || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="gf-page-header">
        <div>
          <span className="gf-kicker">{t.livestock.kicker}</span>
          <h2 className="gf-title mt-2">{t.livestock.title}</h2>
          <p className="gf-subtitle mt-3">
            {t.livestock.subtitle}{' '}
            <strong className="text-field">+{timelineDays}d</strong>
          </p>
        </div>
      </div>

      {/* Summary stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryStat
          icon={<Wheat className="h-6 w-6" />}
          label={t.livestock.feedNeeded}
          value={isLoading ? '—' : totalFeedTons.toLocaleString()}
          unit={t.livestock.metricTons}
          tone="signal"
          description={t.livestock.totalDeficit}
        />
        <SummaryStat
          icon={<AlertCircle className="h-6 w-6" />}
          label={t.livestock.livestockAtRisk}
          value={isLoading ? '—' : totalAnimalsRisk.toLocaleString()}
          unit={t.common.head}
          tone="critical"
          description={t.livestock.firstWave}
        />
        <SummaryStat
          icon={<DollarSign className="h-6 w-6" />}
          label={t.livestock.assetLoss}
          value={isLoading ? '—' : `$${totalLossUSD.toLocaleString()}`}
          unit="USD"
          tone="field"
          description={t.stats.withoutIntervention}
        />
      </div>

      {/* Intervention impact table */}
      <div className="gf-panel overflow-hidden">
        <div className="p-5 pb-4 border-b border-line-subtle">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-ink flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-ok" />
                {t.livestock.savedByDate}
              </h3>
              <p className="text-sm text-muted mt-1">
                {t.livestock.savedByDateDesc}
              </p>
            </div>
            <div className="rounded-xl bg-ok-soft px-4 py-2 text-sm font-bold text-ok tabular-nums">
              {tf(t.livestock.headSavedBanner, { day: actionDay, count: totalSavedIfAct.toLocaleString() })}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="gf-table">
            <thead>
              <tr>
                <th>{t.livestock.district}</th>
                <th>{t.livestock.actBy15}</th>
                <th>{t.livestock.actBy30}</th>
                <th>{t.livestock.actBy45}</th>
                <th>{t.livestock.actBy60}</th>
                <th>{t.livestock.bestWindow}</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => {
                const impact = impacts.find((i) => i.districtId === d.id);
                const cell = (day: 15 | 30 | 45 | 60) =>
                  impact?.scenarios.find((s) => s.actionByDay === day)?.animalsSavedIfActionTaken.toLocaleString() ||
                  '—';
                return (
                  <tr key={d.id} className="transition-colors hover:bg-canvas">
                    <td className="font-semibold text-ink">{d.name}</td>
                    <td className={`tabular-nums ${actionDay === 15 ? 'font-bold text-field bg-field-soft/50' : ''}`}>{cell(15)}</td>
                    <td className={`tabular-nums ${actionDay === 30 ? 'font-bold text-field bg-field-soft/50' : ''}`}>{cell(30)}</td>
                    <td className={`tabular-nums ${actionDay === 45 ? 'font-bold text-field bg-field-soft/50' : ''}`}>{cell(45)}</td>
                    <td className={`tabular-nums ${actionDay === 60 ? 'font-bold text-field bg-field-soft/50' : ''}`}>{cell(60)}</td>
                    <td>
                      {impact ? (
                        <span className="gf-badge-ok">{tf(t.livestock.dayN, { n: impact.bestActionByDay })}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone demographics table */}
      <div className="gf-panel overflow-hidden">
        <div className="p-5 pb-4 border-b border-line-subtle flex items-center gap-2">
          <Users className="h-5 w-5 text-field" />
          <h3 className="font-display text-lg font-bold tracking-tight text-ink">
            {t.livestock.demographics}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="gf-table">
            <thead>
              <tr>
                <th>{t.livestock.district}</th>
                <th className="text-center"><Beef className="h-4 w-4 mx-auto mb-1" />{t.livestock.cattle}</th>
                <th className="text-center"><Beef className="h-4 w-4 mx-auto mb-1" />{t.livestock.camels}</th>
                <th className="text-center"><Wheat className="h-4 w-4 mx-auto mb-1" />{t.livestock.goatsSheep}</th>
                <th>{t.livestock.totalTlu}</th>
                <th>{t.livestock.feedT}</th>
                <th>{t.livestock.atRisk}</th>
                <th>{t.livestock.priority}</th>
                <th>{t.livestock.depot}</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => {
                const req = feedReqs.find((f) => f.districtId === d.id);
                return (
                  <tr key={d.id} className="transition-colors hover:bg-canvas">
                    <td className="font-semibold text-ink">{d.name}</td>
                    <td className="tabular-nums text-center">{d.livestock.cattle.toLocaleString()}</td>
                    <td className="tabular-nums text-center">{d.livestock.camels.toLocaleString()}</td>
                    <td className="tabular-nums text-center">{(d.livestock.goats + d.livestock.sheep).toLocaleString()}</td>
                    <td className="font-mono font-bold text-signal tabular-nums">{d.livestock.totalTLU.toLocaleString()}</td>
                    <td className="font-bold text-signal tabular-nums">{req ? req.feedNeededTons.toLocaleString() : '—'}</td>
                    <td className="font-bold text-critical tabular-nums">{req ? req.animalsAtRisk.toLocaleString() : '—'}</td>
                    <td>
                      <span className={`inline-flex items-center justify-center min-w-[3rem] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                        req && req.priorityScore >= 70 
                          ? 'bg-critical-soft text-critical'
                          : req && req.priorityScore >= 40
                            ? 'bg-signal-soft text-signal'
                            : 'bg-ok-soft text-ok'
                      }`}>
                        {req ? `${req.priorityScore}/100` : '—'}
                      </span>
                    </td>
                    <td className="text-sky font-medium">{req ? req.assignedDepotName : '—'}</td>
                  </tr>
                );
              })}
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
        <div className={`rounded-xl p-3 bg-${tone}-soft text-${tone} shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="gf-label !text-[10px]">{label}</p>
          <p className={`gf-metric text-2xl mt-1 ${tone === 'signal' ? 'text-signal' : tone === 'critical' ? 'text-critical' : 'text-field'} tabular-nums`}>
            {value}
          </p>
          <p className="text-xs text-soft mt-0.5">{unit}</p>
          {description && (
            <p className="mt-2 text-[11px] text-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
