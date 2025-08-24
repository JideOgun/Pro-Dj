# 🗄️ Database Setup Guide

## 1. PostgreSQL Database Options

### Option A: Managed Database Services (Recommended)

#### Vercel Postgres

```bash
# Install Vercel CLI
npm i -g vercel

# Create database
vercel postgres create

# Get connection string
vercel env pull .env.production
```

#### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### Railway

1. Go to [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Copy connection string

#### PlanetScale (MySQL alternative)

1. Go to [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string

### Option B: Self-Hosted

#### Digital Ocean Droplet

```bash
# Create Ubuntu 22.04 droplet
# SSH into droplet
ssh root@your-droplet-ip

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE prodj_production;
CREATE USER prodj_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE prodj_production TO prodj_user;
\q
```

#### AWS RDS

1. Go to AWS Console > RDS
2. Create PostgreSQL database
3. Configure security groups
4. Get endpoint URL

## 2. Database Configuration

### Connection String Format

```bash
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

### SSL Configuration

For production databases, ensure SSL is enabled:

```bash
DATABASE_URL="postgresql://username:password@host:port/database_name?sslmode=require"
```

## 3. Schema Migration

### Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Deploy migrations to production
npm run db:migrate

# Seed initial data
npm run seed
```

### Migration Commands

```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Generate new migration
npx prisma migrate dev --name your_migration_name
```

## 4. Initial Data Seeding

### Admin User Setup

The seed script creates:

- Admin user with credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- Sample DJ profiles
- Test data for development

### Custom Seeding

Edit `prisma/seed.ts` to customize initial data:

- Change admin credentials
- Add your DJ profiles
- Set up initial pricing
- Configure system settings

## 5. Database Backup Strategy

### Automated Backups

Most managed services provide automatic backups:

- **Vercel Postgres**: Automatic daily backups
- **Supabase**: Point-in-time recovery
- **Railway**: Automated backups included

### Manual Backup

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

### Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/
rm $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"
```

## 6. Performance Optimization

### Database Indexes

Key indexes are already defined in schema:

- User email (unique)
- DJ profile userId
- Booking relationships
- Mix and video relationships

### Query Optimization

- Use `include` for related data
- Implement pagination for large datasets
- Use database-level filtering

### Connection Pooling

For high-traffic applications:

```bash
# PgBouncer connection string
DATABASE_URL="postgresql://username:password@pooler-host:port/database_name"
```

## 7. Monitoring & Maintenance

### Health Checks

```bash
# Check database connection
npx prisma db push --preview-feature
```

### Performance Monitoring

- Monitor query performance
- Track connection counts
- Set up alerts for slow queries

### Regular Maintenance

- Update statistics
- Vacuum tables
- Monitor disk usage

## 8. Security Best Practices

### Access Control

- Use dedicated database user
- Limit permissions to necessary operations
- Enable SSL/TLS encryption

### Password Security

- Use strong, unique passwords
- Rotate credentials regularly
- Store in secure environment variables

### Network Security

- Whitelist application server IPs
- Use VPC/private networks when possible
- Enable audit logging

## 9. Environment-Specific Settings

### Development

```bash
DATABASE_URL="postgresql://localhost:5432/prodj_dev"
```

### Staging

```bash
DATABASE_URL="postgresql://user:pass@staging-host:5432/prodj_staging"
```

### Production

```bash
DATABASE_URL="postgresql://user:pass@prod-host:5432/prodj_production?sslmode=require"
```

## 10. Troubleshooting

### Common Issues

#### Connection Refused

- Check database server status
- Verify connection string
- Check firewall settings

#### Migration Errors

```bash
# Reset migration state
npx prisma migrate resolve --applied "migration_name"

# Force reset (WARNING: Deletes data)
npx prisma migrate reset --force
```

#### Performance Issues

- Check for missing indexes
- Analyze slow queries
- Consider connection pooling

### Debug Commands

```bash
# Test database connection
npx prisma db push

# View database schema
npx prisma studio

# Generate ERD
npx prisma generate --generator erd
```

---

**Next Step**: Choose your database provider and set up your production database.
