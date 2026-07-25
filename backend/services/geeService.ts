import { ETHIOPIAN_DISTRICTS_CONFIG, DistrictRawConfig } from '../config/districtsData';
import { DataSource, NdviRecord } from '../../src/types';
import * as crypto from 'crypto';
import { createRequire } from 'module';
import { appCache } from './cache';
import { WeatherService } from './weatherService';

const require = createRequire(import.meta.url);
// Official Earth Engine Node client (serializes algorithms correctly for live compute)
const ee = require('@google/earthengine') as any;

/**
 * Safely parses service account JSON string, handling escaped quotes, code blocks, or malformed strings.
 */
export function safeParseServiceAccount(rawStr: string): any {
  if (!rawStr || typeof rawStr !== 'string') return null;
  let str = rawStr.trim();

  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    try {
      const unwrapped = JSON.parse(str);
      if (typeof unwrapped === 'object' && unwrapped !== null) return unwrapped;
      if (typeof unwrapped === 'string') str = unwrapped.trim();
    } catch {
      str = str.slice(1, -1).trim();
    }
  }

  if (!str.startsWith('{') && (str.includes('"type"') || str.includes('service_account'))) {
    str = '{' + str;
  }
  if (!str.endsWith('}') && (str.includes('"type"') || str.includes('service_account'))) {
    str = str + '}';
  }

  try {
    const obj = JSON.parse(str);
    if (obj && typeof obj === 'object') return obj;
  } catch {
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const obj = JSON.parse(str.slice(firstBrace, lastBrace + 1));
        if (obj && typeof obj === 'object') return obj;
      } catch {
        // Fallthrough
      }
    }
  }

  return null;
}

export async function getGoogleOAuth2Token(
  serviceAccountJsonStr: string
): Promise<{ token: string; email: string; projectId: string } | null> {
  try {
    const sa = safeParseServiceAccount(serviceAccountJsonStr);
    if (!sa || !sa.client_email || !sa.private_key) return null;

    const privateKey = sa.private_key.includes('\\n') ? sa.private_key.replace(/\\n/g, '\n') : sa.private_key;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/earthengine',
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat,
      })
    ).toString('base64url');

    const signInput = `${header}.${payload}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    const signature = signer.sign(privateKey, 'base64url');
    const jwt = `${signInput}.${signature}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!resp.ok) {
      console.warn('Google OAuth token fetch failed:', await resp.text());
      return null;
    }

    const data = (await resp.json()) as { access_token?: string };
    if (data.access_token) {
      return {
        token: data.access_token,
        email: sa.client_email,
        projectId: sa.project_id || 'earthengine-legacy',
      };
    }
    return null;
  } catch (err) {
    console.warn('Error creating Google OAuth token:', err);
    return null;
  }
}

export interface NdviPayload {
  district: string;
  districtId: string;
  date: string;
  ndvi: number;
  rawDigitalNumber: number;
  rawModisDigitalNumber: number;
  sensor: string;
  historicalSeries: NdviRecord[];
  dataSource: DataSource;
  method: string;
}

/**
 * Sentinel-2 NDVI service.
 * 1) Attempts live GEE point value compute when a service account is configured
 * 2) Falls back to weather-assimilated phenology model calibrated to district baselines
 */
export class GeeSatelliteService {
  private static instance: GeeSatelliteService;
  private weatherService: WeatherService;
  private eeReady: Promise<string> | null = null; // resolves to client_email
  private s2UpstreamInflight: Partial<Record<'rgb' | 'ndvi', Promise<string>>> = {};
  public lastStatus: { mode: DataSource; detail: string } = {
    mode: 'modeled',
    detail: 'Weather-assimilated Sentinel-2 phenology model',
  };

  private constructor() {
    this.weatherService = WeatherService.getInstance();
  }

  public static getInstance(): GeeSatelliteService {
    if (!GeeSatelliteService.instance) {
      GeeSatelliteService.instance = new GeeSatelliteService();
    }
    return GeeSatelliteService.instance;
  }

  public async getDistrictNdvi(districtId: string): Promise<NdviPayload> {
    const cacheKey = `ndvi:${districtId}`;
    const cached = appCache.get<NdviPayload>(cacheKey);
    if (cached) return cached;

    const rawConfig = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === districtId);
    if (!rawConfig) {
      throw new Error(`Unknown district: ${districtId}`);
    }

