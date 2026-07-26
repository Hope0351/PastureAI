import React, { useState, useEffect } from 'react';
import { DistrictData, AiRecommendation } from '../types';
import { FileText, CheckCircle2, ShieldAlert, Printer, Brain, Sparkles, AlertTriangle, Target, Truck, Calendar } from 'lucide-react';
import { InterventionImpactPanel } from '../components/InterventionImpactPanel';
import axios from 'axios';
import { useLanguage } from '../i18n';
import { riskLabel } from '../i18n/localize';

interface AiBriefPageProps {
  districts: DistrictData[];
  timelineDays: number;
  darkMode?: boolean;
}

export const AiBriefPage: React.FC<AiBriefPageProps> = ({ districts, timelineDays }) => {
  const { t, tf, locale } = useLanguage();
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(districts[0]?.id || 'borena');
  const [brief, setBrief] = useState<AiRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedDistrictId) return;

    const fetchBrief = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get('/api/analysis', {
          params: { district: selectedDistrictId, timeline: timelineDays, lang: locale },
        });
        setBrief(res.data);
      } catch (err) {
        console.error('Error fetching AI executive brief:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrief();
  }, [selectedDistrictId, timelineDays, locale]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="gf-page-header">
        <div>
          <span className="gf-kicker">{t.brief.kicker}</span>
          <h2 className="gf-title mt-2">{t.brief.title}</h2>
          <p className="gf-subtitle mt-3">
            {t.brief.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            className="gf-input min-w-[200px]"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.region})
              </option>
            ))}
          </select>
          
          <button 
            onClick={() => window.print()} 
            className="gf-btn-primary"
          >
            <Printer className="h-4 w-4" />
            {t.brief.printBrief}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="gf-panel flex flex-col items-center justify-center py-20 rounded-2xl">
          <div className="relative mb-4">
            <div className="h-12 w-12 rounded-full border-4 border-line border-t-field animate-spin" />
            <Brain className="absolute inset-0 m-auto h-5 w-5 text-field" />
          </div>
          <p className="text-sm font-semibold text-ink">{t.brief.generating}</p>
          <p className="text-xs text-muted mt-1">{t.brief.analyzing}</p>
        </div>
      )}

      {/* Executive brief document */}
      {!isLoading && brief && (
        <div id="executive-brief" className="max-w-4xl mx-auto space-y-6 animate-fade-up">
          {/* Document header */}
          <div className="gf-panel-elevated overflow-hidden relative">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-field via-sky to-signal" />
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  {/* Breadcrumb */}
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-field bg-field-soft px-3 py-1.5 rounded-full">
                    <Sparkles className="h-3.5 w-3.5" />
                    መስክAI · {t.brief.decisionSupport}
                  </span>

                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                    {brief.districtName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-sky" />
                      {t.brief.horizon}{' '}
                      <strong className="text-field tabular-nums">+{brief.timelineDays} {t.common.days}</strong>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-line" />
                    <span>{new Date(brief.generatedAt).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                    <span className="w-1 h-1 rounded-full bg-line" />
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${
                      brief.generatedBy === 'gemini' ? 'text-ok' : 'text-signal'
                    }`}>
                      {brief.generatedBy === 'gemini' ? (
                        <>
                          <Brain className="h-4 w-4" /> {t.status.gemini}
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4" /> {t.status.rulesEngine}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Priority badge */}
                <div className={`shrink-0 rounded-2xl p-4 text-center min-w-[120px] ${
                  brief.priority === 'Critical'
                    ? 'bg-gradient-to-br from-critical to-critical/80 text-white shadow-lg shadow-critical/25'
                    : 'bg-gradient-to-br from-signal to-signal/80 text-white shadow-lg shadow-signal/25'
                }`}>
                  <AlertTriangle className="h-6 w-6 mx-auto mb-1 opacity-90" />
                  <p className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">{t.brief.priority}</p>
                  <p className="font-display text-xl font-bold">{riskLabel(t, brief.priority)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive summary */}
          <section className="gf-panel overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-field to-ok" />
            
            <div className="p-6 sm:p-8">
              <h3 className="gf-label !text-base !tracking-normal flex items-center gap-2 text-field mb-4">
                <FileText className="h-5 w-5" />
                {t.brief.executiveSummary}
              </h3>
              <p className="text-base leading-relaxed text-ink font-medium">
                {brief.summary}
              </p>
            </div>
          </section>

          {/* Intervention impact */}
          {brief.interventionImpact && (
            <InterventionImpactPanel
              impact={brief.interventionImpact}
              activeTimelineDays={brief.timelineDays}
              narrative={brief.livestockSavedPrediction}
            />
          )}

          {/* Rationale */}
          <section className="gf-panel p-6 sm:p-8">
            <h3 className="gf-label !text-base !tracking-normal flex items-center gap-2 text-field mb-4">
              <CheckCircle2 className="h-5 w-5" />
              {t.brief.satelliteRationale}
            </h3>
            <div className="rounded-xl border border-line-subtle bg-canvas p-5 leading-relaxed text-sm text-muted">
              {brief.reason}
            </div>
          </section>

          {/* Action cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="gf-panel overflow-hidden relative group hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-field/10 -translate-y-1/2 translate-x-1/4 blur-2xl" />
              
              <div className="p-6 relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-field-soft p-2.5 text-field">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="gf-label !text-base !tracking-normal text-field">{t.brief.recommendedAction}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{brief.recommendedAction}</p>
              </div>
            </section>

            <section className="gf-panel overflow-hidden relative group hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-sky/10 -translate-y-1/2 translate-x-1/4 blur-2xl" />
              
              <div className="p-6 relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-sky-soft p-2.5 text-sky">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="gf-label !text-base !tracking-normal text-sky">{t.brief.feedDistribution}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{brief.distributionStrategy}</p>
              </div>
            </section>
          </div>

          {/* Plain language briefing */}
          <section className="gf-panel overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-signal-soft/50 to-transparent" />
            
            <div className="relative p-6 sm:p-8">
              <h3 className="gf-label !text-base !tracking-normal flex items-center gap-2 text-signal mb-4">
                <ShieldAlert className="h-5 w-5" />
                {t.brief.plainLanguage}
              </h3>
              <p className="text-base leading-relaxed text-ink font-medium">
                {brief.plainLanguageExplanation}
              </p>
            </div>
          </section>

          {/* Footer metadata */}
          <div className="text-center py-4 text-xs text-soft space-x-4">
            <span>{t.brief.generatedBy}</span>
            <span>·</span>
            <span>
              {new Date(brief.generatedAt).toLocaleString(locale === 'am' ? 'am-ET' : 'en-US')}
            </span>
            <span>·</span>
            <span>{tf(t.brief.reportId, { id: `${selectedDistrictId}-${timelineDays}d` })}</span>
          </div>
        </div>
      )}
    </div>
  );
};
