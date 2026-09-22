# AI Virtual Try-On Platform

An AI-powered virtual try-on platform that lets customers upload their photo, paste a clothing URL, and receive realistic virtual try-on previews with size & fit recommendations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, TypeScript |
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2.0, Celery |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| AI | fal.ai FASHN API, MediaPipe |
| Infrastructure | Docker Compose |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- pnpm (`npm install -g pnpm`)

### Option 1: Docker (Recommended)

```bash
# Clone and configure
cp .env.example .env
# Edit .env with your FAL_KEY

# Start all services
docker compose up -d

# Run database migrations
docker compose exec api alembic upgrade head
```

Visit:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Celery Flower: http://localhost:5555

### Option 2: Local Development

```bash
# Install frontend dependencies
cd apps/web && pnpm install

# Install backend dependencies
cd apps/api && pip install -e ".[dev]"

# Start PostgreSQL and Redis (via Docker)
docker compose up db redis -d

# Run migrations
cd apps/api && alembic upgrade head

# Start services (in separate terminals)
cd apps/web && pnpm dev          # Frontend on :3000
cd apps/api && uvicorn app.main:app --reload  # API on :8000
cd apps/api && celery -A app.tasks.celery_app worker --loglevel=info  # Worker
```

## User Flow

```
Upload Photo → Paste Clothing URL → Enter Measurements → AI Try-On → Size & Fit Result → Buy
```

## Project Structure

```
ai-tryon-platform/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive Swagger documentation.

## License

MIT
