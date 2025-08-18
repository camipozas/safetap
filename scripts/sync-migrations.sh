#!/bin/bash

# Script to sync migrations between main app and backoffice
# Usage: ./scripts/sync-migrations.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Syncing migrations between main app and backoffice...${NC}"

# Check for project root: require package.json, prisma, backoffice, .git, and correct project name in package.json
if [ ! -f "package.json" ] || [ ! -d "prisma" ] || [ ! -d "backoffice" ] || [ ! -d ".git" ] || ! grep -q '"name": *"safetap"' package.json; then
    echo -e "${RED}❌ Error: You must run this script from the root of the safetap project${NC}"
    exit 1
fi

if [ ! -d "prisma/migrations" ]; then
    echo -e "${RED}❌ Error: No migrations found in the main app${NC}"
    exit 1
fi

mkdir -p backoffice/prisma/migrations

echo -e "${YELLOW}📁 Copying migrations from main app to backoffice...${NC}"

cp -r prisma/migrations/* backoffice/prisma/migrations/

echo -e "${GREEN}✅ Migrations copied successfully${NC}"

echo -e "${YELLOW}🔍 Checking synchronization...${NC}"

MAIN_COUNT=$(find prisma/migrations -name "*.sql" | wc -l)
BACKOFFICE_COUNT=$(find backoffice/prisma/migrations -name "*.sql" | wc -l)

if [ "$MAIN_COUNT" -eq "$BACKOFFICE_COUNT" ]; then
    echo -e "${GREEN}✅ Migrations synced successfully${NC}"
    echo -e "${GREEN}   Main app: $MAIN_COUNT migrations${NC}"
    echo -e "${GREEN}   Backoffice: $BACKOFFICE_COUNT migrations${NC}"
else
    echo -e "${RED}❌ Error: Migrations are not synced${NC}"
    echo -e "${RED}   Main app: $MAIN_COUNT migrations${NC}"
    echo -e "${RED}   Backoffice: $BACKOFFICE_COUNT migrations${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Sync completed successfully${NC}"
echo -e "${YELLOW}💡 Remember to commit changes in both directories${NC}"