    const today = new Date();
    const acquisitionDate = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let currentNdvi = rawConfig.baseNdvi;
    let dataSource: DataSource = 'modeled';
    let method = 'Weather-assimilated rangeland phenology (Sentinel-2 calibrated)';
    let sensor = 'COPERNICUS/S2_SR_HARMONIZED (Calibrated Phenology Model)';

    // Try live Earth Engine compute
    if (process.env.GEE_SERVICE_ACCOUNT_JSON) {
      const live = await this.tryLiveGeeNdvi(rawConfig);
      if (live) {
        currentNdvi = live.ndvi;
        dataSource = 'live';
        method = 'Google Earth Engine Sentinel-2 NDVI point reduction';
        sensor = `COPERNICUS/S2_SR_HARMONIZED (Live GEE: ${live.email})`;
        this.lastStatus = {
          mode: 'live',
          detail: `Live Sentinel-2 NDVI via GEE (${live.email})`,
        };
      } else {
        const assimilated = await this.assimilateWithWeather(rawConfig);
        currentNdvi = assimilated;
        // Keep detailed compute error from tryLiveGeeNdvi when present
        if (this.lastStatus.mode !== 'modeled' || !this.lastStatus.detail.includes('compute')) {
          this.lastStatus = {
            mode: 'modeled',
            detail: 'GEE credentials present but compute unavailable — using weather-assimilated model',
          };
        }
      }
    } else {
      currentNdvi = await this.assimilateWithWeather(rawConfig);
      this.lastStatus = {
        mode: 'modeled',
        detail: 'No GEE_SERVICE_ACCOUNT_JSON — weather-assimilated Sentinel-2 phenology model',
      };
    }

    const rawDN = Math.round(Math.max(0, currentNdvi) / 0.0001);
    const historicalSeries = this.generateHistoricalSeries(rawConfig, currentNdvi);

    const payload: NdviPayload = {
      district: rawConfig.name,
      districtId: rawConfig.id,
      date: acquisitionDate,
      ndvi: Number(currentNdvi.toFixed(3)),
      rawDigitalNumber: rawDN,
      rawModisDigitalNumber: rawDN,
      sensor,
      historicalSeries,
      dataSource,
      method,
    };

