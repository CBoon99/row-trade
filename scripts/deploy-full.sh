#!/bin/bash
# Full deployment script for Row-Trader
# Handles: DB creation, schema init, build, and deploy

set -e  # Exit on error

echo "🚀 Row-Trader Full Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI not found. Install with: npm install -g netlify-cli${NC}"
    exit 1
fi

# Check if logged in
if ! netlify status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Netlify. Logging in...${NC}"
    netlify login
fi

# Check if site is linked
if ! netlify status &> /dev/null || [ -z "$(netlify status 2>/dev/null | grep 'Site id')" ]; then
    echo -e "${YELLOW}⚠️  Site not linked. Linking...${NC}"
    netlify link
fi

# Step 1: Check/Create Database
echo -e "\n${GREEN}Step 1: Checking Database...${NC}"
if [ -z "$(netlify env:list 2>/dev/null | grep DATABASE_URL)" ]; then
    echo -e "${YELLOW}⚠️  Database not found. Creating...${NC}"
    netlify db:create
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi

# Step 2: Build
echo -e "\n${GREEN}Step 2: Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build complete${NC}"

# Step 3: Initialize Database Schema (if needed)
echo -e "\n${GREEN}Step 3: Initializing database schema...${NC}"
echo -e "${YELLOW}⚠️  Note: Schema initialization happens on first function call${NC}"
echo -e "${YELLOW}⚠️  You can manually call: curl https://your-site.netlify.app/.netlify/functions/api-init-db${NC}"

# Step 4: Deploy
echo -e "\n${GREEN}Step 4: Deploying to Netlify...${NC}"
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    netlify deploy --prod
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Enable Netlify Identity in dashboard"
    echo "2. Configure email templates (optional)"
    echo "3. Initialize DB schema: curl https://your-site.netlify.app/.netlify/functions/api-init-db"
    echo "4. Test authentication flow"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
fi

echo -e "\n${GREEN}✅ Deployment script complete!${NC}"
