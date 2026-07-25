import React, { useState, useEffect } from 'react';
import { WeatherChart } from '../components/WeatherChart';
import { WeatherData } from '../types';
import { Thermometer, Wind, Droplets, AlertTriangle, CloudSun, CloudRain, Sun, Cloud } from 'lucide-react';
import axios from 'axios';

interface ClimatePageProps {
  darkMode?: boolean;
}

const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('shower')) return <CloudRain className="h-5 w-5" />;
  if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="h-5 w-5" />;
  if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-5 w-5" />;
  return <CloudSun className="h-5 w-5" />;
};

export const ClimatePage: React.FC<ClimatePageProps> = ({ darkMode = false }) => {
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await axios.get('/api/weather');
        setWeatherList(res.data);
      } catch (err) {
        console.error('Error fetching Open-Meteo climate data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const liveCount = weatherList.filter((w) => w.dataSource === 'live').length;
  const allLive = weatherList.length > 0 && liveCount === weatherList.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="gf-page-header">
        <div>
          <span className="gf-kicker">Climate Intelligence</span>
          <h2 className="gf-title mt-2">Meteorology for rangelands</h2>
          <p className="gf-subtitle mt-3">
            Real-time rainfall, temperature, humidity, and drought severity indices powered by Open-Meteo global coverage.
          </p>
        </div>

        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 border ${
          allLive 
            ? 'border-ok/30 bg-ok-soft' 
            : 'border-signal/30 bg-signal-soft'
        }`}>
          <span className={`relative flex h-3 w-3 ${allLive ? 'text-ok' : 'text-signal'}`}>
            {allLive && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-panel bg-current"></span>
              </>
            )}
            {!allLive && <span className="inline-block h-3 w-3 rounded-full border-2 border-panel bg-current"></span>}
          </span>
          <div>
            <p className={`text-sm font-bold ${allLive ? 'text-ok' : 'text-signal'}`}>
              {isLoading ? 'Connecting…' : allLive ? 'All Systems Live' : `${liveCount}/${weatherList.length} Live`}
            </p>
            <p className="text-[11px] text-muted">Open-Meteo API</p>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="gf-panel h-64 gf-skeleton rounded-2xl" />
      )}

      {/* Weather chart */}
      {!isLoading && <WeatherChart weatherList={weatherList} darkMode={darkMode} />}

      {/* Weather cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {weatherList.map((w) => (
          <div 
            key={w.districtId} 
            className="gf-panel group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {/* Card header with gradient accent */}
            <div className="relative p-5 pb-4">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky to-field opacity-60" />
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">{w.districtName}</h3>
                  <p className="mt-0.5 text-xs text-muted">{w.region || 'Ethiopia'}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`${w.dataSource === 'live' ? 'bg-ok-soft text-ok' : 'bg-signal-soft text-signal'} rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide`}>
                    {w.dataSource === 'live' ? '● Live' : '○ Fallback'}
                  </span>
                  <div className="rounded-xl bg-sky-soft p-2.5 text-sky">
                    {getWeatherIcon(w.weatherCondition)}
                  </div>
                </div>
              </div>

              {/* Weather condition badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-muted">
                {getWeatherIcon(w.weatherCondition)}
                {w.weatherCondition}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <ClimateMetric
                  icon={<Droplets className="h-4 w-4 text-sky" />}
                  label="7-Day Rainfall"
                  value={`${w.rainfall7DaySum}`}
                  unit="mm"
                  tone="sky"
                />
                <ClimateMetric
                  icon={<Thermometer className="h-4 w-4 text-signal" />}
                  label="Temperature"
                  value={`${w.currentTemp}°C`}
                  hint={`Max: ${w.maxTemp}°C`}
                  tone="signal"
                />
                <ClimateMetric
                  icon={<Wind className="h-4 w-4 text-muted" />}
                  label="Humidity"
                  value={`${w.relativeHumidity}`}
                  unit="%"
                />
                <ClimateMetric
                  icon={<AlertTriangle className="h-4 w-4 text-critical" />}
                  label="Drought Index"
                  value={`${w.droughtSeverityIndex}`}
                  unit="/100"
                  tone="critical"
                  warning={w.droughtSeverityIndex > 60}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function ClimateMetric({
  icon,
  label,
  value,
  unit,
  hint,
  tone,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: string;
  warning?: boolean;
}) {
  return (
    <div className={`relative rounded-xl border p-3 transition-colors group ${
      warning 
        ? 'border-critical/30 bg-critical-soft/40' 
        : 'border-line-subtle bg-canvas hover:border-line'
    }`}>
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted">
        {icon}
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-xl font-bold tabular-nums ${tone ? `text-${tone}` : 'text-ink'}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-soft">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-[10px] text-soft">{hint}</p>}
      
      {/* Warning indicator */}
      {warning && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-critical animate-pulse" />
      )}
    </div>
  );
}
