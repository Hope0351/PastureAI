import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { SatellitePage } from './pages/SatellitePage';
import { ClimatePage } from './pages/ClimatePage';
import { LivestockPage } from './pages/LivestockPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { AiBriefPage } from './pages/AiBriefPage';
import { api } from './services/api';
import { useLanguage } from './i18n';
import {
  AiRecommendation,
  DashboardSummary,
  DistrictData,
  DistrictForecast,
  FeedDepot,
  FeedRequirement,
  OptimizedRoute,
  SystemStatus,
} from './types';

export default function App() {
  const { t, locale } = useLanguage();
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [timelineDays, setTimelineDays] = useState<number>(30);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [forecast, setForecast] = useState<DistrictForecast | null>(null);
  const [feedReq, setFeedReq] = useState<FeedRequirement | null>(null);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [aiBrief, setAiBrief] = useState<AiRecommendation | null>(null);
  const [depots, setDepots] = useState<FeedDepot[]>([]);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoadedApp, setHasLoadedApp] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (showLanding) return;
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineDays, showLanding, locale]);

  const loadInitialData = async () => {
    setIsUpdating(true);
    if (!hasLoadedApp) setIsLoading(true);
    try {
      setError(null);
      const [sumData, districtList, depotData, routingData, health] = await Promise.all([
        api.getDashboardSummary(timelineDays),
        api.getDistricts(timelineDays),
        api.getFeedDepots(),
        api.getRouting(timelineDays),
        api.getHealth().catch(() => null),
      ]);

      setSummary(sumData);
      setDistricts(districtList);
      setDepots(depotData);
      setRoutes(routingData.routes || []);
      if (health) setSystemStatus(health);

      const activeDistrictId = selectedDistrict?.id || districtList[0]?.id || 'borena';
      const districtProfile = await api.getDistrictProfile(activeDistrictId, timelineDays, true, locale);

      setSelectedDistrict(districtProfile.district);
      setForecast(districtProfile.forecast);
      setFeedReq(districtProfile.feedRequirement);
      setRoute(districtProfile.route);
      setAiBrief(districtProfile.aiRecommendation);
      setHasLoadedApp(true);
    } catch (err) {
      console.error('Failed to load GeoForage AI dataset:', err);
      setError(t.app.connectionError);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  const handleEnterApp = () => {
    setActiveTab('overview');
    setShowLanding(false);
  };

  const handleRefresh = async () => {
    try {
      await api.clearCache();
    } catch {
      // ignore
    }
    await loadInitialData();
  };

  const handleSelectDistrict = async (district: DistrictData) => {
    setSelectedDistrict(district);
    try {
      const profile = await api.getDistrictProfile(district.id, timelineDays, true, locale);
      setSelectedDistrict(profile.district);
      setForecast(profile.forecast);
      setFeedReq(profile.feedRequirement);
      setRoute(profile.route);
      setAiBrief(profile.aiRecommendation);
    } catch (err) {
      console.error('Error fetching district profile:', err);
    }
  };

  if (showLanding) {
    return <LandingPage onEnter={handleEnterApp} />;
  }

  return (
    <div className={`gf-app-bg min-h-screen font-sans text-ink transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isLiveUpdating={isUpdating}
        onRefresh={handleRefresh}
        onGoHome={() => setShowLanding(true)}
        systemStatus={systemStatus}
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-critical/30 bg-critical-soft p-4 animate-fade-up">
            <span className="text-sm text-critical font-medium">{error}</span>
            <button 
              onClick={handleRefresh} 
              className="gf-btn !border-critical !text-critical hover:!bg-critical hover:!text-white"
            >
              {t.common.retry}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[32rem] flex-col items-center justify-center gap-6">
            {/* Premium loading animation */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-line" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-field animate-spin" />
              <div className="absolute inset-2 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-field animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-display text-xl font-bold tracking-tight text-ink">{t.app.loadingTitle}</p>
              <p className="text-sm text-muted">{t.app.loadingSubtitle}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <StatusBanner status={systemStatus} />
            </div>

            {activeTab === 'overview' && (
              <OverviewPage
                summary={summary}
                districts={districts}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={handleSelectDistrict}
                forecast={forecast}
                feedRequirement={feedReq}
                route={route}
                aiBrief={aiBrief}
                depots={depots}
                routes={routes}
                timelineDays={timelineDays}
                setTimelineDays={setTimelineDays}
                isLoading={isLoading}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'satellite' && (
              <SatellitePage
                districts={districts}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={handleSelectDistrict}
                forecast={forecast}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'climate' && <ClimatePage darkMode={darkMode} />}

            {activeTab === 'livestock' && (
              <LivestockPage districts={districts} timelineDays={timelineDays} darkMode={darkMode} />
            )}

            {activeTab === 'logistics' && (
              <LogisticsPage depots={depots} timelineDays={timelineDays} darkMode={darkMode} />
            )}

            {activeTab === 'brief' && (
              <AiBriefPage districts={districts} timelineDays={timelineDays} darkMode={darkMode} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 border-t border-line-subtle py-8 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">
                GeoForage<span className="text-field">AI</span>
              </p>
              <p className="mt-1 text-xs text-soft">
                {t.brand.footerTagline}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
              <span className="font-medium text-field">Sentinel-2</span>
              <span>·</span>
              <span className="font-medium text-sky">Open-Meteo</span>
              <span>·</span>
              <span className="font-medium text-signal">{t.brand.ensembleForecast}</span>
              <span>·</span>
              <span className="font-medium text-ok">{t.brand.cvrpRouting}</span>
              <span>·</span>
              <span className="font-medium text-critical">Gemini AI</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-line-subtle text-center text-[11px] text-soft">
            {t.brand.footerBuilt}
          </div>
        </div>
      </footer>
    </div>
  );
}
