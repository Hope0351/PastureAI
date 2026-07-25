import axios from 'axios';
import {
  AiRecommendation,
  DashboardSummary,
  DistrictData,
  DistrictForecast,
  FeedDepot,
  FeedRequirement,
  InterventionImpact,
  OptimizedRoute,
  SystemStatus,
  WeatherData,
} from '../types';

const API_BASE = '/api';

export const api = {
  getHealth: async (): Promise<SystemStatus> => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  clearCache: async (): Promise<void> => {
    await axios.post(`${API_BASE}/cache/clear`);
  },

  getDashboardSummary: async (timelineDays: number = 30): Promise<DashboardSummary> => {
    const res = await axios.get(`${API_BASE}/dashboard`, { params: { timeline: timelineDays } });
    return res.data;
  },

  getDistricts: async (timelineDays: number = 30): Promise<DistrictData[]> => {
    const res = await axios.get(`${API_BASE}/districts`, { params: { timeline: timelineDays } });
    return res.data.districts;
  },

  getDistrictProfile: async (
    districtId: string,
    timelineDays: number = 30,
    includeAi: boolean = true
  ): Promise<{
    district: DistrictData;
    satellite: any;
    forecast: DistrictForecast;
    feedRequirement: FeedRequirement;
    route: OptimizedRoute;
    aiRecommendation: AiRecommendation | null;
  }> => {
    const res = await axios.get(`${API_BASE}/district/${districtId}`, {
      params: { timeline: timelineDays, ai: includeAi ? '1' : '0' },
    });
    return res.data;
  },

  getNdvi: async (districtId: string) => {
    const res = await axios.get(`${API_BASE}/ndvi/${districtId}`);
    return res.data;
  },

  getSentinel2MapTiles: async (
    mode: 'rgb' | 'ndvi' = 'rgb'
  ): Promise<{ urlTemplate: string; attribution: string; name: string; mode: string }> => {
    const res = await axios.get(`${API_BASE}/map/sentinel2`, { params: { mode } });
    return res.data;
  },

  getAllWeather: async (): Promise<WeatherData[]> => {
    const res = await axios.get(`${API_BASE}/weather`);
    return res.data;
  },

  getAllForecasts: async (): Promise<DistrictForecast[]> => {
    const res = await axios.get(`${API_BASE}/forecast`);
    return res.data;
  },

  getFeedRequirements: async (timelineDays: number = 30): Promise<FeedRequirement[]> => {
    const res = await axios.get(`${API_BASE}/feed`, { params: { timeline: timelineDays } });
    return res.data.requirements;
  },

  getFeedDepots: async (): Promise<FeedDepot[]> => {
    const res = await axios.get(`${API_BASE}/feed/depots`);
    return res.data;
  },

  getRouting: async (
    timelineDays: number = 30
  ): Promise<{ routes: OptimizedRoute[]; geoJsonRoutes: any; algorithm?: string }> => {
    const res = await axios.get(`${API_BASE}/routing`, { params: { timeline: timelineDays } });
    return res.data;
  },

  getAiAnalysis: async (districtId: string, timelineDays: number = 30): Promise<AiRecommendation> => {
    const res = await axios.get(`${API_BASE}/analysis`, {
      params: { district: districtId, timeline: timelineDays },
    });
    return res.data;
  },

  getInterventionImpact: async (districtId: string): Promise<InterventionImpact> => {
    const res = await axios.get(`${API_BASE}/feed/impact/${districtId}`);
    return res.data;
  },

  getAllInterventionImpacts: async (): Promise<InterventionImpact[]> => {
    const res = await axios.get(`${API_BASE}/feed/impact`);
    return res.data.impacts || [];
  },
};
