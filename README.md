# GeoForage AI

AI-powered forage prediction and emergency feed logistics for Ethiopian pastoral systems.

Predict pasture collapse early, quantify livestock at risk, and dispatch capacity-aware feed routes — built for NGO, operator, and investor demos.

## What it does

| Module | Capability |
|--------|------------|
| **Satellite** | Sentinel-2 NDVI via weather-assimilated phenology; live Google Earth Engine when credentials are set |
| **Climate** | Live Open-Meteo rainfall, temperature, drought & heat stress indices |
| **Forecast** | Ensemble of moving average, Holt linear trend, and quadratic regression fitted on NDVI history |
| **Feed** | TLU-based deficit estimation and economic loss at risk |
| **Logistics** | Clarke-Wright savings CVRP with truck capacity and depot stock checks |
| **AI Brief** | Gemini executive briefs (rules-engine fallback if no API key) |

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY (optional but recommended)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Recommended | Live AI executive briefs |
| `GEE_SERVICE_ACCOUNT_JSON` | Optional | Live Google Earth Engine NDVI |
| `GEE_API_KEY` | Optional | Reserved for GEE API key flows |
| `PORT` | Optional | Server port (default `3000`) |

## API highlights

- `GET /api/health` — honest live / modeled / fallback status for each service
- `GET /api/districts` — fast district list (no AI)
- `GET /api/dashboard` — executive KPIs including economic loss at risk
- `GET /api/routing` — CVRP dispatch plan with feasibility flags
- `GET /api/analysis?district=borena` — AI or rules-engine brief

## Investor demo flow (3 minutes)

1. **Command Overview** — show national risk map, USD at risk, timeline slider
2. **Remote Sensing** — NDVI history + honest data-source badge
3. **Climate** — live Open-Meteo cards
4. **Route Logistics** — feasible vs shortfall truck schedule
5. **AI Executive Brief** — print a district action plan

## Scripts

```bash
npm run dev      # Express + Vite (port 3000)
npm run build    # Production client + server bundle
npm run start    # Run production server
npm run lint     # Typecheck
```
