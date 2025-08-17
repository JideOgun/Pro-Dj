# Pro-DJ Docker Setup Guide

This guide will help you rebuild your Pro-DJ application environment using Docker after a container crash or factory reset.

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository if needed)

## Quick Start

1. **Navigate to the project directory:**

   ```bash
   cd pro-dj
   ```

2. **Run the setup script:**

   ```bash
   ./setup-docker.sh
   ```

   This script will:

   - Clean up any existing containers
   - Build the Docker images
   - Start PostgreSQL, Redis, and your application
   - Set up the database with migrations

3. **Access your application:**
   - Main app: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

## Manual Setup

If you prefer to set up manually:

### Development Environment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Start production environment
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Environment Variables

You'll need to set up the following environment variables in the docker-compose files:

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `REDIS_URL` - Redis connection string (auto-configured)

### External Services (Uncomment and configure as needed)

- `AWS_ACCESS_KEY_ID` - AWS S3 access key
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `AWS_REGION` - AWS region
- `AWS_S3_BUCKET` - S3 bucket name
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - NextAuth.js URL
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `RESEND_API_KEY` - Resend email API key

## Database Management

### Reset Database

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Remove database volume
docker volume rm pro-dj_postgres_data_dev

# Restart
docker-compose -f docker-compose.dev.yml up --build -d
```

### Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate deploy

# Seed database
docker-compose -f docker-compose.dev.yml exec app npm run seed
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U pro_dj_user -d pro_dj_dev
```

## Troubleshooting

### Container Won't Start

1. Check Docker logs:

   ```bash
   docker-compose -f docker-compose.dev.yml logs
   ```

2. Ensure ports are available:
   - 3000 (app)
   - 5432 (database)
   - 6379 (redis)

### Database Connection Issues

1. Wait for PostgreSQL to fully start (can take 10-15 seconds)
2. Check if database container is running:
   ```bash
   docker ps | grep postgres
   ```

### Build Issues

1. Clear Docker cache:

   ```bash
   docker system prune -a
   ```

2. Rebuild without cache:
   ```bash
   docker-compose -f docker-compose.dev.yml build --no-cache
   ```

## File Structure

```
pro-dj/
├── Dockerfile              # Production Docker image
├── Dockerfile.dev          # Development Docker image
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── .dockerignore           # Files to exclude from build
├── setup-docker.sh         # Automated setup script
└── DOCKER_README.md        # This file
```

## Useful Commands

```bash
# View running containers
docker ps

# View container logs
docker logs pro-dj-app-dev

# Execute commands in container
docker-compose -f docker-compose.dev.yml exec app sh

# Backup database
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U pro_dj_user pro_dj_dev > backup.sql

# Restore database
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U pro_dj_user pro_dj_dev < backup.sql
```

## Next Steps

After your environment is running:

1. **Configure external services** (AWS S3, Stripe, etc.)
2. **Set up environment variables** for production
3. **Test the application** functionality
4. **Seed the database** with initial data if needed

For more information about the application, see the main README.md file.
