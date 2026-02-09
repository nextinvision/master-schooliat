#!/bin/bash

# Script to run database migrations for Phase 1 modules
# Usage: ./scripts/run-migration.sh

set -e

echo "🚀 Starting Phase 1 Database Migration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found. Make sure database credentials are set."
fi

# Navigate to backend directory
cd "$(dirname "$0")/.."

echo "📋 Step 1: Formatting Prisma schema..."
npm run prisma:format

echo ""
echo "📋 Step 2: Generating Prisma Client..."
npm run prisma:generate

echo ""
echo "📋 Step 3: Creating migration..."
echo "   This will create a new migration file for Phase 1 modules"
npm run prisma:migrate:create -- --name phase1_modules

echo ""
echo "📋 Step 4: Applying migration..."
echo "   This will apply the migration to your database"
npm run prisma:migrate

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the migration file in prisma/migrations/"
echo "   2. Test the API endpoints using: node test-phase1-apis.js"
echo "   3. Verify database schema matches expectations"

