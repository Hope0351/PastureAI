# PastureAI — Team Contributors

## Project Overview
**PastureAI** is an AI-driven Ethiopian pastoral forage prediction & feed logistics platform that uses satellite vegetation monitoring (NDVI), weather intelligence, machine learning forecasting, and capacity-aware vehicle routing to help prevent livestock loss during drought conditions.

## Architecture & Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Express.js + TypeScript
- **Maps**: Leaflet.js with multiple basemap layers (CARTO Voyager, Esri Satellite, Sentinel-2)
- **AI/ML**: Google Earth Engine integration, statistical forecasting, Gemini AI fallback
- **Routing**: Clarke-Wright CVRP algorithm for feed delivery optimization
- **Visualization**: Recharts, Framer Motion animations

---

## Team Members & Contributions

### 🎨 Zeamanuel Million — Frontend Developer
**Role**: Frontend Development  
**Email**: zeamanuelmillion4@gmail.com  
**Location**: Addis Ababa  

**Contributions**:
- React component architecture & state management
- Page components (Overview, Climate, Satellite, Logistics, AI Brief, Livestock)
- UI components (MapComponent, StatsCards, Navbar, TimelineSlider, DistrictPanel)
- Interactive map interface with Leaflet.js integration
- Responsive design implementation
- Component composition patterns

**Files**:
```
src/App.tsx
src/main.tsx
src/pages/*.tsx
src/components/*.tsx
index.html
```

---

### 🎨 Bekan Seifu — UI/UX Designer
**Role**: Design System & Visual Design  
**Email**: dam09031@gmail.com  
**Location**: Addis Ababa  

**Contributions**:
- Premium design system with CSS custom properties
- Glass morphism UI patterns & effects
- Dark/Light theme implementation
- Color palette (Field Green, Signal Orange, Critical Red, Sky Blue)
- Typography system (Inter, Outfit, JetBrains Mono)
- Animation keyframes & transitions
- Map UI enhancements (premium popups, legends, controls)
- Visual hierarchy & spacing systems

**Files**:
```
src/index.css (Complete Design System)
public/assets/
```

---

### 🤖 Elshaday Habtamu — AI/ML Engineer
**Role**: Artificial Intelligence & Machine Learning  
**Email**: elshadayela4@gmail.com  
**Location**: Addis Ababa  

**Contributions**:
- Google Earth Engine (GEE) Sentinel-2 NDVI processing
- Machine learning forecasting algorithms
- Feed requirement estimation models
- AI-powered executive brief generation
- Gemini AI integration for insights
- Vegetation health prediction models
- Drought severity analysis

**Files**:
```
backend/services/aiAnalyzer.ts
backend/services/geeService.ts
backend/services/forecasting.ts
backend/services/feedEstimator.ts
```

---

### ⚙️ Abdi Megersa — Backend Developer
**Role**: Backend Development & API Architecture  
**Email**: abdimegersa02@gmail.com  
**Location**: Addis Ababa  

**Contributions**:
- Express.js server setup & configuration
- RESTful API architecture & endpoints
- Data processing pipelines
- Route optimization (Clarke-Wright CVRP algorithm)
- Weather data integration (Open-Meteo API)
- Caching layer implementation
- District geospatial data management
- Frontend API service layer

**Files**:
```
server.ts
backend/config/districtsData.ts
backend/services/dataProcessor.ts
backend/services/routeOptimizer.ts
backend/services/cache.ts
backend/services/weatherService.ts
src/services/api.ts
```

---

### 📋 Dawit Getachew Tariku — Technical Writer & Coordinator
**Role**: Documentation, Configuration & Project Management  
**Email**: dawitgetachew2580@gmail.com  
**Location**: Addis Ababa  

**Contributions**:
- Project configuration & build setup
- Package management & dependencies
- TypeScript configuration
- Environment variable templates
- Documentation (README, CONTRIBUTORS)
- Deployment configurations
- Project metadata & licensing
- Pitch materials & presentation docs

**Files**:
```
README.md
package.json
tsconfig.json
vite.config.ts
.env.example
metadata.json
CONTRIBUTORS.md
```

---

## How to Run

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Access at http://localhost:3000
```

## Environment Variables Required
- `GEMINI_API_KEY` — Google Gemini AI for executive briefs
- `GEE_SERVICE_ACCOUNT_EMAIL` — Google Earth Engine credentials
- `GEE_PRIVATE_KEY` — GEE authentication key
- `OPEN_METEO_BASE_URL` — Weather API endpoint (optional)

## License
MIT License — See LICENSE file for details

## Acknowledgments
- Sentinel-2 satellite imagery via Copernicus Programme & Google Earth Engine
- Weather data from Open-Meteo API
- Basemap tiles from CARTO (Voyager/Dark Matter layers)
- Routing inspired by Clarke-Wright Savings Algorithm
