#!/bin/bash

echo "🔍 Managing Prisma Studio..."

# Check if Prisma Studio container is running
if docker ps | grep -q "pro-dj-prisma-studio"; then
    echo "✅ Prisma Studio is already running!"
    echo "🌐 Access it at: http://localhost:5555"
    echo ""
    echo "📝 To stop Prisma Studio:"
    echo "   docker-compose -f docker-compose.dev.yml stop prisma-studio"
    echo ""
    echo "📝 To restart Prisma Studio:"
    echo "   docker-compose -f docker-compose.dev.yml restart prisma-studio"
else
    echo "🚀 Starting Prisma Studio..."
    docker-compose -f docker-compose.dev.yml up -d prisma-studio
    
    # Wait a moment for it to start
    sleep 5
    
    # Check if it's running
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5555 | grep -q "200"; then
        echo "✅ Prisma Studio is running!"
        echo "🌐 Access it at: http://localhost:5555"
    else
        echo "❌ Failed to start Prisma Studio. Check logs with:"
        echo "   docker logs pro-dj-prisma-studio"
    fi
fi
