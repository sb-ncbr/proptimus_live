#!/bin/sh
set -e

# Replace environment variable placeholders in built files
echo "Replacing environment variables in built files..."

# Find all JS files in .next and replace placeholders
find .next -type f -name "*.js" -exec sed -i \
  -e "s|NEXT_PUBLIC_APP_NAME_PLACEHOLDER|${NEXT_PUBLIC_APP_NAME:-FFFold}|g" \
  -e "s|NEXT_PUBLIC_API_URL_PLACEHOLDER|${NEXT_PUBLIC_API_URL:-http://localhost:5000}|g" \
  {} +

echo "Environment variables replaced successfully"
echo "NEXT_PUBLIC_APP_NAME: ${NEXT_PUBLIC_APP_NAME:-FFFold}"
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:5000}"

# Start the Next.js server
exec node server.js
