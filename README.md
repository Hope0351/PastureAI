<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Express.js-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/Team-5_Members-blue?style=flat-square" alt="Team">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=flat-square" alt="Version">
</p>

<br>

<div align="center">

# PastureAI

### *AI-Powered Ethiopian Pastoral Forage Prediction & Livestock Management Platform*

**Transforming pastoral resilience through satellite intelligence, machine learning, and logistics optimization**

[Live Demo](#quick-start) • [Documentation](#features) • [Screenshots](#features) • [Team](#team-contributors) • [Contributing](#contributing)

</div>

<br>

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [About](#about-pastureai) | What is PastureAI and why it matters |
| [Features](#features) | Complete feature breakdown with screenshots |
| [Tech Stack](#tech-stack) | Technologies powering the platform |
| [Architecture](#system-architecture) | How components work together |
| [Team](#team-contributors) | Meet the contributors |
| [Quick Start](#quick-start) | Run locally in 2 minutes |
| [Security](#security) | Security practices |
| [Roadmap](#roadmap) | Future plans |

---

## About PastureAI

**PastureAI** is an enterprise-grade, AI-powered platform designed specifically for **Ethiopian pastoral communities** facing climate-induced forage scarcity. By leveraging **Sentinel-2 satellite imagery**, **Google Earth Engine**, **machine learning models**, and **optimization algorithms**, PastureAI delivers real-time forage predictions, livestock management insights, and intelligent feed dispatch routing.

### The Problem We Solve

Ethiopia's pastoral regions support **millions of livestock** and livelihoods, yet face:

- **Unpredictable drought cycles** causing massive livestock mortality
- **Lack of real-time forage data** for migration decisions  
- **Inefficient emergency feed logistics** reaching affected areas too late
- **Fragmented information** across weather, satellite, and ground data

### Our Solution

PastureAI provides a **unified command center** with:

| Capability | Impact |
|------------|--------|
| **Satellite NDVI Monitoring** | Real-time vegetation health across all zones |
| **AI-Powered Predictions** | 60-day forage outlook using Gemini AI |
| **Climate Analytics** | Temperature, precipitation, drought indexing |
| **Route Optimization** | Clarke-Wright CVRP algorithm for feed dispatch |
| **Executive Briefs** | Auto-generated decision reports for policymakers |

---

## Features

### 1. Landing Page - Hero Section

![Landing Page Hero](screenshots/01-landing-hero.png)

Full-screen cinematic hero with parallax effects, gradient text logo, and compelling call-to-action buttons.

---

### 2. Landing Page - Feature Cards

![Landing Features](screenshots/02-landing-features.png)

Interactive feature cards showcasing core capabilities with hover animations and glass morphism design.

---

### 3. Executive Dashboard

![Dashboard Overview](screenshots/03-dashboard-overview.png)

Complete overview dashboard with KPI header, statistics grid, interactive map, timeline slider, and district detail panel.

---

### 4. Stats Cards Component

![Stats Cards](screenshots/04-stats-cards.png)

6 animated KPI cards displaying: Total Zones, At-Risk Districts, Avg NDVI, Feed Deficit, Active Dispatches, Weather Alerts.

---

### 5. Timeline Slider Component

![Timeline Slider](screenshots/05-timeline-slider.png)

Visual 60-day prediction slider with pulse animations for temporal navigation through forage forecasts.

---

### 6. Interactive Map Component

![Interactive Map](screenshots/06-interactive-map.png)

Premium Leaflet map with animated gradient border, glass morphism controls, district overlays, and live legend panel.

**Map Features:**
- **6 Basemap Layers** -- Voyager, Satellite, Sentinel-2, Terrain, Light, Dark
- **Animated Gradient Border** -- Pulsing glow effect around map container
- **Location Control** -- GPS geolocation integration
- **Fullscreen Mode** -- Immersive map experience
- **Coordinate Display** -- Live cursor position tracking
- **Enhanced Popups** -- Metric cards grid inside popups
- **Depot Markers** -- Bounce animation on supply points
- **Route Lines** -- Hover highlight effects on optimized paths
- **Live Legend Panel** -- Real-time district count by category

---

### 7. District Detail Panel

![District Panel](screenshots/07-district-panel.png)

Click any zone on the map to reveal detailed metrics including population data, AI brief summary, and feed deficit indicators.

---

### 8. Climate Analytics Page

![Climate Analytics](screenshots/08-climate-analytics.png)

Comprehensive climate analytics dashboard with temperature trends, precipitation data, and drought index visualizations.

**Climate Features:**
- **Temperature Analysis** -- Current, forecast, and historical trends
- **Precipitation Tracking** -- Rainfall patterns and predictions
- **Drought Index** -- Standardized Precipitation Evapotranspiration Index (SPEI)
- **Seasonal Outlook** -- 30/60/90 day forecasts
- **Interactive Charts** -- Recharts-powered visualizations

---

### 9. Satellite Monitoring Page

![Satellite Monitoring](screenshots/09-satellite-monitoring.png)

Sentinel-2 NDVI monitoring via Google Earth Engine with vegetation health heat maps and temporal analysis.

**Satellite Features:**
- **Sentinel-2 Integration** -- 10m resolution multispectral imagery
- **NDVI Calculation** -- Normalized Difference Vegetation Index
- **Temporal Compositing** -- Cloud-free mosaic generation
- **Health Heat Maps** -- Color-coded vegetation density
- **Trend Analysis** -- Historical vegetation changes
- **Alert Zones** -- Automated anomaly detection

---

### 10. Logistics & Route Optimization

![Logistics Routing](screenshots/10-logistics-routing.png)

Intelligent route optimization using Clarke-Wright savings algorithm with vehicle capacity constraints.

**Logistics Features:**
- **Vehicle Routing** -- Capacitated VRP optimization
- **Depot Management** -- Supply point locations and inventory
- **Route Visualization** -- Optimized paths on map
- **Load Planning** -- Capacity-aware allocation
- **ETA Calculations** -- Estimated arrival times
- **Cost Estimation** -- Fuel and distance costs

---

### 11. AI Brief Generator

![AI Brief](screenshots/11-ai-brief.png)

Auto-generated executive briefs powered by Google Gemini AI with actionable recommendations for decision-makers.

**AI Features:**
- **Gemini Integration** -- Google's most capable AI model
- **Executive Summarization** -- Complex data to clear insights
- **Actionable Recommendations** -- Specific intervention suggestions
- **Confidence Scores** -- AI prediction reliability metrics
- **Rules Engine Fallback** -- Deterministic logic when AI unavailable
- **Export Formats** -- PDF/Word compatible briefs

---

### 12. Livestock Management

![Livestock Management](screenshots/12-livestock-management.png)

Comprehensive livestock tracking with population estimates, feed requirements, and vulnerability assessments.

**Livestock Features:**
- **Population Tracking** -- Cattle, camels, goats, sheep counts
- **Feed Requirements** -- Daily nutritional needs calculation
- **Vulnerability Scoring** -- At-risk population identification
- **Trend Analysis** -- Population changes over time
- **Distribution Maps** -- Livestock density visualization

---

### 13. Navigation Bar Component

![Navbar Component](screenshots/13-navbar-component.png)

Glass morphism navigation bar with responsive hamburger menu, theme toggle, and status indicator pills.

---

### 14. Map Controls & Basemap Switcher

![Map Controls](screenshots/14-map-controls.png)

Advanced map controls including basemap layer switcher (6 layers), zoom controls, and layer visibility toggles.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=white) | 19.x | UI Library |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | 5.7.x | Type Safety |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) | 6.x | Build Tool |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind-06B6D4?logo=tailwindcss&logoColor=white) | 4.x | Styling |
| ![Framer Motion](https://img.shields.io/badge/-Framer_Motion-FF0055?logo=framer&logoColor=white) | 11.x | Animations |
| ![Leaflet](https://img.shields.io/badge/-Leaflet-199900?logo=leaflet&logoColor=white) | 1.9.x | Maps |
| ![Recharts](https://img.shields.io/badge/-Recharts-FC4A02?logo=recharts&logoColor=white) | 2.x | Charts |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white) | 22.x | Runtime |
| ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white) | 5.x | Server Framework |
| ![Google Earth Engine](https://img.shields.io/badge/-GEE-4285F4?logo=google&logoColor=white) | API | Satellite Data |
| ![Gemini AI](https://img.shields.io/badge/-Gemini-8E75B2?logo=googleai&logoColor=white) | API | AI Analysis |
| ![Open-Meteo](https://img.shields.io/badge/-Open_Meteo-0066FF?logo=openapi&logoColor=white) | API | Weather Data |

### Design System

```
+-- Color Palette
|   +-- Field Green    (#22C55E) -- Healthy vegetation
|   +-- Signal Orange  (#F97316) -- Warning/Attention
|   +-- Critical Red    (#EF4444) -- Danger/Urgent
|   +-- Sky Blue        (#0EA5E9) -- Information/Water
|   +-- OK Green        (#84CC16) -- Success/Normal
|
+-- Glass Morphism
|   +-- Backdrop Blur   (12px)
|   +-- Semi-transparent backgrounds (rgba)
|   +-- Subtle borders  (1px solid rgba)
|
+-- Animations
    +-- Fade Up         (entrance)
    +-- Scale In        (modal)
    +-- Gradient Shift  (hero)
    +-- Shimmer         (loading)
    +-- Pulse Ring      (live indicators)
```

---

## System Architecture

```
+-------------------------------------------------------------------------+
|                         CLIENT LAYER                                    |
|  +----------+ +-----------+ +----------+ +----------------------+       |
|  | React    | | Tailwind  | | Framer   | |     Recharts         |       |
|  | 19 + TS  | |   CSS 4   | |  Motion  | |   Visualization      |       |
|  +----+-----+ +-----+-----+ +----+-----+ +-----------+----------+       |
|       +--------------+----+-------------------+                       |
|                      V    V                                           |
|              +-------------------------------+                        |
|              |      Leaflet Maps             |                        |
|              |   (6 Basemap Layers)          |                        |
|              +---------------+---------------+                        |
+------------------------------+----------------------------------------+
                               | HTTP/REST
+------------------------------V----------------------------------------+
|                          API LAYER                                     |
|  +---------------------------------------------------------------+     |
|  |                    Express.js Server                           |     |
|  |  +----------+ +----------+ +----------+ +---------------+      |     |
|  |  | /climate | |/satellite| |/logistics| | /ai-brief     |      |     |
|  |  +----+-----+ +----+-----+ +----+------+ +-------+-------+      |     |
|  +-------+------------+------------+---------------+--------------+     |
+----------+------------+------------+---------------+--------------------+
           |            |            |               |
+----------V------------V------------V---------------V--------------------+
|                        SERVICE LAYER                                   |
|  +------------------+  +------------------+  +---------------------+   |
|  |  geeService      |  | weatherService   |  |   aiAnalyzer        |   |
|  |  (Sentinel-2)    |  | (Open-Meteo)     |  |   (Gemini AI)       |   |
|  +------------------+  +------------------+  +---------------------+   |
|  +------------------+  +------------------+  +---------------------+   |
|  | forecasting      |  | feedEstimator    |  |  routeOptimizer      |   |
|  | (NDVI Predict)   |  | (Requirements)   |  |  (CVRP Algorithm)   |   |
|  +------------------+  +------------------+  +---------------------+   |
+-------------------------------------------------------------------------+
           |            |            |
+----------V------------V------------V------------------------------------+
|                        EXTERNAL APIS                                   |
|  +------------+  +------------+  +------------+                         |
|  | Google EEE |  | Open-Meteo |  | Gemini AI  |                         |
|  | (Satellite)|  | (Weather)  |  |  (LLM)     |                         |
|  +------------+  +------------+  +------------+                         |
+-------------------------------------------------------------------------+
```

---

## Team Contributors

<div align="center">

| Role | Name | Location | Focus Area |
|------|------|----------|------------|
| **Frontend Lead** | Zeamanuel Million | Addis Ababa, ET | React, TypeScript, UI Components |
| **UI/UX Designer** | Bekan Seifu | Addis Ababa, ET | Design System, Glass Morphism, Animations |
| **AI/ML Engineer** | Elshaday Habtamu | Addis Ababa, ET | GEE Integration, NDVI Models, Gemini AI |
| **Backend Engineer** | Abdi Megersa | Addis Ababa, ET | Express.js, APIs, Route Optimization |
| **Product/Other** | Dawit Getachew Tariku | Addis Ababa, ET | Documentation, Testing, Coordination |

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Location-Addis_Ababa%2C_Ethiopia-red?style=flat-square" alt="Location">
  <img src="https://img.shields.io/badge/Domain-Pastoral_Agriculture-green?style=flat-square" alt="Domain">
  <img src="https://img.shields.io/badge/Impact-Social_Good-blue?style=flat-square" alt="Impact">
</p>

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/Hope0351/PastureAI.git
cd PastureAI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `GEE_PROJECT_ID` | Google Earth Engine project ID | Yes |
| `GEE_PRIVATE_KEY` | GEE service account key | Yes |
| `OPEN_METEO_URL` | Open-Meteo base URL | No (has default) |
| `PORT` | Server port | No (default: 3000) |

### Available Scripts

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Docker (Optional)

```bash
docker build -t pastureai .
docker run -p 3000:3000 --env-file .env pastureai
```

---

## Project Stats

<p align="center">
  <img src="https://img.shields.io/badge/Frontend_Files-15+-blue?style=for-the-badge" alt="Frontend Files">
  <img src="https://img.shields.io/badge/Backend_Services-8+-green?style=for-the-badge" alt="Backend Services">
  <img src="https://img.shields.io/badge/CSS_Lines-940+-purple?style=for-the-badge" alt="CSS Lines">
  <img src="https://img.shields.io/badge/Screenshots-14+-orange?style=for-the-badge" alt="Screenshots">
</p>

### Code Metrics

| Category | Count |
|----------|-------|
| React Components | 15+ |
| Pages/Routes | 7 |
| Backend Services | 8 |
| CSS Design System | ~940 lines |
| API Endpoints | 12+ |
| External Integrations | 4 |
| Feature Screenshots | 14 |

---

## Security

- **No hardcoded secrets** -- All credentials via environment variables
- **`.env` in `.gitignore`** -- Prevents accidental secret commits
- **API Key validation** -- Server-side verification before external calls
- **Input sanitization** -- All user inputs validated and sanitized
- **CORS configuration** -- Restricted cross-origin access
- **Security headers** -- Helmet.js middleware ready

---

## Roadmap

### v1.1 -- Q3 2026
- [ ] Multi-language support (Amharic, Oromo, Somali)
- [ ] Offline-first capabilities with service workers
- [ ] Push notifications for alert thresholds
- [ ] Export to PDF/Excel for reports

### v1.2 -- Q4 2026
- [ ] Mobile apps (React Native / PWA)
- [ ] SMS/USSD integration for feature phones
- [ ] IoT sensor integration for ground truthing
- [ ] Community crowdsourcing features

### v2.0 -- 2027
- [ ] Federated learning across regions
- [ ] Drone imagery integration
- [ ] Blockchain for aid transparency
- [ ] Pan-African expansion

---

## Contributing

We welcome contributions! Please see our [CONTRIBUTORS.md](CONTRIBUTORS.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License -- see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Google** -- Earth Engine API & Gemini AI
- **Open-Meteo** -- Free weather API
- **Ethiopian Ministry of Agriculture** -- Domain expertise
- **Pastoral Communities** -- Inspiration and feedback

---

## Connect With Us

<div align="center">

| Platform | Link |
|----------|------|
| **GitHub** | [Hope0351/PastureAI](https://github.com/Hope0351/PastureAI) |
| **Email** | Contact team via contributor emails above |
| **Location** | Addis Ababa, Ethiopia |

</div>

<p align="center">
  <sub>Built with care for Ethiopian pastoral communities</sub>
</p>
