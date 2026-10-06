# GeoDhara

> **“An Integrated GIS-based Digital Public Infrastructure for Land Governance”**  
> **UI Tagline:** *“One parcel. One identity.”*  
> **Problem Statement:** SIH 2026 — PS 26014

---

## 📌 Demo Disclaimer
**DEMO ENVIRONMENT:** All data is synthetic. Government integrations are represented by mock adapters. No real citizen or government records are accessed.

---

## 🚀 Quick Start (Single Command)

### Using Docker Compose:
```bash
docker compose up --build -d
```
Once started:
- **Web Application:** http://localhost:3000
- **API Server & Health:** http://localhost:4000/api/health
- **OpenAPI Swagger UI:** http://localhost:4000/docs

---

### Running Locally (Without Docker):
1. **Ensure PostgreSQL + PostGIS & Redis are running.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run Migrations & Synthetic Seed Data:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. **Start Development Servers:**
   ```bash
   npm run dev
   ```

---

## 🏛️ System Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Leaflet, OpenStreetMap, PWA, Dexie (IndexedDB), Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, REST APIs, Zod, JWT, bcrypt, Redis, OpenAPI / Swagger |
| **Database** | PostgreSQL 16 + PostGIS 3.4 (`EPSG:4326` with `ST_Area(geom::geography)` calculation) |
| **Infrastructure** | Docker, Docker Compose |
| **Testing** | Vitest, Supertest |

---

## 🔑 Demo Personas

- **Citizen:** `citizen@geodhara.demo` / `DemoCitizen@123`
- **Revenue Officer:** `officer@geodhara.demo` / `DemoOfficer@123`
- **Field Surveyor:** `field@geodhara.demo` / `DemoField@123`
- **Administrator:** `admin@geodhara.demo` / `DemoAdmin@123`

---

## 🧪 Running Tests
```bash
npm test
```