    appCache.set(cacheKey, payload, 120_000);
    return payload;
  }

  public async getAllDistrictsNdvi(): Promise<
    Array<{ districtId: string; districtName: string; ndvi: number; date: string; dataSource: DataSource }>
  > {
    const results = await Promise.all(
      ETHIOPIAN_DISTRICTS_CONFIG.map(async (d) => {
        const ndvi = await this.getDistrictNdvi(d.id);
        return {
          districtId: d.id,
          districtName: d.name,
          ndvi: ndvi.ndvi,
          date: ndvi.date,
          dataSource: ndvi.dataSource,
        };
      })
    );
    return results;
  }

  /**
   * Build a same-origin Leaflet XYZ template for Sentinel-2 tiles.
   * Browser cannot load earthengine.googleapis.com tiles directly (CORS) — we proxy them.
   */
  public async getSentinel2MapTiles(mode: 'rgb' | 'ndvi' = 'rgb'): Promise<{
    urlTemplate: string;
    attribution: string;
    name: string;
    mode: 'rgb' | 'ndvi';
    dataSource: DataSource;
  }> {
    // Warm the Earth Engine map id so the first tile requests succeed quickly
    await this.ensureSentinel2Upstream(mode);

    return {
      urlTemplate: `/api/map/sentinel2/tiles/${mode}/{z}/{x}/{y}`,
      attribution: 'Copernicus Sentinel-2 MSI via Google Earth Engine &copy; ESA / EC',
      name: mode === 'ndvi' ? 'Sentinel-2 NDVI' : 'Sentinel-2 True Color',
      mode,
      dataSource: 'live',
    };
  }

  /** Fetch a single Sentinel-2 tile via Earth Engine (used by the Express proxy). */
  public async fetchSentinel2Tile(
    mode: 'rgb' | 'ndvi',
    z: number,
    x: number,
    y: number
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const upstream = await this.ensureSentinel2Upstream(mode);
    const url = upstream
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));

    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`EE tile ${resp.status}: ${body.slice(0, 160)}`);
    }
    const ab = await resp.arrayBuffer();
    const buffer = Buffer.from(ab);
    // EE often returns JPEG even when clients expect PNG
    const contentType =
      resp.headers.get('content-type') ||
      (buffer[0] === 0xff && buffer[1] === 0xd8 ? 'image/jpeg' : 'image/png');
    return { buffer, contentType };
  }

  private async ensureSentinel2Upstream(mode: 'rgb' | 'ndvi'): Promise<string> {
    const cacheKey = `s2-upstream:${mode}`;
    const cached = appCache.get<string>(cacheKey);
    if (cached) return cached;

    // Coalesce concurrent tile/warmup callers onto one getMapId
    if (!this.s2UpstreamInflight[mode]) {
      this.s2UpstreamInflight[mode] = this.buildSentinel2Upstream(mode)
        .then((upstream) => {
          appCache.set(cacheKey, upstream, 45 * 60_000);
          return upstream;
        })
        .finally(() => {
          delete this.s2UpstreamInflight[mode];
        });
    }
    return this.s2UpstreamInflight[mode]!;
  }

  private async buildSentinel2Upstream(mode: 'rgb' | 'ndvi'): Promise<string> {
    if (!process.env.GEE_SERVICE_ACCOUNT_JSON) {
      throw new Error('GEE_SERVICE_ACCOUNT_JSON required for Sentinel-2 map tiles');
    }

    await this.ensureEarthEngine();

    const mapInfo = await new Promise<{ urlFormat?: string; mapid?: string; token?: string }>((resolve, reject) => {
      // Wide Horn of Africa AOI — enough coverage for the national map view
      const region = ee.Geometry.Rectangle([30.0, 0.5, 52.0, 16.5], 'EPSG:4326', false);
      const end = ee.Date(Date.now());
      const start = end.advance(-90, 'day');

      const collection = ee
        .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(region)
        .filterDate(start, end)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 55))
        .select(['B4', 'B3', 'B2', 'B8']);

      let visualized: any;
      if (mode === 'ndvi') {
        visualized = collection
          .median()
          .normalizedDifference(['B8', 'B4'])
          .rename('ndvi')
          .clip(region)
          .visualize({
            min: 0.0,
            max: 0.7,
            palette: ['#7f1d1d', '#b45309', '#fbbf24', '#84cc16', '#166534'],
          });
      } else {
        // Bright true-color stretch; clip so nodata outside AOI is transparent (not black)
        visualized = collection
          .median()
          .visualize({
            bands: ['B4', 'B3', 'B2'],
            min: 200,
            max: 2800,
            gamma: 1.4,
          })
          .clip(region);
      }

      visualized.getMapId({}, (mapObject: any, error: Error | null) => {
        if (error) {
          reject(error);
          return;
        }
        if (!mapObject) {
          reject(new Error('Earth Engine returned empty map id'));
          return;
        }
        resolve(mapObject);
      });
    });

    let upstream = mapInfo.urlFormat;
    if (!upstream && mapInfo.mapid) {
      const tokenPart = mapInfo.token ? `?token=${mapInfo.token}` : '';
      upstream = `https://earthengine.googleapis.com/map/${mapInfo.mapid}/{z}/{x}/{y}${tokenPart}`;
    }
    if (!upstream) {
      throw new Error('Earth Engine map tile URL unavailable');
    }

    return upstream.replace('{X}', '{x}').replace('{Y}', '{y}').replace('{Z}', '{z}');
  }

  /** Initialize Earth Engine once with the service account (Node client). */
  private ensureEarthEngine(): Promise<string> {
    if (this.eeReady) return this.eeReady;

    this.eeReady = new Promise((resolve, reject) => {
      const sa = safeParseServiceAccount(process.env.GEE_SERVICE_ACCOUNT_JSON || '');
      if (!sa?.client_email || !sa?.private_key) {
        reject(new Error('Invalid GEE_SERVICE_ACCOUNT_JSON'));
        return;
      }

      // Ensure PEM newlines are real
      const key = {
        ...sa,
        private_key: String(sa.private_key).includes('\\n')
          ? String(sa.private_key).replace(/\\n/g, '\n')
          : sa.private_key,
      };

      ee.data.authenticateViaPrivateKey(
        key,
        () => {
          ee.initialize(
            null,
            null,
            () => resolve(key.client_email as string),
            (err: unknown) => reject(err || new Error('ee.initialize failed')),
            null,
            key.project_id || undefined
          );
        },
        (err: unknown) => reject(err || new Error('ee.authenticateViaPrivateKey failed'))
      );
    }).catch((err) => {
      this.eeReady = null;
      throw err;
    });

    return this.eeReady;
  }

  /**
   * Live Sentinel-2 NDVI at district centroid via official @google/earthengine client.
   */
  private async tryLiveGeeNdvi(
    district: DistrictRawConfig
  ): Promise<{ ndvi: number; email: string } | null> {
    try {
      const email = await this.ensureEarthEngine();

      const value = await new Promise<number>((resolve, reject) => {
        const point = ee.Geometry.Point([district.longitude, district.latitude]);
        const end = ee.Date(Date.now());
        const start = end.advance(-45, 'day');

        const ndviImage = ee
          .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(point)
          .filterDate(start, end)
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
          .median()
          .normalizedDifference(['B8', 'B4'])
          .rename('ndvi');

        ndviImage
          .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 100,
            maxPixels: 1e7,
            bestEffort: true,
          })
          .evaluate((result: { ndvi?: number | null } | null, error: Error | null) => {
            if (error) {
              reject(error);
              return;
            }
            const ndvi = result?.ndvi;
            if (typeof ndvi === 'number' && Number.isFinite(ndvi)) {
              resolve(ndvi);
            } else {
              reject(new Error('No NDVI sample at point (clouds/nodata)'));
            }
          });
      });

      this.lastStatus = {
        mode: 'live',
        detail: `Live Sentinel-2 NDVI via GEE (${email})`,
      };
      return { ndvi: Math.max(0.05, Math.min(0.9, value)), email };
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.warn('Live GEE NDVI attempt failed:', msg);
      this.lastStatus = {
        mode: 'modeled',
        detail: `GEE compute failed — ${msg.slice(0, 180)}`,
      };
      return null;
    }
  }

  /**
   * Assimilate live Open-Meteo drought/rainfall into district baseline NDVI.
   * Produces scientifically plausible, weather-responsive forage signals for demos.
   */
  private async assimilateWithWeather(rawConfig: DistrictRawConfig): Promise<number> {
    try {
      const weather = await this.weatherService.getDistrictWeather(rawConfig.id);
      const rainBoost = Math.min(0.08, (weather.rainfall7DaySum / 40) * 0.08);
      const droughtPenalty = (weather.droughtSeverityIndex / 100) * 0.12;
      const heatPenalty = (weather.heatStressIndex / 100) * 0.04;
      const seasonal = this.seasonalFactor(new Date().getMonth());
      const spatial = Math.sin(rawConfig.latitude * 8 + rawConfig.longitude * 3) * 0.015;

      return Math.max(
        0.1,
        Math.min(0.82, rawConfig.baseNdvi + seasonal + rainBoost - droughtPenalty - heatPenalty + spatial)
      );
    } catch {
      return rawConfig.baseNdvi;
    }
  }

  private seasonalFactor(month: number): number {
    if (month >= 2 && month <= 4) return 0.06; // Belg / Gu
    if (month >= 6 && month <= 8) return 0.1; // Kiremt
    if (month === 0 || month === 1 || month === 11) return -0.08; // Bega dry
    return 0;
  }

  private generateHistoricalSeries(rawConfig: DistrictRawConfig, currentNdvi: number): NdviRecord[] {
    const series: NdviRecord[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const compositeDate = new Date(now.getTime() - i * 15 * 24 * 60 * 60 * 1000);
      const month = compositeDate.getMonth();
      const seasonal = this.seasonalFactor(month);
      // Smooth walk toward current observation for continuity
      const blend = i === 0 ? currentNdvi : rawConfig.baseNdvi + seasonal + Math.sin(i * 0.45) * 0.035;
      const towardCurrent = blend + ((currentNdvi - blend) * (23 - i)) / 46;
      const historicNdvi = Math.max(0.1, Math.min(0.85, towardCurrent));

      const vhi = Math.round(((historicNdvi - 0.12) / (0.75 - 0.12)) * 100);
      series.push({
        date: compositeDate.toISOString().split('T')[0],
        ndvi: Number(historicNdvi.toFixed(3)),
        vhi: Math.max(0, Math.min(100, vhi)),
        qualityScore: 92 + (i % 7),
      });
    }

    // Force last point to match current NDVI
    if (series.length) {
      series[series.length - 1].ndvi = Number(currentNdvi.toFixed(3));
    }

    return series;
  }
}
