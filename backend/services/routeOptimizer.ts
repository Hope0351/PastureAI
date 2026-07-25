import { OptimizedRoute, RouteWaypoint } from '../../src/types';
import { FEED_DEPOTS, ETHIOPIAN_DISTRICTS_CONFIG } from '../config/districtsData';
import { FeedEstimatorService } from './feedEstimator';
import { appCache } from './cache';

interface DemandNode {
  districtId: string;
  districtName: string;
  latitude: number;
  longitude: number;
  demandTons: number;
  priorityScore: number;
}

/**
 * Multi-depot Capacitated Vehicle Routing via Clarke-Wright Savings Algorithm.
 * One consolidated dispatch plan per trip (not one row per truckload).
 */
export class RouteOptimizerService {
  private static instance: RouteOptimizerService;
  private feedEstimator: FeedEstimatorService;

  private constructor() {
    this.feedEstimator = FeedEstimatorService.getInstance();
  }

  public static getInstance(): RouteOptimizerService {
    if (!RouteOptimizerService.instance) {
      RouteOptimizerService.instance = new RouteOptimizerService();
    }
    return RouteOptimizerService.instance;
  }

  public async optimizeDistrictRoute(districtId: string, timelineDays: number = 30): Promise<OptimizedRoute> {
    const all = await this.optimizeAllRoutes(timelineDays);
    const found = all.find((r) => r.targetDistrictId === districtId);
    if (found) return found;
    return this.buildEmptyRoute(districtId);
  }

  public async optimizeAllRoutes(timelineDays: number = 30): Promise<OptimizedRoute[]> {
    const cacheKey = `routes:${timelineDays}`;
    const cached = appCache.get<OptimizedRoute[]>(cacheKey);
    if (cached) return cached;

    const requirements = await this.feedEstimator.estimateAllFeedRequirements(timelineDays);
    const stockLeft = new Map(FEED_DEPOTS.map((d) => [d.id, d.availableStockTons]));
    const trucksLeft = new Map(
      FEED_DEPOTS.map((d) => [
        d.id,
        {
          heavy: d.trucksAvailable.heavyTransports20T,
          light: d.trucksAvailable.offRoadTrucks10T,
        },
      ])
    );

    const byDepot = new Map<string, DemandNode[]>();
    for (const req of requirements) {
      if (req.feedNeededTons <= 0) continue;
      const cfg = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === req.districtId);
      if (!cfg) continue;
      const list = byDepot.get(req.assignedDepotId) || [];
      list.push({
        districtId: req.districtId,
        districtName: req.districtName,
        latitude: cfg.latitude,
        longitude: cfg.longitude,
        demandTons: req.feedNeededTons,
        priorityScore: req.priorityScore,
      });
      byDepot.set(req.assignedDepotId, list);
    }

    const routes: OptimizedRoute[] = [];

