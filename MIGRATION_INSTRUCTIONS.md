# Migration Instructions - Platform Config

## Migration Status

✅ **Migration file created**: `/Backend/src/prisma/db/migrations/20260217074940_add_platform_config_to_settings/migration.sql`

## Automatic Deployment

The migration will be **automatically applied** when you deploy to production or staging via GitHub Actions. The deployment workflow includes:

```bash
npm run prisma:migrate:deploy
```

## Manual Execution (If Needed)

If you need to run the migration manually on the server:

### Option 1: Via Prisma CLI (Recommended)

```bash
cd /opt/schooliat/backend/production/current  # or staging/current
export DATABASE_URL="your_database_url_here"
npx prisma migrate deploy
```

### Option 2: Direct SQL Execution

If you have direct database access:

```sql
ALTER TABLE "settings" ADD COLUMN "platform_config" JSONB;
```

### Option 3: Via SSH to Production Server

```bash
# SSH to your production server
ssh user@your-server

# Navigate to backend directory
cd /opt/schooliat/backend/production/current

# Set database URL
export DATABASE_URL="your_production_database_url"

# Run migration
npx prisma migrate deploy
```

## Verification

After migration is applied, verify it was successful:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name = 'platform_config';
```

Expected result:
- `column_name`: `platform_config`
- `data_type`: `jsonb`
- `is_nullable`: `YES`

## Migration Details

- **Migration Name**: `20260217074940_add_platform_config_to_settings`
- **Action**: Adds `platform_config` JSONB column to `settings` table
- **Backward Compatible**: Yes (column is nullable)
- **Rollback**: Not needed (can be dropped if required)

## Next Steps

1. ✅ Migration file created
2. ⏳ Commit and push to trigger deployment
3. ⏳ Migration will run automatically on deployment
4. ✅ Backend code ready to use `platformConfig`
5. ✅ Frontend component ready to use the new field

## Important Notes

- The migration is **safe** - it only adds a new nullable column
- Existing records will have `NULL` for `platform_config` (handled gracefully)
- No data loss or downtime expected
- The migration will be applied automatically on next deployment

