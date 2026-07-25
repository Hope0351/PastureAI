import React, { useState, useEffect } from 'react';
import { NdviChart } from '../components/NdviChart';
import { DistrictData, DistrictForecast, NdviRecord } from '../types';
import { Layers, Calendar, ShieldCheck, Database, Satellite, Radio, Sparkles } from 'lucide-react';
import axios from 'axios';

interface SatellitePageProps {
  districts: DistrictData[];
  selectedDistrict: DistrictData | null;
  setSelectedDistrict: (d: DistrictData) => void;
  forecast: DistrictForecast | null;
  darkMode?: boolean;
}

export const SatellitePage: React.FC<SatellitePageProps> = ({
  districts,
  selectedDistrict,
  setSelectedDistrict,
  forecast,
  darkMode = false,
}) => {
  const currentDistrict = selectedDistrict || districts[0];
  const [historical, setHistorical] = useState<NdviRecord[]>([]);
  const [satelliteMeta, setSatelliteMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentDistrict) return;

    const fetchSatelliteDetails = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/ndvi/${currentDistrict.id}`);
        setHistorical(res.data.historicalSeries || []);
        setSatelliteMeta(res.data);
      } catch (err) {
        console.error('Error loading satellite details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSatelliteDetails();
  }, [currentDistrict]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="gf-page-header">
        <div>
          <span className="gf-kicker">Remote Sensing</span>
          <h2 className="gf-title mt-2">Sentinel-2 vegetation intelligence</h2>
          <p className="gf-subtitle mt-3">
            Copernicus NDVI with weather assimilation. Live Earth Engine compute when credentials are configured for real-time analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Zone</span>
          <select
            value={currentDistrict?.id || ''}
            onChange={(e) => {
              const found = districts.find((d) => d.id === e.target.value);
              if (found) setSelectedDistrict(found);
            }}
            className="gf-input min-w-[180px]"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.region})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && <div className="gf-panel h-24 gf-skeleton rounded-2xl" />}

      {/* Data source status card */}
      {satelliteMeta && (
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
          satelliteMeta.dataSource === 'live'
            ? 'border-ok/30 bg-gradient-to-r from-ok-soft/60 to-field-soft/40'
            : 'border-signal/30 bg-gradient-to-r from-signal-soft/60 to-field-soft/40'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/4"
            style={{
              background: satelliteMeta.dataSource === 'live' ? 'var(--color-ok)' : 'var(--color-signal)'
            }}
          />
          
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`rounded-xl p-3 ${
                satelliteMeta.dataSource === 'live' ? 'bg-ok text-white' : 'bg-signal text-white'
              }`}>
                {satelliteMeta.dataSource === 'live' ? (
                  <Satellite className="h-6 w-6" />
                ) : (
                  <Radio className="h-6 w-6" />
                )}
              </div>
              
              <div>
                <p className="font-display text-lg font-bold text-ink flex items-center gap-2">
                  {satelliteMeta.dataSource === 'live' ? 'Live Google Earth Engine' : 'Weather-assimilated Model'}
                  <Sparkles className={`h-4 w-4 ${satelliteMeta.dataSource === 'live' ? 'text-ok' : 'text-signal'}`} />
                </p>
                <p className="mt-1 text-sm text-muted max-w-lg leading-relaxed">
                  {satelliteMeta.method ||
                    (satelliteMeta.dataSource === 'live'
                      ? 'Real-time GEE Sentinel-2 NDVI point reduction with cloud-free compositing.'
                      : 'District baselines fused with live Open-Meteo weather signals for accurate phenology modeling.')}
                </p>
              </div>
            </div>

            <span className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border ${
              satelliteMeta.dataSource === 'live'
                ? 'border-ok/30 bg-ok text-white'
                : 'border-signal/30 bg-signal text-white'
            }`}>
              {satelliteMeta.dataSource?.toUpperCase() || 'MODELED'}
            </span>
          </div>
        </div>
      )}

      {/* Meta cards grid */}
      {satelliteMeta && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetaCard
            icon={<Layers className="h-5 w-5" />}
            label="Sensor"
            value={satelliteMeta.sensor}
            tone="sky"
          />
          <MetaCard
            icon={<Calendar className="h-5 w-5" />}
            label="Composite Date"
            value={satelliteMeta.date}
            tone="signal"
          />
          <MetaCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Raw DN"
            value={`DN ${satelliteMeta.rawDigitalNumber ?? satelliteMeta.rawModisDigitalNumber}`}
            tone="field"
          />
          <MetaCard
            icon={<Database className="h-5 w-5" />}
            label="Mean NDVI"
            value={String(satelliteMeta.ndvi)}
            tone="sky"
            highlight
          />
        </div>
      )}

      {/* NDVI Chart */}
      <NdviChart
        districtName={currentDistrict?.name || 'Ethiopian Rangeland'}
        historical={historical}
        forecast={forecast}
        darkMode={darkMode}
      />

      {/* Zone comparison table */}
      <div className="gf-panel overflow-hidden">
        <div className="p-5 pb-4 border-b border-line-subtle">
          <h3 className="font-display text-lg font-bold tracking-tight text-ink flex items-center gap-2">
            <Database className="h-5 w-5 text-field" />
            Zone Vegetation Comparison
          </h3>
          <p className="text-sm text-muted mt-1">Click any row to view detailed NDVI history</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="gf-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Region</th>
                <th>NDVI</th>
                <th>VHI</th>
                <th>Forage Index</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDistrict(d)}
                  className={`cursor-pointer transition-colors ${
                    currentDistrict?.id === d.id 
                      ? 'bg-field-soft font-semibold' 
                      : 'hover:bg-canvas'
                  }`}
                >
                  <td>
                    <span className="font-semibold text-ink">{d.name}</span>
                    {currentDistrict?.id === d.id && (
                      <span className="ml-2 text-[10px] text-field uppercase tracking-wider font-bold">Active</span>
                    )}
                  </td>
                  <td className="text-muted">{d.region}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-field tabular-nums">
                      {d.currentNdvi.toFixed(3)}
                      <span className={`w-2 h-2 rounded-full ${
                        d.currentNdvi >= 0.4 ? 'bg-ok' : d.currentNdvi >= 0.25 ? 'bg-signal' : 'bg-critical'
                      }`} />
                    </span>
                  </td>
                  <td>
                    <span className="tabular-nums">{d.vegetationHealthIndex}<span className="text-muted">/100</span></span>
                  </td>
                  <td>
                    <span className="tabular-nums">{d.forageConditionIndex}<span className="text-muted">/100</span></span>
                  </td>
                  <td>
                    <span className={
                      d.riskLevel === 'Critical'
                        ? 'gf-badge-critical'
                        : d.riskLevel === 'Warning'
                          ? 'gf-badge-warn'
                          : 'gf-badge-ok'
                    }>
                      {d.riskLevel}
                    </span>
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

function MetaCard({
  icon,
  label,
  value,
  tone,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`gf-panel relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
      highlight ? 'gf-border-animated' : ''
    }`}>
      {(highlight) && (
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-field/10" />
      )}
      
      <div className="p-4 relative">
        <span className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted`}>
          <span className={`rounded-lg p-1.5 bg-${tone}-soft text-${tone}`}>{icon}</span>
          {label}
        </span>
        <div className={`truncate text-base font-bold ${tone ? `text-${tone}` : 'text-ink'} tabular-nums`} title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}
