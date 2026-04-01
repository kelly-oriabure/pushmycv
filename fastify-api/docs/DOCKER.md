# Docker Setup Guide

## Overview

This project includes Docker and Docker Compose configurations for both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Install Docker

**Windows:**
- Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

**macOS:**
- Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## Quick Start

### Development Environment

1. **Copy environment file:**
```bash
cp .env.docker .env
```

2. **Update environment variables:**
Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **View logs:**
```bash
docker-compose logs -f api
```

5. **Access the application:**
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/docs
- Health Check: http://localhost:3000/health

### Production Environment

1. **Build production image:**
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Start production services:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Docker Commands

### Development

```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# Restart API service
docker-compose restart api

# Execute command in container
docker-compose exec api sh

# Install new npm package
docker-compose exec api npm install <package-name>
```

### Production

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

## Services

### API Service
- **Container:** `pushmycv-api`
- **Port:** 3000
- **Image:** Built from `Dockerfile.dev` (development) or `Dockerfile` (production)
- **Features:**
  - Hot reload in development
  - Health checks
  - Auto-restart on failure

### Redis Service
- **Container:** `pushmycv-redis`
- **Port:** 6379
- **Image:** `redis:7-alpine`
- **Features:**
  - Persistent data storage
  - Health checks
  - AOF (Append Only File) enabled

### Nginx Service (Production)
- **Container:** `pushmycv-nginx-prod`
- **Ports:** 80, 443
- **Image:** `nginx:alpine`
- **Features:**
  - Reverse proxy
  - Load balancing
  - Rate limiting
  - SSL/TLS support
  - Gzip compression

## File Structure

```
.
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
├── docker-compose.yml      # Development services
├── docker-compose.prod.yml # Production services
├── .dockerignore          # Files to exclude from build
├── .env.docker            # Environment template
└── nginx/
    └── nginx.conf         # Nginx configuration
```

## Environment Variables

### Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_JWT_SECRET` - JWT secret for token verification

### Optional
- `PORT` - API port (default: 3000)
- `HOST` - API host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)
- `WORKER_POLL_INTERVAL` - Worker polling interval in ms
- `WORKER_MAX_RETRIES` - Maximum retry attempts
- `REDIS_PASSWORD` - Redis password (production)

## Volumes

### Development
- `./src:/app/src` - Source code hot reload
- `./database:/app/database` - Database scripts
- `/app/node_modules` - Node modules (prevents overwrite)

### Production
- `redis-data` - Redis persistent storage

## Networking

All services communicate through the `pushmycv-network` bridge network.

**Service DNS:**
- API: `api:3000`
- Redis: `redis:6379`
- Nginx: `nginx:80`

## Health Checks

### API Health Check
```bash
curl http://localhost:3000/health
```

### Redis Health Check
```bash
docker-compose exec redis redis-cli ping
```

### Container Health Status
```bash
docker-compose ps
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose.yml
```

### Container Won't Start
```bash
# View detailed logs
docker-compose logs api

# Check container status
docker-compose ps

# Rebuild without cache
docker-compose build --no-cache
```

### Hot Reload Not Working
```bash
# Ensure volumes are mounted correctly
docker-compose down -v
docker-compose up -d
```

### Permission Issues (Linux)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## Development Workflow

### 1. Start Development Environment
```bash
docker-compose up -d
```

### 2. Make Code Changes
- Edit files in `src/`
- Changes auto-reload via volume mount

### 3. View Logs
```bash
docker-compose logs -f api
```

### 4. Run Database Migrations
```bash
# Execute SQL in Supabase dashboard or CLI
```

### 5. Test API
- Visit http://localhost:3000/docs
- Use Swagger UI to test endpoints

### 6. Stop Services
```bash
docker-compose down
```

## Production Deployment

### 1. Build Production Image
```bash
docker-compose -f docker-compose.prod.yml build
```

### 2. Configure Environment
```bash
# Create production .env file
cp .env.docker .env.production

# Update with production values
nano .env.production
```

### 3. Deploy
```bash
# Start with production config
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

### 4. Configure SSL (Optional)
```bash
# Add SSL certificates to nginx/ssl/
# Uncomment HTTPS server block in nginx.conf
# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Performance Optimization

### Multi-Stage Build
The production Dockerfile uses multi-stage builds to:
- Reduce image size
- Exclude dev dependencies
- Optimize layer caching

### Resource Limits (Production)
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

### Nginx Caching
Configure caching in `nginx.conf` for static assets.

## Security Best Practices

1. **Use non-root user** - Production container runs as `nodejs` user
2. **Environment secrets** - Never commit `.env` files
3. **Update base images** - Regularly update Node and Alpine versions
4. **Enable SSL/TLS** - Use HTTPS in production
5. **Rate limiting** - Nginx rate limits protect against abuse
6. **Health checks** - Automatic container restart on failure

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t pushmycv-api .
      - name: Run tests
        run: docker run pushmycv-api npm test
```

## Monitoring

### View Container Stats
```bash
docker stats
```

### View Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Inspect Container
```bash
docker-compose exec api sh
```

## Backup and Restore

### Backup Redis Data
```bash
docker-compose exec redis redis-cli BGSAVE
docker cp pushmycv-redis:/data/dump.rdb ./backup/
```

### Restore Redis Data
```bash
docker cp ./backup/dump.rdb pushmycv-redis:/data/
docker-compose restart redis
```

## Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Nginx Docker Documentation](https://hub.docker.com/_/nginx)

## Support

For issues or questions:
- Check container logs: `docker-compose logs -f`
- Verify environment variables
- Ensure Supabase credentials are correct
- Check port availability

Happy Dockerizing! 🐳
