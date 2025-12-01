# FFFold UI Docker Build Instructions

## Quick Start

```bash
# Build the image
docker build -t fffold-ui \
  --build-arg NEXT_PUBLIC_APP_NAME="FFFold" \
  --build-arg NEXT_PUBLIC_API_URL="http://your-api-url:5000" \
  .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_NAME="FFFold" \
  -e NEXT_PUBLIC_API_URL="http://your-api-url:5000" \
  fffold-ui
```

## Using Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Environment Variables

- `NEXT_PUBLIC_APP_NAME` - Application name (default: "FFFold")
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: "http://localhost:5000")

## Production Deployment

```bash
# Build for production
docker build -t fffold-ui:prod \
  --build-arg NEXT_PUBLIC_APP_NAME="FFFold" \
  --build-arg NEXT_PUBLIC_API_URL="https://api.your-domain.com" \
  .

# Run in production
docker run -d \
  --name fffold-ui \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NEXT_PUBLIC_APP_NAME="FFFold" \
  -e NEXT_PUBLIC_API_URL="https://api.your-domain.com" \
  fffold-ui:prod
```

## Notes

- The app runs on port 3000 by default
- Make sure your API URL is accessible from the container
- For production, use a reverse proxy (nginx/traefik) in front
