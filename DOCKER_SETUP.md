# Docker Setup Guide

This project supports two Docker configurations:

## 1. Multi-Container Setup (Recommended for Development)

**File:** `docker-compose.yml`

This setup runs each service in its own container:
- **web**: Next.js frontend (port 3000)
- **api**: Fastify API server (port 3001)
- **worker**: Fastify queue worker
- **agentic**: Python agentic worker

### Usage

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Advantages
- ✅ Isolated services
- ✅ Independent scaling
- ✅ Better resource management
- ✅ Hot reload support with volumes
- ✅ Easier debugging (separate logs per service)

---

## 2. Single-Container Setup (Unified Image)

**Files:** 
- `Dockerfile.unified`
- `docker-compose.unified.yml`
- `supervisord.conf`

This setup runs all services (frontend, API, workers) in a single container using supervisord as the process manager.

### Usage

```bash
# Build and start
docker-compose -f docker-compose.unified.yml up

# Start in background
docker-compose -f docker-compose.unified.yml up -d

# View logs
docker-compose -f docker-compose.unified.yml logs -f

# Stop
docker-compose -f docker-compose.unified.yml down
```

### Advantages
- ✅ Single image to deploy
- ✅ Simpler deployment in constrained environments
- ✅ Lower memory overhead (shared base image)
- ✅ All services guaranteed to be on same version

### Disadvantages
- ❌ All services restart together
- ❌ Harder to scale individual services
- ❌ Single point of failure
- ❌ More complex debugging

---

## Environment Variables

Both setups require the same environment variables. Create a `.env` file:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
FASTIFY_SUPABASE_URL=your_fastify_supabase_url
FASTIFY_SUPABASE_KEY=your_fastify_supabase_key

# API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

---

## Fixes Applied

### Fixed Issues in `docker-compose.yml`:
1. ✅ Changed `./pushmycv-web` → `./frontend`
2. ✅ Changed `./pushmycv-api` → `./fastify-api`
3. ✅ Changed `./pushmycv-agentic` → `./agentic`
4. ✅ Fixed agentic command: `python -m pushmycv_agentic.worker` → `python -m agentic.workers.queue_worker`

---

## Choosing Between Setups

**Use Multi-Container (`docker-compose.yml`) when:**
- Developing locally
- Need hot reload
- Want to scale services independently
- Need isolated debugging

**Use Single-Container (`docker-compose.unified.yml`) when:**
- Deploying to production with container count limits
- Need simplest possible deployment
- Running on resource-constrained systems
- Want guaranteed service version consistency
