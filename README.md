# priv8sus - Sports Prediction App

## Services
- **api** - Backend API (Node.js/TypeScript)
- **frontend** - React + Vite frontend
- **infra** - Docker & infrastructure configs
- **ml-pipeline** - Machine learning models & data processing

## Quick Start
```bash
# 1. Copy environment config
cp .env.example .env

# 2. Start API
cd api && npm run dev

# 3. Start Frontend (separate terminal)
cd frontend && npm run dev

# 4. ML Pipeline
cd ml-pipeline && source venv/bin/activate && pip install -r requirements.txt
```

## Architecture
All services run locally on the Mac Mini. No cloud providers needed for development.