    for (const depot of FEED_DEPOTS) {
      const nodes = (byDepot.get(depot.id) || []).sort((a, b) => b.priorityScore - a.priorityScore);
      if (!nodes.length) continue;

      type Trip = { customers: DemandNode[]; load: number };
      let trips: Trip[] = nodes.map((n) => ({ customers: [n], load: n.demandTons }));

      const savings: Array<{ i: number; j: number; saving: number }> = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const di = this.haversine(depot.latitude, depot.longitude, nodes[i].latitude, nodes[i].longitude);
          const dj = this.haversine(depot.latitude, depot.longitude, nodes[j].latitude, nodes[j].longitude);
          const ij = this.haversine(nodes[i].latitude, nodes[i].longitude, nodes[j].latitude, nodes[j].longitude);
          savings.push({ i, j, saving: di + dj - ij });
        }
      }
      savings.sort((a, b) => b.saving - a.saving);

      const mergeCap = 40; // allow multi-stop if combined load fits two heavy trucks conceptually
      for (const s of savings) {
        const tripI = trips.find((t) => t.customers.some((c) => c.districtId === nodes[s.i].districtId));
        const tripJ = trips.find((t) => t.customers.some((c) => c.districtId === nodes[s.j].districtId));
        if (!tripI || !tripJ || tripI === tripJ) continue;
        if (tripI.load + tripJ.load > mergeCap) continue;
        if (tripI.customers.length + tripJ.customers.length > 3) continue;

        tripI.customers = [...tripI.customers, ...tripJ.customers];
        tripI.load += tripJ.load;
        trips = trips.filter((t) => t !== tripJ);
      }

      // Priority-weighted fair share of stock + fleet capacity across trips
      let depotStock = stockLeft.get(depot.id) || 0;
      const fleet = trucksLeft.get(depot.id)!;
      const fleetCapTons = fleet.heavy * 20 + fleet.light * 10;
      const weights = trips.map((t) => {
        const priority = t.customers.reduce((ps, c) => Math.max(ps, c.priorityScore), 1);
        return Math.max(1, priority) * Math.sqrt(Math.max(1, t.load));
      });
      const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

      const budgets = trips.map((t, idx) => {
        const share = weights[idx] / weightSum;
        return Math.min(t.load, depotStock * share, fleetCapTons * share);
      });

      // If unused capacity remains, top-up highest priority trips
      let usedBudget = budgets.reduce((a, b) => a + b, 0);
      let spareStock = Math.max(0, Math.min(depotStock, fleetCapTons) - usedBudget);
      const order = trips
        .map((t, idx) => ({ idx, priority: t.customers.reduce((ps, c) => Math.max(ps, c.priorityScore), 1) }))
        .sort((a, b) => b.priority - a.priority);
      for (const { idx } of order) {
        if (spareStock < 0.01) break;
        const room = trips[idx].load - budgets[idx];
        const add = Math.min(room, spareStock);
        budgets[idx] += add;
        spareStock -= add;
      }

      for (let ti = 0; ti < trips.length; ti++) {
        const trip = trips[ti];
        const demand = trip.load;
        let target = budgets[ti];
        let heavyUsed = 0;
        let lightUsed = 0;
        let allocated = 0;
        let remaining = target;

        while (remaining > 0.01 && (fleet.heavy > 0 || fleet.light > 0)) {
          if (remaining > 10 && fleet.heavy > 0) {
            fleet.heavy -= 1;
            heavyUsed += 1;
            const chunk = Math.min(20, remaining);
            allocated += chunk;
            remaining -= chunk;
          } else if (fleet.light > 0) {
            fleet.light -= 1;
            lightUsed += 1;
            const chunk = Math.min(10, remaining);
            allocated += chunk;
            remaining -= chunk;
          } else if (fleet.heavy > 0) {
            fleet.heavy -= 1;
            heavyUsed += 1;
            const chunk = Math.min(20, remaining);
            allocated += chunk;
            remaining -= chunk;
          } else break;
        }

        allocated = Math.min(allocated, depotStock);
        depotStock -= allocated;

        const shortfall = Math.max(0, demand - allocated);
        // Feasible if first-wave plan covers ≥50% of emergency demand with assigned trucks
        const feasible = allocated >= demand * 0.5 && (heavyUsed > 0 || lightUsed > 0);
        const primary = [...trip.customers].sort((a, b) => b.priorityScore - a.priorityScore)[0];

        let truckType: string;
        if (heavyUsed && lightUsed) truckType = `${heavyUsed}× Heavy 20T + ${lightUsed}× Off-Road 10T`;
        else if (heavyUsed) truckType = `${heavyUsed}× Volvo FMX 6x6 Heavy (20T)`;
        else if (lightUsed) truckType = `${lightUsed}× Isuzu FVR Off-Road (10T)`;
        else truckType = shortfall > 0 ? 'Unassigned (Fleet/Stock Gap)' : 'Standby';

        routes.push(
          this.buildRouteRecord({
            depot,
            trip,
            primary,
            truckType,
            allocated,
            requested: demand,
            feasible,
            routeIndex: routes.length,
          })
        );
      }

      stockLeft.set(depot.id, depotStock);
      trucksLeft.set(depot.id, fleet);
    }

    // Ensure every demanding district appears
    for (const req of requirements) {
      if (req.feedNeededTons <= 0) continue;
      if (!routes.some((r) => r.targetDistrictId === req.districtId || r.waypoints.some((w) => w.name.includes(req.districtName)))) {
        routes.push(
          await this.buildDirectFallback(req.districtId, req.feedNeededTons, req.priorityScore, req.assignedDepotId)
        );
      }
    }

    appCache.set(cacheKey, routes, 90_000);
    return routes;
  }

  private buildRouteRecord(args: {
    depot: (typeof FEED_DEPOTS)[number];
    trip: { customers: DemandNode[]; load: number };
    primary: DemandNode;
    truckType: string;
    allocated: number;
    requested: number;
    feasible: boolean;
    routeIndex: number;
  }): OptimizedRoute {
    const { depot, trip, primary, truckType, allocated, requested, feasible, routeIndex } = args;

    const waypoints: RouteWaypoint[] = [
      {
        name: depot.name,
        latitude: depot.latitude,
        longitude: depot.longitude,
        type: 'depot',
        sequenceOrder: 1,
      },
    ];

    let seq = 2;
    let totalDist = 0;
    let prevLat = depot.latitude;
    let prevLng = depot.longitude;
    const coords: number[][] = [[depot.longitude, depot.latitude]];

    for (const cust of trip.customers) {
      totalDist += this.haversine(prevLat, prevLng, cust.latitude, cust.longitude);
      const bendLat = (prevLat + cust.latitude) / 2 + 0.04;
      const bendLng = (prevLng + cust.longitude) / 2 - 0.03;
      coords.push([bendLng, bendLat], [cust.longitude, cust.latitude]);
      waypoints.push({
        name: `${cust.districtName} Emergency Drop`,
        latitude: cust.latitude,
        longitude: cust.longitude,
        type: 'delivery_stop',
        cargoTons: Number(((cust.demandTons / Math.max(trip.load, 0.01)) * allocated).toFixed(1)),
        sequenceOrder: seq++,
      });
      prevLat = cust.latitude;
      prevLng = cust.longitude;
    }

    totalDist += this.haversine(prevLat, prevLng, depot.latitude, depot.longitude);
    totalDist *= 1.18;
    coords.push([depot.longitude, depot.latitude]);

    const distanceKm = Math.round(totalDist);
    let routeColor = '#10B981';
    if (primary.priorityScore >= 75) routeColor = '#EF4444';
    else if (primary.priorityScore >= 50) routeColor = '#F59E0B';
    if (!feasible) routeColor = '#64748B';

    const routeId = `route-${depot.id}-${primary.districtId}-${routeIndex}`;

    return {
      routeId,
      depotId: depot.id,
      depotName: depot.name,
      targetDistrictId: primary.districtId,
      targetDistrictName: trip.customers.map((c) => c.districtName).join(' → '),
      assignedTruckType: truckType,
      allocatedFeedTons: Number(allocated.toFixed(1)),
      distanceKm,
      estimatedTimeHours: Number((distanceKm / 42).toFixed(1)),
      fuelConsumptionLiters: Math.round(distanceKm * 0.38),
      waypoints,
      stopsCount: trip.customers.length,
      feasible,
      stockShortfallTons: Number(Math.max(0, requested - allocated).toFixed(1)),
      algorithm: 'Clarke-Wright Savings CVRP',
      geoJsonPolyline: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: { routeId, color: routeColor, distanceKm },
      },
    };
  }

  private async buildDirectFallback(
    districtId: string,
    demand: number,
    priority: number,
    depotId: string
  ): Promise<OptimizedRoute> {
    const cfg = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === districtId)!;
    const depot = FEED_DEPOTS.find((d) => d.id === depotId) || FEED_DEPOTS[0];
    const distanceKm = Math.round(this.haversine(depot.latitude, depot.longitude, cfg.latitude, cfg.longitude) * 1.18);
    const routeId = `route-${depot.id}-${cfg.id}-fallback`;
    return {
      routeId,
      depotId: depot.id,
      depotName: depot.name,
      targetDistrictId: cfg.id,
      targetDistrictName: cfg.name,
      assignedTruckType: demand > 15 ? 'Volvo FMX 6x6 Heavy Transport (20 Tons)' : 'Isuzu FVR 4x4 Off-Road Truck (10 Tons)',
      allocatedFeedTons: demand,
      distanceKm,
      estimatedTimeHours: Number((distanceKm / 42).toFixed(1)),
      fuelConsumptionLiters: Math.round(distanceKm * 2 * 0.38),
      waypoints: [
        { name: depot.name, latitude: depot.latitude, longitude: depot.longitude, type: 'depot', sequenceOrder: 1 },
        {
          name: `${cfg.name} Emergency Drop`,
          latitude: cfg.latitude,
          longitude: cfg.longitude,
          type: 'delivery_stop',
          cargoTons: demand,
          sequenceOrder: 2,
        },
      ],
      stopsCount: 1,
      feasible: true,
      stockShortfallTons: 0,
      algorithm: 'Clarke-Wright Savings CVRP',
      geoJsonPolyline: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [depot.longitude, depot.latitude],
            [cfg.longitude, cfg.latitude],
          ],
        },
        properties: {
          routeId,
          color: priority >= 75 ? '#EF4444' : priority >= 50 ? '#F59E0B' : '#10B981',
          distanceKm,
        },
      },
    };
  }

  private buildEmptyRoute(districtId: string): OptimizedRoute {
    const cfg = ETHIOPIAN_DISTRICTS_CONFIG.find((d) => d.id === districtId) || ETHIOPIAN_DISTRICTS_CONFIG[0];
    const depot = FEED_DEPOTS[0];
    return {
      routeId: `route-monitor-${cfg.id}`,
      depotId: depot.id,
      depotName: depot.name,
      targetDistrictId: cfg.id,
      targetDistrictName: cfg.name,
      assignedTruckType: 'Standby Patrol',
      allocatedFeedTons: 0,
      distanceKm: 0,
      estimatedTimeHours: 0,
      fuelConsumptionLiters: 0,
      waypoints: [],
      stopsCount: 0,
      feasible: true,
      stockShortfallTons: 0,
      algorithm: 'Clarke-Wright Savings CVRP',
      geoJsonPolyline: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] },
        properties: { routeId: `route-monitor-${cfg.id}`, color: '#10B981', distanceKm: 0 },
      },
    };
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
