<br>

<div align="center">

<img src="https://img.shields.io/badge/PastureAI-v1.0.0-16a34a?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTZhMzRhIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwUzE3LjUyMiAyIDEyIDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEweiIvPjxwYXRoIGQ9Ik0xMiA2djYtNG0wIDRNNCAxNWgxNiIvPjwvc3ZnPg==" alt="PastureAI Logo" />

# **PastureAI**

### *AI-Powered Ethiopian Pastoral Forage Intelligence & Feed Logistics Platform*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Contributors](https://img.shields.io/badge/Contributors-5-blueviolet?style=for-the-badge)](CONTRIBUTORS.md)

**Predict pasture collapse before it happens. Quantify livestock at risk. Dispatch capacity-aware feed routes.**

Built for NGOs, humanitarian operators, and impact investors serving Ethiopia's 50+ million pastoral livestock.

</div>

---

<br>

<div align="center">

## **Mission**

> **Empowering pastoral communities with satellite-driven intelligence to prevent livestock loss during drought emergencies — transforming reactive aid into predictive action.**

</div>

---

<br>

## **Table of Contents**

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Environment Configuration](#-environment-configuration)
- [Project Structure](#-project-structure)
- [Demo Flow](#-demo-flow)
- [Team](#-team-contributors)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

<br>

## **Features**

| Module | Capability | Status |
|--------|------------|--------|
| **Satellite Intelligence** | Sentinel-2 NDVI via weather-assimilated phenology; live Google Earth Engine integration | ![Live](https://img.shields.io/badge/-Live-brightgreen?style=flat-square) |
| **Climate Monitoring** | Real-time Open-Meteo rainfall, temperature, drought & heat stress indices per district | ![Live](https://img.shields.io/badge/-Live-brightgreen?style=flat-square) |
| **Forecasting Engine** | Ensemble ML: moving average + Holt linear trend + quadratic regression on NDVI history | ![Active](https://img.shields.io/badge/-Active-yellow?style=flat-square) |
| **Feed Estimation** | TLU-based deficit calculation and economic loss at risk quantification | ![Active](https://img.shields.io/badge/-Active-yellow?style=flat-square) |
| **Route Optimization** | Clarke-Wright savings CVRP algorithm with truck capacity & depot stock validation | ![Ready](https://img.shields.io/badge/-Ready-blue?style=flat-square) |
| **AI Executive Briefs** | Gemini-powered district action plans with rules-engine fallback | ![Optional](https://img.shields.io/badge/-Optional-orange?style=flat-square) |

---

<br>

## **Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PASTUREAI PLATFORM                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   FRONTEND      │  │   BACKEND       │  │   AI/ML LAYER   │    │
│  │                 │  │                 │  │                 │    │
│  │  React 19       │──│  Express.js     │──│  Google Earth   │    │
│  │  TypeScript     │  │  TypeScript     │  │  Engine          │    │
│  │  Vite 6         │  │  REST APIs      │  │  Gemini AI      │    │
│  │  Tailwind v4    │  │  CVRP Solver    │  │  Forecasting    │    │
│  │  Leaflet Maps   │  │  Cache Layer    │  │  Feed Models    │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│           │                   │                    │               │
│           └───────────────────┼────────────────────┘               │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     DATA SOURCES                             │  │
│  │  Sentinel-2 │ Open-Meteo │ District GeoJSON │ GEE Assets   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

<br>

## **Tech Stack**

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react) | 19.x | UI Component Library |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript) | 5.8.x | Type Safety |
| ![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite) | 6.x | Build Tool |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss) | 4.x | Utility CSS |
| ![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=openstreetmap) | 1.9.x | Interactive Maps |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=flat-square) | 12.x | Animations |
| ![Recharts](https://img.shields.io/badge/Recharts-2-FC6076?style=flat-square) | 2.x | Data Visualization |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js) | 20+ | Runtime |
| ![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express) | 4.21.x | HTTP Server |
| ![Google Earth Engine](https://img.shields.io/badge/GEE-1.7-4285F4?style=flat-square&logo=google) | 1.7.x | Satellite Processing |
| ![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.4-4285F4?style=flat-square&logo=google) | 2.4.x | Executive Briefs |

---

<br>

## **Quick Start**

### **Prerequisites**

- ![Node.js >= 20](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat-square&logo=node.js)
- ![npm](https://img.shields.io/badge/npm-latest-CB3837?style=flat-square&logo=npm) or ![pnpm](https://img.shields.io/badge/pnpm-latest-F69220?style=flat-square&logo=pnpm)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/Hope0351/PastureAI.git
cd PastureAI

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# Start development server
npm run dev
```

### **Access**

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

<br>

## **API Endpoints**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Service status matrix (live/modeled/fallback) | None |
| `GET` | `/api/districts` | Fast district list without AI processing | None |
| `GET` | `/api/dashboard` | Executive KPIs including economic loss at risk | None |
| `GET` | `/api/routing` | CVRP dispatch plan with feasibility flags | None |
| `GET` | `/api/analysis?district={id}` | AI or rules-engine brief for specific district | None |
| `GET` | `/api/map/sentinel2/tiles/{z}/{x}/{y}` | Sentinel-2 tile proxy through GEE | GEE Key |

---

<br>

## **Environment Configuration**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Recommended | — | Enables live AI executive briefs; falls back to rules-engine |
| `GEE_SERVICE_ACCOUNT_EMAIL` | Optional | — | Google Earth Engine service account email |
| `GEE_PRIVATE_KEY` | Optional | — | GEE service account private key (PEM format) |
| `OPEN_METEO_BASE_URL` | Optional | `https://api.open-meteo.com/v1` | Weather API base URL |
| `PORT` | Optional | `3000` | Server listening port |
| `NODE_ENV` | Optional | `development` | Environment mode |

<details>
<summary><strong>🔧 Full .env.example</strong></summary>

```bash
# ============================================
# PastureAI — Environment Configuration
# ============================================

# Google Gemini AI (for executive briefs & insights)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Earth Engine (for Sentinel-2 NDVI processing)
GEE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Open-Meteo Weather API (free tier, no key required)
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS if needed)
FRONTEND_URL=http://localhost:5173
```

</details>

---

<br>

## **Project Structure**

```
PastureAI/
├── 📁 backend/
│   ├── 📁 config/
│   │   └── districtsData.ts        # Geospatial district boundaries
│   └── 📁 services/
│       ├── aiAnalyzer.ts            # Gemini AI executive brief generation
│       ├── cache.ts                 # Response caching layer
│       ├── dataProcessor.ts         # Data transformation pipelines
│       ├── feedEstimator.ts         # TLU-based feed deficit models
│       ├── forecasting.ts           # Ensemble ML forecasting engine
│       ├── geeService.ts            # Google Earth Engine integration
│       ├── routeOptimizer.ts        # Clarke-Wright CVRP solver
│       └── weatherService.ts        # Open-Meteo weather data
│
├── 📁 public/
│   └── 📁 landing/                  # Hero imagery assets
│
├── 📁 src/
│   ├── 📁 components/              # React UI components
│   │   ├── DistrictPanel.tsx        # Zone detail inspector
│   │   ├── InterventionImpactPanel.tsx
│   │   ├── MapComponent.tsx         # Premium Leaflet map interface
│   │   ├── NdviChart.tsx            # Vegetation index visualization
│   │   ├── Navbar.tsx               # Glass morphism navigation
│   │   ├── StatsCards.tsx           # Animated metric cards
│   │   ├── StatusBanner.tsx         # System health indicators
│   │   ├── TimelineSlider.tsx       # Forecast horizon selector
│   │   └── WeatherChart.tsx         # Climate data charts
│   │
│   ├── 📁 pages/                   # Route-level page components
│   │   ├── AiBriefPage.tsx          # Executive briefing view
│   │   ├── ClimatePage.tsx          # Weather intelligence dashboard
│   │   ├── LandingPage.tsx          # Hero / landing experience
│   │   ├── LivestockPage.tsx        # Herd pressure analysis
│   │   ├── LogisticsPage.tsx        # Route dispatch management
│   │   ├── OverviewPage.tsx         # Main command dashboard
│   │   └── SatellitePage.tsx        # Remote sensing panel
│   │
│   ├── 📁 services/
│   │   └── api.ts                  # Frontend API client
│   │
│   ├── App.tsx                      # Root application component
│   ├── index.css                    # Complete design system (940+ lines)
│   ├── main.tsx                     # Application entry point
│   └── types.ts                     # TypeScript type definitions
│
├── .env.example                     # Environment variable template
├── .gitignore                       # Git ignore rules
├── CONTRIBUTORS.md                  # Team credits & roles
├── index.html                       # Vite HTML entry
├── metadata.json                    # Project metadata
├── package.json                     # Dependencies & scripts
├── README.md                        # This file
├── server.ts                        # Express server entry point
├── tsconfig.json                    # TypeScript configuration
└── vite.config.ts                   # Vite build configuration
```

---

<br>

## **Demo Flow**

### **3-Minute Investor Walkthrough**

| Step | Page | Key Insight | Action |
|------|------|-------------|--------|
| **1** | Command Overview | National risk map showing $M USD at risk | Adjust timeline slider (+30d to +60d horizon) |
| **2** | Remote Sensing | Live NDVI with honest data-source badge | Click district polygon to inspect details |
| **3** | Climate Intelligence | Real-time rainfall & temperature per zone | Review drought severity indices |
| **4** | Route Logistics | Feasible vs shortfall truck schedule | Validate depot stock levels |
| **5** | AI Executive Brief | Print-ready district action plan | Export or share intervention strategy |

---

<br>

## **Team Contributors**

<div align="center">

| Role | Name | Location | Focus Area |
|------|------|----------|------------|
| **Frontend** | <a href="mailto:zeamanuelmillion4@gmail.com">**Zeamanuel Million**</a> | Addis Ababa | React Architecture, Interactive Maps |
| **Design** | <a href="mailto:dam09031@gmail.com">**Bekan Seifu**</a> | Addis Ababa | Design System, UI/UX, Visual Identity |
| **AI/ML** | <a href="mailto:elshadayela4@gmail.com">**Elshaday Habtamu**</a> | Addis Ababa | Earth Engine, Forecasting, Gemini AI |
| **Backend** | <a href="mailto:abdimegersa02@gmail.com">**Abdi Megersa**</a> | Addis Ababa | Express APIs, Route Optimization, Data Pipelines |
| **Coordination** | <a href="mailto:dawitgetachew2580@gmail.com">**Dawit Getachew Tariku**</a> | Addis Ababa | Documentation, Config, Project Management |

</div>

<details>
<summary><strong>📊 Detailed Contributions</strong></summary>

### **Zeamanuel Million** — Frontend Developer
- React 19 component architecture with TypeScript strict mode
- Page components: Overview, Climate, Satellite, Logistics, AI Brief, Livestock
- UI components: MapComponent, StatsCards, Navbar, TimelineSlider, DistrictPanel
- Leaflet.js interactive map with multi-layer basemap support
- Responsive design with mobile-first approach
- State management and composition patterns

### **Bekan Seifu** — UI/UX Designer  
- Complete CSS design system with 940+ lines of custom properties
- Glass morphism UI patterns with backdrop-blur effects
- Dark/Light theme system with full variable override architecture
- Semantic color palette: Field Green (#1e6b42), Signal Orange (#c47a1c), Critical Red (#b83c3c), Sky Blue (#2563a3)
- Typography system: Inter (body), Outfit (display), JetBrains Mono (code)
- Animation library: fade-up, scale-in, gradient-shift, shimmer, pulse-ring
- Premium map UI: popups, legends, coordinate display, layer switcher

### **Elshaday Habtamu** — AI/ML Engineer
- Google Earth Engine (GEE) Sentinel-2 NDVI tile processing pipeline
- Machine learning forecasting ensemble (moving average + Holt trend + quadratic regression)
- TLU-based feed requirement estimation models
- Gemini AI-powered executive brief generation with fallback logic
- Vegetation health prediction and anomaly detection
- Drought severity scoring and risk classification

### **Abdi Megersa** — Backend Developer
- Express.js server with TypeScript configuration and middleware
- RESTful API architecture: health, districts, dashboard, routing, analysis endpoints
- Clarke-Wight Savings Algorithm implementation for CVRP route optimization
- Open-Meteo weather API integration with caching layer
- Geospatial district data management and GeoJSON processing
- Frontend API service layer with error handling

### **Dawit Getachew Tariku** — Technical Writer & Coordinator
- Project configuration: package.json, tsconfig.json, vite.config.ts
- Environment variable templates and documentation
- Comprehensive README and CONTRIBUTORS documentation
- Build system setup and dependency management
- Project metadata and licensing configuration

</details>

---

<br>

## **Roadmap**

### **Phase 1 — Foundation** ✅ Complete
- [x] Core platform architecture
- [x] Satellite NDVI visualization
- [x] Basic weather integration
- [x] Premium UI design system
- [x] Multi-role team contribution structure

### **Phase 2 — Intelligence** 🔄 In Progress
- [ ] Live Google Earth Engine tile streaming
- [ ] Gemini AI executive briefs production
- [ ] Advanced ensemble forecasting
- [ ] Real-time alert system
- [ ] Mobile-responsive optimization

### **Phase 3 — Operations** 📋 Planned
- [ ] Multi-depot inventory management
- [ ] Fleet tracking integration
- [ ] SMS/USSD alerts for herders
- [ ] Offline-first PWA capability
- [ ] Amharic/Afaan Oromo localization

### **Phase 4 — Scale** 🔮 Future
- [ ] Regional expansion (Kenya, Somalia)
- [ ] Mobile apps (iOS/Android)
- [ ] Partner NGO API integrations
- [ ] Satellite tasking automation
- [ ] Blockchain-audited aid distribution

---

<br>

## **Contributing**

We welcome contributions from the community! Here's how to get started:

### **Development Workflow**

```bash
# Fork and clone
git clone https://github.com/<your-username>/PastureAI.git
cd PastureAI

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run dev
npm run lint

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### **Code Standards**
- TypeScript strict mode enabled
- Follow existing code style (Prettier configured)
- Write tests for new features
- Update documentation as needed

### **Commit Message Format**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

<br>

## **Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Express + Vite on port 3000) |
| `npm run build` | Production build (Vite client + esbuild server bundle) |
| `npm run start` | Run production server from dist/ |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove dist/ build artifacts |

---

<br>

## **License**

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 PastureAI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<br>

## **Acknowledgments**

| Resource | Contribution |
|----------|---------------|
| **Copernicus Programme** | Sentinel-2 satellite imagery (free & open) |
| **Google Earth Engine** | Cloud geospatial processing platform |
| **Open-Meteo** | Free weather forecast API |
| **CARTO** | Basemap tiles (Voyager, Dark Matter layers) |
| **Esri** | World Imagery satellite basemap |
| **Clarke & Wright** | Vehicle Routing Problem algorithm foundation |
| **Leaflet.js** | Interactive map library |
| **React Community** | Component ecosystem and tooling |

---

<br>

<div align="center">

### **Built with purpose for Ethiopia's pastoral communities**

[![Star History Chart](https://api.star-history.com/svg?repos=Hope0351/PastureAI&type=Date)](https://star-history.com/#Hope0351/PastureAI&Date)

**If this project helped you**, please consider giving it a ⭐

</div>

<br>

<div align="center">

**PastureAI** © 2025 — Made with care by the team above

</div>
