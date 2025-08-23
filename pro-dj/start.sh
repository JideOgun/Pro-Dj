#!/bin/sh

# Start PostgreSQL in the background
docker-entrypoint.sh postgres &

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h localhost -p 5432 -U postgres; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pro_dj?schema=public"
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
npm run dev
