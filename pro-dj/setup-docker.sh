#!/bin/bash

echo "🚀 Setting up Pro-DJ Docker Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads
mkdir -p public/uploads

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
docker-compose -f docker-compose.yml down -v 2>/dev/null || true

# Remove existing images
echo "🗑️  Removing existing images..."
docker rmi pro-dj_app pro-dj_app-dev 2>/dev/null || true

# Build and start development environment
echo "🔨 Building and starting development environment..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker ps | grep -q "pro-dj-app-dev"; then
    echo "✅ Pro-DJ application is running!"
    echo "🌐 Access your application at: http://localhost:3000"
    echo "🗄️  Database is available at: localhost:5432"
    echo "🔴 Redis is available at: localhost:6379"
    echo ""
    echo "📝 To view logs: docker-compose -f docker-compose.dev.yml logs -f app"
    echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
else
    echo "❌ Failed to start containers. Check logs with:"
    echo "docker-compose -f docker-compose.dev.yml logs"
fi
