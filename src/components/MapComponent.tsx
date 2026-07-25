import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { DistrictData, FeedDepot, OptimizedRoute } from '../types';
import { Layers, Compass, Maximize2, Locate, Satellite, Map as MapIcon, Sun, Moon, Navigation, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet marker icon issue in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Feed Depot Icon - Premium styled
const depotIcon = new L.DivIcon({
  className: 'custom-depot-icon',
  html: `<div style="
    background: linear-gradient(135deg, #1e6b42 0%, #15803d 100%);
    border: 2px solid rgba(255,255,255,0.3);
    width: 28px; height: 28px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(30,107,66,0.4), 0 0 20px rgba(30,107,66,0.15);
    animation: depotPulse 2s ease-in-out infinite;
  ">
    <span style="color: white; font-size: 12px; font-weight: 700; font-family: Inter, sans-serif;">D</span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Custom Critical Zone Marker
const criticalZoneIcon = new L.DivIcon({
  className: 'critical-zone-marker',
  html: `<div style="
    width: 16px; height: 16px;
    background: radial-gradient(circle, #f87171 0%, #dc2626 70%, transparent 100%);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(248,113,113,0.6), 0 0 40px rgba(248,113,113,0.3);
    animation: criticalPulse 1.5s ease-in-out infinite;
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MapComponentProps {
  districts: DistrictData[];
  selectedDistrict: DistrictData | null;
  onSelectDistrict: (district: DistrictData) => void;
  depots: FeedDepot[];
  routes: OptimizedRoute[];
  timelineDays: number;
  darkMode?: boolean;
}

// Map Basemap Options
type BasemapType = 'voyager' | 'satellite' | 'sentinel2' | 'positron' | 'dark' | 'terrain';

const BASEMAP_TILES: Record<BasemapType, { url: string; attribution: string; name: string; icon: React.ReactNode }> = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: 'Voyager',
    icon: <MapIcon className="h-3.5 w-3.5" />,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA',
    name: 'Satellite',
    icon: <Satellite className="h-3.5 w-3.5" />,
  },
  sentinel2: {
    url: '',
    attribution: 'Copernicus Sentinel-2 via Google Earth Engine',
    name: 'Sentinel-2',
    icon: <Sun className="h-3.5 w-3.5" />,
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: 'Light',
    icon: <Sun className="h-3.5 w-3.5" />,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: 'Dark',
    icon: <Moon className="h-3.5 w-3.5" />,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    name: 'Terrain',
    icon: <Navigation className="h-3.5 w-3.5" />,
  },
};

// Helper component to center map on selection with smooth animation
const MapRecenter: React.FC<{ selectedDistrict: DistrictData | null }> = ({ selectedDistrict }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedDistrict) {
      map.flyTo([selectedDistrict.latitude, selectedDistrict.longitude], 7, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [selectedDistrict, map]);
  
  return null;
};

// Component to handle zoom to user location
const LocationControl: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const map = useMap();
  
  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: 10 });
  }, [map]);
  
  return (
    <button
      onClick={handleLocate}
      className={`gf-map-control-btn ${darkMode ? 'dark' : ''}`}
      title="Center on Ethiopia"
      style={{
        position: 'absolute',
        left: '12px',
        bottom: '80px',
        zIndex: 1000,
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: darkMode ? 'rgba(19, 28, 22, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 107, 66, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      <Locate className={`h-4 w-4 ${darkMode ? 'text-[#4ade80]' : 'text-[#1e6b42]'}`} />
    </button>
  );
};

// Fullscreen toggle control
const FullscreenControl: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  
  return (
    <button
      onClick={toggleFullscreen}
      className={`gf-map-control-btn ${darkMode ? 'dark' : ''}`}
      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      style={{
        position: 'absolute',
        left: '12px',
        bottom: '38px',
        zIndex: 1000,
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: darkMode ? 'rgba(19, 28, 22, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 107, 66, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      <Maximize2 className={`h-4 w-4 ${darkMode ? 'text-[#4ade80]' : 'text-[#1e6b42]'}`} />
    </button>
  );
};

// Coordinate Display Bar
const CoordDisplay: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const map = useMap();
  const [coords, setCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 9.145,
    lng: 40.4896,
    zoom: 6,
  });
  
  useEffect(() => {
    const updateCoords = () => {
      const center = map.getCenter();
      setCoords({
        lat: parseFloat(center.lat.toFixed(4)),
        lng: parseFloat(center.lng.toFixed(4)),
        zoom: map.getZoom(),
      });
    };
    
    map.on('moveend', updateCoords);
    map.on('zoomend', updateCoords);
    
    return () => {
      map.off('moveend', updateCoords);
      map.off('zoomend', updateCoords);
    };
  }, [map]);
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        padding: '6px 14px',
        borderRadius: '999px',
        background: darkMode ? 'rgba(19, 28, 22, 0.9)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'}`,
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        color: darkMode ? '#94a89a' : '#4a5f52',
        display: 'flex',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: darkMode ? '#4ade80' : '#1e6b42' }}>LAT</span>
        {coords.lat}°
      </span>
      <span style={{ 
        width: '1px', 
        height: '12px', 
        background: darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)' 
      }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: darkMode ? '#60a5fa' : '#2563a3' }}>LNG</span>
        {coords.lng}°
      </span>
      <span style={{ 
        width: '1px', 
        height: '12px', 
        background: darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)' 
      }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: darkMode ? '#fbbf24' : '#c47a1c' }}>ZM</span>
        {coords.zoom}
      </span>
    </div>
  );
};

export const MapComponent: React.FC<MapComponentProps> = ({
  districts,
  selectedDistrict,
  onSelectDistrict,
  depots,
  routes,
  timelineDays,
  darkMode = true,
}) => {
  // Center of Ethiopia: [9.145, 40.4896]
  const ethiopiaCenter: [number, number] = [9.145, 40.4896];

  // Selected Basemap Style state
  const [basemap, setBasemap] = useState<BasemapType>(darkMode ? 'dark' : 'voyager');
  const [userChoseBasemap, setUserChoseBasemap] = useState(false);
  const [sentinel2Loading, setSentinel2Loading] = useState(false);
  const [sentinel2Error, setSentinel2Error] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const sentinel2Url = '/api/map/sentinel2/tiles/rgb/{z}/{x}/{y}';

  // Sync basemap if user switches global dark mode
  useEffect(() => {
    if (!userChoseBasemap) {
      setBasemap(darkMode ? 'dark' : 'voyager');
    }
  }, [darkMode, userChoseBasemap]);

  // Warm Earth Engine map id in background
  useEffect(() => {
    if (basemap !== 'sentinel2') {
      setSentinel2Loading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setSentinel2Loading(true);
      setSentinel2Error(null);
      try {
        await api.getSentinel2MapTiles('rgb');
      } catch (err) {
        console.error('Failed to warm Sentinel-2 map tiles:', err);
        if (!cancelled) {
          setSentinel2Error('Sentinel-2 unavailable');
          setBasemap('satellite');
        }
      } finally {
        if (!cancelled) setSentinel2Loading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [basemap]);

  // Simulate map loaded state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const selectBasemap = (next: BasemapType) => {
    setUserChoseBasemap(true);
    setBasemap(next);
  };

  // Dynamic color calculation based on risk level with enhanced palette
  const getDistrictColor = (district: DistrictData) => {
    if (district.riskLevel === 'Critical') return '#ef4444';
    if (district.riskLevel === 'Warning') return '#f59e0b';
    return '#22c55e';
  };

  const getDistrictGlowColor = (district: DistrictData) => {
    if (district.riskLevel === 'Critical') return 'rgba(239, 68, 68, 0.35)';
    if (district.riskLevel === 'Warning') return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(34, 197, 94, 0.25)';
  };

  // Enhanced district styling with hover and selection states
  const districtStyle = (district: DistrictData) => {
    const isSelected = selectedDistrict?.id === district.id;
    const isHovered = hoveredDistrict === district.id;
    const color = getDistrictColor(district);
    const glowColor = getDistrictGlowColor(district);
    const imageryMode = basemap === 'sentinel2' || basemap === 'satellite';

    return {
      fillColor: color,
      weight: isSelected ? 4 : isHovered ? 3.5 : imageryMode ? 1.5 : 2,
      opacity: isSelected ? 1 : isHovered ? 0.95 : 0.85,
      color: isSelected ? '#38bdf8' : isHovered ? '#60a5fa' : imageryMode ? '#f8fafc' : darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(13,31,23,0.5)',
      dashArray: isSelected ? '' : imageryMode ? '' : '3,3',
      fillOpacity: isSelected 
        ? 0.65 
        : isHovered 
          ? 0.55 
          : basemap === 'sentinel2' 
            ? 0.12 
            : imageryMode 
              ? 0.22 
              : 0.45,
      // Add glow effect via CSS filter would be ideal, but we use shadow-like approach
    };
  };

  const activeTile = {
    ...BASEMAP_TILES[basemap],
    url: basemap === 'sentinel2' ? sentinel2Url : BASEMAP_TILES[basemap].url,
  };
  const underlayUrl = BASEMAP_TILES.positron.url;

  // Calculate quick stats for the status bar
  const criticalCount = districts.filter(d => d.riskLevel === 'Critical').length;
  const warningCount = districts.filter(d => d.riskLevel === 'Warning').length;
  const healthyCount = districts.filter(d => d.riskLevel === 'Healthy').length;

  return (
    <div 
      className="gf-map-container relative overflow-hidden"
      style={{
        height: '520px',
        width: '100%',
        borderRadius: '1.25rem',
        position: 'relative',
        background: darkMode 
          ? 'linear-gradient(135deg, #0d1f17 0%, #132a1f 50%, #0f2118 100%)'
          : 'linear-gradient(135deg, #f4f6f3 0%, #eef2ee 50%, #f0f4f0 100%)',
        border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.9)'}`,
        boxShadow: darkMode 
          ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(74, 222, 128, 0.05), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 8px 32px -8px rgba(13, 31, 23, 0.12), 0 0 0 1px rgba(30, 107, 66, 0.05)',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = darkMode 
          ? '0 12px 40px -8px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(74, 222, 128, 0.1), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 12px 40px -8px rgba(13, 31, 23, 0.18), 0 0 60px -15px rgba(30, 107, 66, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = darkMode 
          ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(74, 222, 128, 0.05), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 8px 32px -8px rgba(13, 31, 23, 0.12), 0 0 0 1px rgba(30, 107, 66, 0.05)';
      }}
    >
      {/* Animated gradient border effect */}
      <div
        style={{
          position: 'absolute',
          inset: '-1px',
          borderRadius: '1.275rem',
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(30,107,66,0.3), rgba(37,99,163,0.2), rgba(196,122,28,0.2), rgba(30,107,66,0.3))',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 8s ease infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 10,
          opacity: 0.6,
        }}
      />

      {/* Loading skeleton overlay */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: darkMode ? 'rgba(10, 18, 14, 0.95)' : 'rgba(244, 246, 243, 0.95)',
            borderRadius: '1.25rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${darkMode ? '#1a3328' : '#e8f5ec'}, ${darkMode ? '#0d2818' : '#d4ede0'})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulseRing 2s ease-in-out infinite',
              }}
            >
              <Satellite className={`w-6 h-6 ${darkMode ? 'text-[#4ade80]' : 'text-[#1e6b42]'}`} />
            </div>
            <p style={{
              fontSize: '13px',
              fontWeight: 600,
              color: darkMode ? '#94a89a' : '#4a5f52',
              marginBottom: '4px',
            }}>
              Loading Intelligence Layer
            </p>
            <p style={{
              fontSize: '11px',
              color: darkMode ? '#6a7a6c' : '#7a8f7e',
            }}>
              Rendering {districts.length} zones · {routes.length} routes
            </p>
          </div>
        </div>
      )}

      <MapContainer
        center={ethiopiaCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="z-0 h-full w-full"
        style={{ 
          background: darkMode ? '#0d1f17' : '#eef2ee',
          borderRadius: '1.25rem',
        }}
        zoomControl={false}
      >
        <MapRecenter selectedDistrict={selectedDistrict} />
        
        {/* Custom Zoom Control Position */}
        <ZoomControl position="topright" />

        {/* Light underlay for Sentinel-2 */}
        {basemap === 'sentinel2' && (
          <TileLayer
            key="sentinel2-underlay"
            url={underlayUrl}
            attribution={BASEMAP_TILES.positron.attribution}
            maxZoom={18}
            opacity={1}
          />
        )}

        {/* Dynamic Basemap Tile Layer */}
        {activeTile.url ? (
          <TileLayer
            key={`${basemap}-${activeTile.url}`}
            attribution={activeTile.attribution}
            url={activeTile.url}
            maxZoom={18}
            maxNativeZoom={basemap === 'sentinel2' ? 13 : 19}
            opacity={1}
            detectRetina={basemap === 'sentinel2' ? false : undefined}
            eventHandlers={
              basemap === 'sentinel2'
                ? {
                    tileerror: (ctx) => {
                      const img = ctx.tile as HTMLImageElement;
                      if (img && !img.dataset.retried) {
                        img.dataset.retried = '1';
                        const base = img.src.split('?')[0];
                        setTimeout(() => {
                          img.src = '';
                          img.src = `${base}?r=${Date.now()}`;
                        }, 2000);
                      }
                    },
                  }
                : undefined
            }
          />
        ) : null}

        {/* District Boundary Polygons */}
        {districts.map((district) => (
          <GeoJSON
            key={`${district.id}-${district.riskLevel}-${timelineDays}-${basemap}`}
            data={district.geoJson as any}
            style={() => districtStyle(district)}
            eventHandlers={{
              click: () => onSelectDistrict(district),
              mouseover: () => setHoveredDistrict(district.id),
              mouseout: () => setHoveredDistrict(null),
            }}
          >
            {/* Permanent District Name Tooltip */}
            <Tooltip
              permanent
              direction="center"
              className="district-tooltip-premium"
              offset={[0, 0]}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 0',
              }}>
                {district.riskLevel === 'Critical' && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                    animation: 'criticalPulse 1.5s ease-in-out infinite',
                  }} />
                )}
                <span style={{
                  fontWeight: 700,
                  fontSize: '11px',
                  textShadow: darkMode 
                    ? '0 1px 3px rgba(0,0,0,0.5)' 
                    : '0 1px 3px rgba(255,255,255,0.8)',
                }}>
                  {district.name}
                </span>
              </div>
            </Tooltip>

            {/* Enhanced Popup */}
            <Popup
              maxWidth={280}
              className="district-popup-premium"
            >
              <div style={{
                padding: '4px 0',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  marginBottom: '10px',
                  borderBottom: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.9)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: district.riskLevel === 'Critical' 
                        ? 'linear-gradient(135deg, #fecaca, #fca5a5)'
                        : district.riskLevel === 'Warning'
                          ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                          : 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <AlertCircle style={{
                        width: '16px',
                        height: '16px',
                        color: district.riskLevel === 'Critical' 
                          ? '#dc2626'
                          : district.riskLevel === 'Warning'
                            ? '#d97706'
                            : '#16a34a',
                      }} />
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: darkMode ? '#eef2ee' : '#0d1f17',
                        lineHeight: 1.2,
                      }}>
                        {district.name}
                      </h3>
                      <p style={{
                        fontSize: '11px',
                        color: darkMode ? '#6a7a6c' : '#7a8f7e',
                      }}>
                        {district.region}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: district.riskLevel === 'Critical' 
                      ? 'rgba(239, 68, 68, 0.1)'
                      : district.riskLevel === 'Warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(34, 197, 94, 0.1)',
                    color: district.riskLevel === 'Critical' 
                      ? '#ef4444'
                      : district.riskLevel === 'Warning'
                        ? '#f59e0b'
                        : '#22c55e',
                    border: `1px solid ${
                      district.riskLevel === 'Critical' 
                        ? 'rgba(239, 68, 68, 0.2)'
                        : district.riskLevel === 'Warning'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(34, 197, 94, 0.2)'
                    }`,
                  }}>
                    {district.riskLevel}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: darkMode ? 'rgba(19, 28, 22, 0.5)' : 'rgba(244, 246, 243, 0.8)',
                    border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.3)' : 'rgba(226, 232, 224, 0.7)'}`,
                  }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: darkMode ? '#6a7a6c' : '#7a8f7e',
                      marginBottom: '4px',
                    }}>
                      NDVI Index
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      color: darkMode ? '#4ade80' : '#1e6b42',
                    }}>
                      {district.currentNdvi.toFixed(3)}
                    </p>
                  </div>
                  <div style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: darkMode ? 'rgba(19, 28, 22, 0.5)' : 'rgba(244, 246, 243, 0.8)',
                    border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.3)' : 'rgba(226, 232, 224, 0.7)'}`,
                  }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: darkMode ? '#6a7a6c' : '#7a8f7e',
                      marginBottom: '4px',
                    }}>
                      Livestock (TLU)
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      color: darkMode ? '#60a5fa' : '#2563a3',
                    }}>
                      {district.livestock.totalTLU.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Weather Info */}
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: darkMode ? 'rgba(37, 99, 163, 0.08)' : 'rgba(37, 99, 163, 0.05)',
                  border: `1px solid ${darkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 163, 0.1)'}`,
                  marginBottom: '12px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}>
                    <span style={{ color: darkMode ? '#94a89a' : '#4a5f52' }}>
                      <strong>Weather:</strong> {district.weather.weatherCondition}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      color: darkMode ? '#60a5fa' : '#2563a3',
                    }}>
                      {district.weather.currentTemp}°C
                    </span>
                  </div>
                  <div style={{
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: darkMode ? '#6a7a6c' : '#7a8f7e',
                  }}>
                    <span>Drought Index</span>
                    <span style={{
                      fontWeight: 600,
                      color: district.weather.droughtSeverityIndex > 60 
                        ? '#ef4444' 
                        : district.weather.droughtSeverityIndex > 30 
                          ? '#f59e0b' 
                          : '#22c55e',
                    }}>
                      {district.weather.droughtSeverityIndex}/100
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onSelectDistrict(district)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: darkMode 
                      ? 'linear-gradient(135deg, #1e6b42, #15803d)' 
                      : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(30, 107, 66, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 107, 66, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 107, 66, 0.3)';
                  }}
                >
                  View Full Intelligence →
                </button>
              </div>
            </Popup>
          </GeoJSON>
        ))}

        {/* Feed Depots Markers */}
        {depots.map((depot) => (
          <Marker 
            key={depot.id} 
            position={[depot.latitude, depot.longitude]} 
            icon={depotIcon}
          >
            <Popup maxWidth={260}>
              <div style={{ padding: '4px 0' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '10px',
                  marginBottom: '10px',
                  borderBottom: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.9)'}`,
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1e6b42, #15803d)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(30, 107, 66, 0.3)',
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 700,
                    }}>D</span>
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: darkMode ? '#eef2ee' : '#0d1f17',
                      lineHeight: 1.2,
                    }}>
                      {depot.name}
                    </h4>
                    <p style={{
                      fontSize: '11px',
                      color: darkMode ? '#6a7a6c' : '#7a8f7e',
                    }}>
                      {depot.location}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: darkMode ? 'rgba(30, 107, 66, 0.08)' : 'rgba(30, 107, 66, 0.05)',
                  border: `1px solid ${darkMode ? 'rgba(74, 222, 128, 0.15)' : 'rgba(30, 107, 66, 0.1)'}`,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: darkMode ? '#94a89a' : '#4a5f52',
                    }}>
                      Stock Available
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      color: darkMode ? '#4ade80' : '#1e6b42',
                    }}>
                      {depot.availableStockTons.toLocaleString()} / {depot.capacityTons.toLocaleString()} T
                    </span>
                  </div>
                  
                  {/* Stock level bar */}
                  <div style={{
                    height: '6px',
                    borderRadius: '999px',
                    background: darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.9)',
                    overflow: 'hidden',
                    marginBottom: '10px',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(depot.availableStockTons / depot.capacityTones) * 100}%`,
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                      boxShadow: '0 0 8px rgba(74, 222, 128, 0.4)',
                    }} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '11px',
                  }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: darkMode ? 'rgba(19, 28, 22, 0.5)' : 'rgba(244, 246, 243, 0.8)',
                    }}>
                      <p style={{ color: darkMode ? '#6a7a6c' : '#7a8f7e', marginBottom: '2px' }}>Heavy 20T</p>
                      <p style={{ fontWeight: 700, color: darkMode ? '#eef2ee' : '#0d1f17' }}>
                        {depot.trucksAvailable.heavyTransports20T} trucks
                      </p>
                    </div>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: darkMode ? 'rgba(19, 28, 22, 0.5)' : 'rgba(244, 246, 243, 0.8)',
                    }}>
                      <p style={{ color: darkMode ? '#6a7a6c' : '#7a8f7e', marginBottom: '2px' }}>Off-Road 10T</p>
                      <p style={{ fontWeight: 700, color: darkMode ? '#eef2ee' : '#0d1f17' }}>
                        {depot.trucksAvailable.offRoadTrucks10T} trucks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Feed Delivery Route Lines with Animation */}
        {routes.map((route) => {
          const positions = route.geoJsonPolyline.geometry.coordinates.map(
            (coord) => [coord[1], coord[0]] as [number, number]
          );
          const isSelectedRoute = selectedDistrict?.id === route.targetDistrictId;

          return (
            <Polyline
              key={route.routeId}
              positions={positions}
              pathOptions={{
                color: route.geoJsonPolyline.properties.color,
                weight: isSelectedRoute ? 5 : 3.5,
                opacity: isSelectedRoute ? 0.95 : 0.75,
                dashArray: isSelectedRoute ? '12, 8' : '8, 6',
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                mouseover: (e) => {
                  if (e.target) {
                    e.target.setStyle({ weight: e.target.options.weight + 2, opacity: 1 });
                  }
                },
                mouseout: (e) => {
                  if (e.target) {
                    e.target.setStyle({
                      weight: isSelectedRoute ? 5 : 3.5,
                      opacity: isSelectedRoute ? 0.95 : 0.75,
                    });
                  }
                },
              }}
            >
              <Popup maxWidth={250}>
                <div style={{ padding: '4px 0' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingBottom: '10px',
                    marginBottom: '10px',
                    borderBottom: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.9)'}`,
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2563a3, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Navigation style={{ width: '16px', height: '16px', color: 'white' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: darkMode ? '#eef2ee' : '#0d1f17',
                      }}>
                        Delivery Corridor
                      </p>
                      <p style={{
                        fontSize: '11px',
                        color: darkMode ? '#6a7a6c' : '#7a8f7e',
                      }}>
                        {route.depotName} → {route.targetDistrictName}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '10px',
                  }}>
                    <div style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: darkMode ? 'rgba(19, 28, 22, 0.5)' : 'rgba(244, 246, 243, 0.8)',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '10px', color: darkMode ? '#6a7a6c' : '#7a8f7e', marginBottom: '4px' }}>Cargo</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: darkMode ? '#fbbf24' : '#c47a1c' }}>
                        {route.allocatedFeedTons}T
                      </p>
                    </div>
                    <div style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: darkMode ? 'rgba(19, 28, 22, 0.5)' : 'rgba(244, 246, 243, 0.8)',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '10px', color: darkMode ? '#6a7a6c' : '#7a8f7e', marginBottom: '4px' }}>Distance</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: darkMode ? '#60a5fa' : '#2563a3' }}>
                        {route.distanceKm}km
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: darkMode ? 'rgba(37, 99, 163, 0.08)' : 'rgba(37, 99, 163, 0.05)',
                  }}>
                    <span style={{ color: darkMode ? '#94a89a' : '#4a5f52' }}>
                      Duration: <strong>{route.estimatedTimeHours}h</strong>
                    </span>
                    <span style={{ color: darkMode ? '#94a89a' : '#4a5f52' }}>
                      Truck: <strong>{route.assignedTruckType}</strong>
                    </span>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Map Controls */}
        <LocationControl darkMode={darkMode} />
        <FullscreenControl darkMode={darkMode} />
        <CoordDisplay darkMode={darkMode} />
      </MapContainer>

      {/* Premium Basemap Switcher - Top Right */}
      <div 
        style={{
          position: 'absolute',
          right: '12px',
          top: '12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px',
          borderRadius: '14px',
          background: darkMode ? 'rgba(19, 28, 22, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255,255,255,0.05) inset',
          overflow: 'hidden',
        }}>
          <span style={{
            display: 'none',
            alignItems: 'center',
            gap: '5px',
            padding: '0 8px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: darkMode ? '#4ade80' : '#1e6b42',
          }}
          className="hidden sm:flex"
          >
            <Layers style={{ width: '12px', height: '12px' }} />
            Layer
          </span>
          
          {(
            [
              ['voyager', 'Voyager'],
              ['satellite', 'Satellite'],
              ['sentinel2', sentinel2Loading && basemap === 'sentinel2' ? 'S2…' : 'S-2'],
              ['terrain', 'Terrain'],
              ['positron', 'Light'],
              ['dark', 'Dark'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => selectBasemap(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                background: basemap === key 
                  ? (darkMode ? 'rgba(74, 222, 128, 0.15)' : 'rgba(30, 107, 66, 0.1)')
                  : 'transparent',
                color: basemap === key 
                  ? (darkMode ? '#4ade80' : '#1e6b42')
                  : (darkMode ? '#94a89a' : '#4a5f52'),
                border: basemap === key 
                  ? `1px solid ${darkMode ? 'rgba(74, 222, 128, 0.3)' : 'rgba(30, 107, 66, 0.2)'}`
                  : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (basemap !== key) {
                  e.currentTarget.style.background = darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(244, 246, 243, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (basemap !== key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {BASEMAP_TILES[key].icon}
              {label}
            </button>
          ))}
        </div>

        {/* Status messages */}
        {sentinel2Loading && basemap === 'sentinel2' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(30, 58, 138, 0.9)' : 'rgba(239, 246, 252, 0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${darkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(147, 197, 253, 0.5)'}`,
            fontSize: '11px',
            fontWeight: 500,
            color: darkMode ? '#93c5fd' : '#2563a3',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: `2px solid ${darkMode ? '#60a5fa' : '#2563a3'}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            Loading Sentinel-2 imagery…
          </div>
        )}
        
        {sentinel2Error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(120, 53, 15, 0.9)' : 'rgba(254, 243, 199, 0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${darkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(252, 211, 77, 0.5)'}`,
            fontSize: '11px',
            fontWeight: 500,
            color: darkMode ? '#fbbf24' : '#c47a1c',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            {sentinel2Error} — showing fallback
          </div>
        )}
      </div>

      {/* Enhanced Legend Panel - Bottom Left */}
      <div
        style={{
          position: 'absolute',
          left: '12px',
          bottom: '52px',
          zIndex: 1000,
          width: '200px',
          borderRadius: '14px',
          background: darkMode ? 'rgba(19, 28, 22, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255,255,255,0.05) inset',
          overflow: 'hidden',
        }}
      >
        {/* Legend Header */}
        <div style={{
          padding: '12px 14px 10px',
          borderBottom: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.8)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #1e6b42, #15803d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Compass style={{ width: '11px', height: '11px', color: 'white' }} />
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: darkMode ? '#eef2ee' : '#0d1f17',
            }}>
              Risk Scale
            </span>
          </div>
          <span style={{
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: darkMode ? '#6a7a6c' : '#7a8f7e',
            padding: '3px 7px',
            borderRadius: '6px',
            background: darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(244, 246, 243, 0.9)',
          }}>
            {activeTile.name}
          </span>
        </div>

        {/* Legend Items */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Risk Levels */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(34, 197, 94, 0.06)' : 'rgba(34, 197, 94, 0.04)',
            border: `1px solid ${darkMode ? 'rgba(74, 222, 128, 0.1)' : 'rgba(34, 197, 94, 0.1)'}`,
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              background: '#22c55e',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: darkMode ? '#d4e5d9' : '#166534',
              flex: 1,
            }}>
              Healthy pasture
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: darkMode ? '#4ade80' : '#16a34a',
            }}>
              {healthyCount}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.04)',
            border: `1px solid ${darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              background: '#f59e0b',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: darkMode ? '#fef3c7' : '#92400e',
              flex: 1,
            }}>
              Stress / warning
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: darkMode ? '#fbbf24' : '#d97706',
            }}>
              {warningCount}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.04)',
            border: `1px solid ${darkMode ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              background: '#ef4444',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                inset: '-3px',
                borderRadius: '6px',
                background: 'inherit',
                opacity: 0.3,
                animation: 'criticalPulse 1.5s ease-in-out infinite',
              }} />
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: darkMode ? '#fecaca' : '#991b1b',
              flex: 1,
            }}>
              Critical deficit
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: darkMode ? '#f87171' : '#dc2626',
            }}>
              {criticalCount}
            </span>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.8)',
            margin: '4px 0',
          }} />

          {/* Depot & Routes */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 10px',
          }}>
            <span style={{
              width: '18px',
              height: '18px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #1e6b42, #15803d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(30, 107, 66, 0.3)',
            }}>
              <span style={{
                color: 'white',
                fontSize: '9px',
                fontWeight: 700,
              }}>D</span>
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: darkMode ? '#94a89a' : '#4a5f52',
            }}>
              Feed depot
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 10px',
          }}>
            <span style={{
              width: '20px',
              height: '3px',
              borderRadius: '2px',
              background: 'repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 6px, transparent 6px, transparent 10px)',
              boxShadow: '0 0 6px rgba(245, 158, 11, 0.3)',
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: darkMode ? '#94a89a' : '#4a5f52',
            }}>
              Delivery corridor
            </span>
          </div>
        </div>
      </div>

      {/* Mini Stats Bar - Top Left Overlay */}
      <div
        style={{
          position: 'absolute',
          left: '12px',
          top: '12px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '12px',
          background: darkMode ? 'rgba(19, 28, 22, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'}`,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
            animation: 'statusPulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: darkMode ? '#94a89a' : '#4a5f52',
          }}>
            Live
          </span>
          <span style={{
            width: '1px',
            height: '14px',
            background: darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: darkMode ? '#6a7a6c' : '#7a8f7e',
          }}>
            {districts.length} zones
          </span>
          <span style={{
            width: '1px',
            height: '14px',
            background: darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: darkMode ? '#6a7a6c' : '#7a8f7e',
          }}>
            {routes.length} routes
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes criticalPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.8; 
          }
          50% { 
            transform: scale(1.15); 
            opacity: 0.4; 
          }
        }
        
        @keyframes depotPulse {
          0%, 100% { 
            box-shadow: 0 4px 12px rgba(30, 107, 66, 0.4), 0 0 20px rgba(30, 107, 66, 0.15); 
          }
          50% { 
            box-shadow: 0 4px 12px rgba(30, 107, 66, 0.4), 0 0 28px rgba(30, 107, 66, 0.3); 
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes pulseRing {
          0% { 
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(30, 107, 66, 0.4);
          }
          70% { 
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(30, 107, 66, 0);
          }
          100% { 
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(30, 107, 66, 0);
          }
        }
        
        .district-tooltip-premium.leaflet-tooltip {
          background: ${darkMode ? 'rgba(19, 28, 22, 0.95)' : 'rgba(255, 255, 255, 0.97)'} !important;
          border: 1px solid ${darkMode ? 'rgba(38, 56, 41, 0.4)' : 'rgba(226, 232, 224, 0.9)'} !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        
        .district-tooltip-premium.leaflet-tooltip-left::before,
        .district-tooltip-premium.leaflet-tooltip-right::before {
          border-${darkMode ? 'left' : 'right'}-color: ${darkMode ? 'rgba(19, 28, 22, 0.95)' : 'rgba(255, 255, 255, 0.97)'} !important;
        }
        
        .district-popup-premium .leaflet-popup-content-wrapper {
          background: ${darkMode ? 'rgba(19, 28, 22, 0.98)' : '#ffffff'} !important;
          border-radius: 16px !important;
          box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.25), 0 0 0 1px ${darkMode ? 'rgba(38, 56, 41, 0.3)' : 'rgba(226, 232, 224, 0.8)'} !important;
          padding: 16px !important;
          backdrop-filter: blur(20px) !important;
        }
        
        .district-popup-premium .leaflet-popup-tip {
          background: ${darkMode ? 'rgba(19, 28, 22, 0.98)' : '#ffffff'} !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .district-popup-premium .leaflet-popup-content {
          margin: 0 !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .district-popup-premium .leaflet-popup-close-button {
          color: ${darkMode ? '#6a7a6c' : '#7a8f7e'} !important;
          font-size: 18px !important;
          right: 8px !important;
          top: 4px !important;
        }
        
        .district-popup-premium .leaflet-popup-close-button:hover {
          color: ${darkMode ? '#eef2ee' : '#0d1f17'} !important;
        }
        
        /* Custom Leaflet Zoom Controls */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
        }
        
        .leaflet-control-zoom a {
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          background: ${darkMode ? 'rgba(19, 28, 22, 0.92)' : 'rgba(255, 255, 255, 0.95)'} !important;
          color: ${darkMode ? '#4ade80' : '#1e6b42'} !important;
          border: 1px solid ${darkMode ? 'rgba(38, 56, 41, 0.5)' : 'rgba(226, 232, 224, 0.8)'} !important;
          border-radius: 10px !important;
          backdrop-filter: blur(12px) !important;
          margin-bottom: 6px !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: ${darkMode ? 'rgba(30, 107, 66, 0.15)' : 'rgba(30, 107, 66, 0.1)'} !important;
          transform: scale(1.05);
        }
        
        /* Attribution styling */
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: ${darkMode ? 'rgba(19, 28, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)'} !important;
          backdrop-filter: blur(12px) !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          color: ${darkMode ? '#6a7a6c' : '#7a8f7e'} !important;
        }
        
        .leaflet-control-attribution a {
          color: ${darkMode ? '#4ade80' : '#1e6b42'} !important;
        }
      `}</style>
    </div>
  );
};
