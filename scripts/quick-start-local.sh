#!/bin/bash

# Quick Start Script for Local Development
# This script sets up everything needed for local development

echo "🚀 SafeTap Local Development Setup"
echo "=================================="
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Setting up local PostgreSQL database..."
node scripts/create-local-db.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to set up database"
    exit 1
fi

echo
echo "🔄 Applying migrations to main project..."
npx prisma migrate deploy

echo
echo "🔄 Applying migrations to backoffice..."
cd backoffice && npx prisma migrate deploy
cd ..

echo
echo "⚡ Generating Prisma clients..."
npx prisma generate
cd backoffice && npx prisma generate
cd ..

echo
echo "✅ Setup completed successfully!"
echo
echo "🎯 Next steps:"
echo "1. Start main app: npm run dev"
echo "2. Start backoffice: cd backoffice && npm run dev"
echo "3. Open http://localhost:3000 (main app)"
echo "4. Open http://localhost:3001 (backoffice)"
echo
echo "🔧 Database connection:"
echo "   docker exec -it pg-local psql -U postgres -d safetap_dev"
echo
echo "📚 See ENVIRONMENT_GUIDE.md for more details"
