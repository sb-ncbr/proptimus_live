# FFFold Backend Docker Build Instructions

## Quick Start

### Build and run backend only:

```bash
cd api/FFFold

# Build the image
docker build -t fffold-api .

# Run the container
docker run -p 5000:5000 \
  -v $(pwd)/app/calculated_structures:/app/app/calculated_structures \
  fffold-api
```

### Using Docker Compose (backend only):

```bash
cd api/FFFold
docker-compose up -d
```

## Full Stack Deployment

### Run both frontend and backend together:

```bash
# From the project root directory
cd /home/mysiak/ICS-MUNI/fffold

# Build and start both services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f fffold-api
docker-compose logs -f fffold-ui

# Stop all services
docker-compose down
```

## Services

- **fffold-api**: Flask backend running on port 5000
- **fffold-ui**: Next.js frontend running on port 3000

## Environment Variables (Backend)

- `FLASK_ENV` - Flask environment (default: production)
- `FLASK_APP` - Flask application module (default: routes.py)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `XTB_PATH` - Path to xtb binary (default: /opt/miniconda3/bin/xtb)
- `OBABEL_PATH` - Path to obabel binary (default: /opt/miniconda3/bin/obabel)

## Data Persistence

The `calculated_structures` directory is mounted as a volume to persist data between container restarts.

## Network Communication

Both containers run in the same Docker network (`fffold-network`) and can communicate using service names:
- Frontend calls backend at: `http://fffold-api:5000`
- Backend is accessible from host at: `http://localhost:5000`
- Frontend is accessible from host at: `http://localhost:3000`

## Production Deployment

For production, you should:

1. Use a reverse proxy (nginx/traefik)
2. Set specific CORS origins
3. Use proper secrets management
4. Consider using Docker secrets or environment files
5. Set up SSL/TLS certificates

Example with specific CORS:

```bash
docker-compose up -d \
  -e CORS_ORIGINS=https://fffold.your-domain.com
```

## Troubleshooting

### Check if services are running:
```bash
docker-compose ps
```

### Check logs:
```bash
docker-compose logs -f fffold-api
```

### Restart a specific service:
```bash
docker-compose restart fffold-api
```

### Rebuild after code changes:
```bash
docker-compose up -d --build
```
