# 🚨 PRODUCTION SAFETY GUIDELINES

## ⚠️ CRITICAL: NEVER RESET PRODUCTION DATABASE

### What Happened
- Database was accidentally reset during migration
- All production data was lost
- Users, bookings, and content were deleted

### How to Prevent This

#### 1. **NEVER Use These Commands in Production:**
```bash
# ❌ NEVER DO THESE IN PRODUCTION
npx prisma migrate reset --force
npx prisma db push --force-reset
docker exec -it container_name npx prisma migrate reset
```

#### 2. **Safe Migration Commands for Production:**
```bash
# ✅ SAFE - Apply new migrations only
npx prisma migrate deploy

# ✅ SAFE - Generate Prisma client
npx prisma generate

# ✅ SAFE - Check migration status
npx prisma migrate status
```

#### 3. **Development vs Production Database:**
- **Development**: Use Docker containers (localhost:5432)
- **Production**: Use Vercel Postgres (remote database)

#### 4. **Before Running Any Database Commands:**
1. Check `NODE_ENV` environment variable
2. Verify you're connected to the right database
3. Confirm you're in development environment
4. Use `--dry-run` flags when possible

#### 5. **Emergency Recovery:**
If production database is accidentally reset:
1. Check Vercel Postgres backups
2. Run restoration script: `node scripts/restore-production.js`
3. Update all user passwords
4. Notify users of data loss

### Environment Variables to Check:
```bash
# Development
DATABASE_URL=postgresql://postgres:password@localhost:5432/pro_dj_dev

# Production  
DATABASE_URL=postgresql://...@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Safety Checklist:
- [ ] Verify environment before running database commands
- [ ] Use `migrate deploy` instead of `migrate reset`
- [ ] Test migrations in development first
- [ ] Backup production data before major changes
- [ ] Use dry-run flags when available

### Emergency Contacts:
- Vercel Support for database recovery
- Check Vercel Postgres dashboard for backups
- Use restoration scripts for quick recovery

---

**Remember: Production data is valuable and irreplaceable. Always err on the side of caution.**
