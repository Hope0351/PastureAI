import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ETHIOPIAN_DISTRICTS_CONFIG, FEED_DEPOTS } from './backend/config/districtsData';
import { AiAnalyzerService } from './backend/services/aiAnalyzer';
import { appCache } from './backend/services/cache';
import { DataProcessorService } from './backend/services/dataProcessor';
import { FeedEstimatorService } from './backend/services/feedEstimator';
import { ForecastingService } from './backend/services/forecasting';
import { GeeSatelliteService } from './backend/services/geeService';
import { RouteOptimizerService } from './backend/services/routeOptimizer';
import { WeatherService } from './backend/services/weatherService';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const dataProcessor = DataProcessorService.getInstance();
  const geeService = GeeSatelliteService.getInstance();
  const weatherService = WeatherService.getInstance();
  const forecastingService = ForecastingService.getInstance();
  const feedEstimator = FeedEstimatorService.getInstance();
  const routeOptimizer = RouteOptimizerService.getInstance();
  const aiAnalyzer = AiAnalyzerService.getInstance();

  const knownDistrict = (id: string) => ETHIOPIAN_DISTRICTS_CONFIG.some((d) => d.id === id);

  app.get('/api/health', async (_req, res) => {
    try {
      // Probe one weather call for live status (cached)
      const sample = await weatherService.getDistrictWeather('borena');
      await geeService.getDistrictNdvi('borena');

      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        services: {
          weather: {
            status: sample.dataSource === 'live' ? 'live' : 'degraded',
            detail:
              sample.dataSource === 'live'
                ? 'Open-Meteo API connected'
                : 'Using deterministic weather fallback',
          },
          satellite: {
            status: geeService.lastStatus.mode === 'live' ? 'live' : 'modeled',
            detail: geeService.lastStatus.detail,
          },
          gemini: {
            status: process.env.GEMINI_API_KEY ? 'configured' : 'fallback',
            detail: process.env.GEMINI_API_KEY
              ? `Gemini key present (last: ${aiAnalyzer.lastGenerator})`
              : 'Rules-engine briefs (set GEMINI_API_KEY for live AI)',
          },
          routing: {
            status: 'ready',
            detail: 'Clarke-Wright Savings multi-depot CVRP with capacity & stock checks',
          },
          forecasting: {
            status: 'ready',
            detail: 'Ensemble MA + Holt + Quadratic fitted on NDVI history',
          },
        },
        cache: appCache.stats(),
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Health check failed' });
    }
  });

  app.post('/api/cache/clear', (_req, res) => {
    appCache.clear();
    res.json({ ok: true, message: 'Cache cleared' });
  });

  // Fast district list (no AI)
  app.get('/api/districts', async (req, res) => {
    try {
      const timelineDays = Number(req.query.timeline) || 30;
      const districts = await dataProcessor.processAllDistricts();
      res.json({ timelineDays, districts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to load districts' });
    }
  });

  app.get('/api/dashboard', async (req, res) => {
    try {
      const timelineDays = Number(req.query.timeline) || 30;
      const allDistricts = await dataProcessor.processAllDistricts();
      const allFeedReqs = await feedEstimator.estimateAllFeedRequirements(timelineDays);

      let criticalCount = 0;
      let warningCount = 0;
      let healthyCount = 0;
      let totalLivestockAtRisk = 0;
      let totalFeedDeficitTons = 0;
      let totalLossUSD = 0;
      let ndviSum = 0;

      allDistricts.forEach((d) => {
        if (d.riskLevel === 'Critical') criticalCount++;
        else if (d.riskLevel === 'Warning') warningCount++;
        else healthyCount++;
        ndviSum += d.currentNdvi;
      });

      allFeedReqs.forEach((f) => {
        totalLivestockAtRisk += f.animalsAtRisk;
        totalFeedDeficitTons += f.feedNeededTons;
        totalLossUSD += f.estimatedEconomicLossUSD;
      });

      const avgNdvi = Number((ndviSum / allDistricts.length).toFixed(3));

      res.json({
        monitoredDistrictsCount: allDistricts.length,
        highRiskDistrictsCount: criticalCount,
        warningDistrictsCount: warningCount,
        healthyDistrictsCount: healthyCount,
        totalLivestockAtRisk,
        totalFeedDeficitTons,
        averageRegionalNdvi: avgNdvi,
        activeSupplyRoutesCount: allFeedReqs.filter((f) => f.feedNeededTons > 0).length,
        droughtAlertLevel:
          criticalCount >= 3 ? 'Widespread forage stress' : 'Elevated drought warning',
        lastSatelliteUpdate: new Date().toISOString().split('T')[0],
        timelineDays,
        estimatedEconomicLossUSD: totalLossUSD,
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ error: 'Failed to compute dashboard metrics' });
    }
  });

  app.get('/api/ndvi', async (_req, res) => {
    try {
      res.json(await geeService.getAllDistrictsNdvi());
    } catch {
      res.status(500).json({ error: 'Failed to retrieve satellite NDVI' });
    }
  });

  // Live Sentinel-2 XYZ tiles for Leaflet basemap (true-color or NDVI)
  app.get('/api/map/sentinel2', async (req, res) => {
    try {
      const mode = req.query.mode === 'ndvi' ? 'ndvi' : 'rgb';
      const tiles = await geeService.getSentinel2MapTiles(mode);
      res.json(tiles);
    } catch (error: any) {
      console.error('Sentinel-2 map tiles error:', error?.message || error);
      res.status(503).json({
        error: 'Sentinel-2 map tiles unavailable',
        detail: error?.message || 'Earth Engine mapid failed',
      });
    }
  });

  // Same-origin tile proxy (browsers cannot load EE tiles cross-origin)
  app.get('/api/map/sentinel2/tiles/:mode/:z/:x/:y', async (req, res) => {
    try {
      const mode = req.params.mode === 'ndvi' ? 'ndvi' : 'rgb';
      const z = Number(req.params.z);
      const x = Number(req.params.x);
      const y = Number(String(req.params.y).replace(/[^\d]/g, ''));
      if (![z, x, y].every((n) => Number.isFinite(n) && n >= 0)) {
        return res.status(400).json({ error: 'Invalid tile coordinates' });
      }

      const { buffer, contentType } = await geeService.fetchSentinel2Tile(mode, z, x, y);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (error: any) {
      console.error('Sentinel-2 tile proxy error:', error?.message || error);
      res.status(502).json({ error: 'Tile fetch failed' });
    }
  });

  app.get('/api/ndvi/:districtId', async (req, res) => {
    try {
      if (!knownDistrict(req.params.districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      res.json(await geeService.getDistrictNdvi(req.params.districtId));
    } catch {
      res.status(500).json({ error: 'Failed to retrieve district NDVI' });
    }
  });

  app.get('/api/weather', async (_req, res) => {
    try {
      res.json(await weatherService.getAllWeather());
    } catch {
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });

  app.get('/api/weather/:districtId', async (req, res) => {
    try {
      if (!knownDistrict(req.params.districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      res.json(await weatherService.getDistrictWeather(req.params.districtId));
    } catch {
      res.status(500).json({ error: 'Failed to fetch district weather' });
    }
  });

  app.get('/api/forecast', async (_req, res) => {
    try {
      const results = await Promise.all(
        ETHIOPIAN_DISTRICTS_CONFIG.map((d) => forecastingService.forecastDistrict(d.id))
      );
      res.json(results);
    } catch {
      res.status(500).json({ error: 'Failed to generate forecasts' });
    }
  });

  app.get('/api/forecast/:districtId', async (req, res) => {
    try {
      if (!knownDistrict(req.params.districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      res.json(await forecastingService.forecastDistrict(req.params.districtId));
    } catch {
      res.status(500).json({ error: 'Failed to generate district forecast' });
    }
  });

  app.get('/api/district/:id', async (req, res) => {
    try {
      const districtId = req.params.id;
      if (!knownDistrict(districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      const timelineDays = Number(req.query.timeline) || 30;
      const includeAi = req.query.ai !== '0';
      const lang = req.query.lang === 'am' ? 'am' : 'en';

      const [district, satellite, forecast, feedReq, route] = await Promise.all([
        dataProcessor.processDistrict(districtId),
        geeService.getDistrictNdvi(districtId),
        forecastingService.forecastDistrict(districtId),
        feedEstimator.estimateFeedRequirement(districtId, timelineDays),
        routeOptimizer.optimizeDistrictRoute(districtId, timelineDays),
      ]);

      const aiBrief = includeAi
        ? await aiAnalyzer.generateDistrictAnalysis(districtId, timelineDays, lang)
        : null;

      res.json({
        district,
        satellite,
        forecast,
        feedRequirement: feedReq,
        route,
        aiRecommendation: aiBrief,
      });
    } catch (error) {
      console.error(`Error processing district ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve complete district data' });
    }
  });

  app.get('/api/feed', async (req, res) => {
    try {
      const timelineDays = Number(req.query.timeline) || 30;
      const data = await feedEstimator.estimateAllFeedRequirements(timelineDays);
      res.json({ timelineDays, requirements: data });
    } catch {
      res.status(500).json({ error: 'Failed to compute feed requirements' });
    }
  });

  app.get('/api/feed/depots', (_req, res) => {
    res.json(FEED_DEPOTS);
  });

  app.get('/api/feed/impact/:districtId', async (req, res) => {
    try {
      if (!knownDistrict(req.params.districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      res.json(await feedEstimator.estimateInterventionImpact(req.params.districtId));
    } catch {
      res.status(500).json({ error: 'Failed to estimate intervention impact' });
    }
  });

  app.get('/api/feed/impact', async (_req, res) => {
    try {
      const impacts = await Promise.all(
        ETHIOPIAN_DISTRICTS_CONFIG.map((d) => feedEstimator.estimateInterventionImpact(d.id))
      );
      res.json({ impacts });
    } catch {
      res.status(500).json({ error: 'Failed to estimate intervention impacts' });
    }
  });

  app.get('/api/routing', async (req, res) => {
    try {
      const timelineDays = Number(req.query.timeline) || 30;
      const routes = await routeOptimizer.optimizeAllRoutes(timelineDays);
      res.json({
        timelineDays,
        algorithm: 'Clarke-Wright Savings CVRP',
        routes,
        geoJsonRoutes: {
          type: 'FeatureCollection',
          features: routes.map((r) => r.geoJsonPolyline),
        },
        feasibleCount: routes.filter((r) => r.feasible).length,
        infeasibleCount: routes.filter((r) => !r.feasible).length,
      });
    } catch {
      res.status(500).json({ error: 'Failed to optimize feed delivery routes' });
    }
  });

  app.get('/api/analysis', async (req, res) => {
    try {
      const districtId = (req.query.district as string) || 'borena';
      if (!knownDistrict(districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      const timelineDays = Number(req.query.timeline) || 30;
      const lang = req.query.lang === 'am' ? 'am' : 'en';
      res.json(await aiAnalyzer.generateDistrictAnalysis(districtId, timelineDays, lang));
    } catch {
      res.status(500).json({ error: 'Failed to generate AI executive analysis' });
    }
  });

  app.post('/api/analysis', async (req, res) => {
    try {
      const districtId = req.body.districtId || 'borena';
      if (!knownDistrict(districtId)) {
        return res.status(404).json({ error: 'District not found' });
      }
      const lang = req.body.lang === 'am' ? 'am' : 'en';
      res.json(await aiAnalyzer.generateDistrictAnalysis(districtId, req.body.timelineDays || 30, lang));
    } catch {
      res.status(500).json({ error: 'Failed to generate AI executive analysis' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mesk] Server listening on http://0.0.0.0:${PORT}`);
    // Prefetch Sentinel-2 map id so the first map click is fast
    if (process.env.GEE_SERVICE_ACCOUNT_FILE || process.env.GEE_SERVICE_ACCOUNT_JSON) {
      geeService
        .getSentinel2MapTiles('rgb')
        .then(() => console.log('[Mesk] Sentinel-2 map tiles warmed'))
        .catch((err) => console.warn('[Mesk] Sentinel-2 warmup skipped:', err?.message || err));
    }
  });
}

startServer();
