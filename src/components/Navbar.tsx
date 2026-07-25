import React, { useState } from 'react';
import { 
  Activity, CloudSun, Compass, Database, Moon, Sun, 
  ShieldAlert, Cpu, RefreshCw, ChevronDown, Menu, X,
  Radar, Zap
} from 'lucide-react';
import { SystemStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isLiveUpdating: boolean;
  onRefresh: () => void;
  onGoHome?: () => void;
  systemStatus: SystemStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  isLiveUpdating,
  onRefresh,
  onGoHome,
  systemStatus,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Compass, description: 'Command center' },
    { id: 'satellite', label: 'Remote Sensing', icon: Activity, description: 'Satellite data' },
    { id: 'climate', label: 'Climate', icon: CloudSun, description: 'Weather intel' },
    { id: 'livestock', label: 'Livestock & Feed', icon: Database, description: 'Feed requirements' },
    { id: 'logistics', label: 'Logistics', icon: ShieldAlert, description: 'Route planning' },
    { id: 'brief', label: 'AI Brief', icon: Cpu, description: 'Executive summary' },
  ];

  const weatherLive = systemStatus?.services.weather.status === 'live';
  const satLive = systemStatus?.services.satellite.status === 'live';
  const geminiReady = systemStatus?.services.gemini.status === 'configured';

  return (
    <header className="sticky top-0 z-50 w-full print:hidden">
      {/* Top bar — Glass morphism */}
      <div className="relative">
        {/* Background blur */}
        <div className="absolute inset-0 bg-panel/70 backdrop-blur-xl border-b border-line-subtle" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between gap-4">
            {/* Logo & Brand */}
            <button
              type="button"
              onClick={onGoHome}
              className="group flex min-w-0 items-center gap-3 rounded-xl text-left transition-all duration-200 hover:bg-field-soft/50"
              title="Back to landing"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-field to-gradient-accent shadow-lg shadow-field/20 transition-transform group-hover:scale-105">
                <span className="font-display text-sm font-bold tracking-[0.15em] text-white">GF</span>
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-ok animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-1.5">
                  GeoForage
                  <span className="text-xs font-semibold text-field bg-field-soft/80 px-2 py-0.5 rounded-md">AI</span>
                </h1>
                <p className="hidden truncate text-xs text-muted sm:block font-medium">
                  Forage prediction & feed logistics
                </p>
              </div>
            </button>

            {/* Status indicators — Desktop */}
            <div className="hidden items-center gap-2 lg:flex">
              <StatusPill 
                icon={<Radar className="h-3 w-3" />} 
                label="Satellite" 
                live={!!satLive} 
              />
              <StatusPill 
                icon={<CloudSun className="h-3 w-3" />} 
                label="Weather" 
                live={!!weatherLive} 
              />
              <StatusPill 
                icon={<Zap className="h-3 w-3" />} 
                label="Gemini" 
                live={!!geminiReady} 
                amberWhenOff 
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={isLiveUpdating}
                className="group relative hidden sm:inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 border border-line-subtle bg-panel hover:bg-field-soft hover:border-field disabled:opacity-60"
                title="Refresh all data"
              >
                <RefreshCw className={`h-4 w-4 ${isLiveUpdating ? 'animate-spin text-signal' : 'text-muted group-hover:text-field'}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-line-subtle bg-panel transition-all duration-200 hover:bg-field-soft hover:border-field"
                aria-label="Toggle Theme"
              >
                {darkMode ? (
                  <Sun className="h-4.5 w-4.5 text-signal group-hover:text-field" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-sky group-hover:text-field" />
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-line-subtle bg-panel"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-ink" />
                ) : (
                  <Menu className="h-5 w-5 text-ink" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="relative border-b border-line-subtle bg-panel/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop nav */}
          <div className="no-scrollbar hidden lg:flex gap-1 overflow-x-auto py-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-field text-white shadow-lg shadow-field/25'
                      : 'text-muted hover:text-ink hover:bg-field-soft/70'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white/90' : 'text-soft group-hover:text-field'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile nav dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 space-y-1 border-t border-line-subtle mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-field text-white'
                        : 'text-muted hover:bg-field-soft hover:text-ink'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <span className="block font-semibold">{item.label}</span>
                      <span className={`text-xs ${isActive ? 'text-white/70' : 'text-soft'}`}>
                        {item.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

/* Status Pill Component */
function StatusPill({
  icon,
  label,
  live,
  amberWhenOff = false,
}: {
  icon: React.ReactNode;
  label: string;
  live: boolean;
  amberWhenOff?: boolean;
}) {
  return (
    <div className="gf-chip !rounded-full !py-1.5 !px-3">
      {icon}
      <span className={`relative flex h-2 w-2`}>
        {live && (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
          </>
        )}
        {!live && <span className="inline-block h-2 w-2 rounded-full bg-current opacity-50"></span>}
      </span>
      <span className="font-medium">
        {label} · <span className={live ? 'text-ok font-bold' : amberWhenOff ? 'text-signal' : 'text-muted'}>
          {live ? 'Live' : amberWhenOff ? 'Rules' : 'Modeled'}
        </span>
      </span>
    </div>
  );
}


