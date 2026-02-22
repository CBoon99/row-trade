# Row-Trader: Netlify Setup Guide

## Prerequisites

1. **Netlify Account** - Sign up at [netlify.com](https://netlify.com)
2. **Netlify CLI** - Install globally:
   ```bash
   npm install -g netlify-cli
   ```

## Setup Steps

### 1. Enable Netlify Identity

1. Go to your Netlify site dashboard
2. Navigate to **Identity** → **Enable Identity**
3. Configure settings:
   - **Enable email confirmation** (recommended)
   - **Enable external providers** (optional: Google, GitHub, etc.)
   - **Registration preferences**: Open or Invite-only

### 2. Create Neon Database

In your project root directory:

```bash
# Login to Netlify (if not already)
netlify login

# Link to your site (if not already linked)
netlify link

# Create Neon database
netlify db:create
```

This will:
- Provision a Neon Postgres database
- Add `DATABASE_URL` environment variable automatically
- Connect it to your Netlify Functions

### 3. Initialize Database Schema

After creating the database, initialize the schema:

**Option A: Via Function (Recommended)**
```bash
# Start local dev server
netlify dev

# In another terminal, call the init function
curl http://localhost:8888/.netlify/functions/api-init-db
```

**Option B: Via Netlify Dashboard**
1. Deploy your site
2. Go to Functions → `api-init-db`
3. Click "Invoke" or visit: `https://your-site.netlify.app/.netlify/functions/api-init-db`

### 4. Install Dependencies

```bash
npm install
```

This installs:
- `@neondatabase/serverless` - Neon DB driver
- `netlify-identity-widget` - Auth UI widget
- `@netlify/functions` - Function types

### 5. Configure Environment Variables

Netlify automatically sets:
- `DATABASE_URL` - From `netlify db:create`

You can add custom variables in:
- Netlify Dashboard → Site settings → Environment variables

### 6. Deploy

```bash
# Build and deploy
npm run build
netlify deploy --prod
```

Or push to GitHub (if auto-deploy is enabled):
```bash
git add .
git commit -m "Add Netlify Identity and DB integration"
git push
```

## Quick Deploy (Automated)

```bash
# Full automated deployment (creates DB, builds, deploys)
npm run deploy-full
```

This script will:
1. Check/create Neon database
2. Build the application
3. Deploy to Netlify
4. Provide next steps

## Testing Locally

```bash
# Start Netlify dev (runs functions + DB locally)
npm run netlify:dev
# or
netlify dev
```

This starts:
- Vite dev server (game)
- Netlify Functions (API endpoints)
- Local DB connection (via DATABASE_URL)

## Testing Authentication

1. **Sign Up:**
   - Open app → Click "Sign Up"
   - Enter email and password
   - Check email for confirmation link
   - Click link to verify

2. **Sign In:**
   - Click "Sign In"
   - Enter credentials
   - Should redirect to trading hub

3. **Forgot Password:**
   - Click "Forgot Password?" on login
   - Enter email
   - Check email for reset link
   - Click link and set new password

## Testing Database Operations

1. **Create Listing:**
   - Sign in → Trading Hub → Create Listing
   - Fill form → Submit
   - Check database: `SELECT * FROM listings;`

2. **Make Offer:**
   - Browse listings → Make Offer
   - Submit offer
   - Check database: `SELECT * FROM offers;`

3. **Accept Trade:**
   - Accept an offer
   - Verify Rowbucks updated in database
   - Check `rowbucks_history` table

## Database Schema

Tables created:
- `users` - User accounts
- `listings` - Trading listings
- `offers` - Trade offers
- `friends` - Friend relationships
- `reviews` - Trade reviews
- `reports` - Safety reports
- `gifts` - Gift transactions
- `rowbucks_history` - Currency transactions

## Troubleshooting

### Database Connection Error

```bash
# Check DATABASE_URL is set
netlify env:list

# If missing, re-run:
netlify db:create
```

### Functions Not Working

```bash
# Check function logs
netlify functions:list
netlify functions:invoke api-create-listing

# Test locally
netlify dev
```

### Identity Widget Not Showing

- Check Identity is enabled in dashboard
- Verify `netlify-identity-widget` is installed
- Check browser console for errors

## Admin Setup

### Enable Admin Role

1. Go to Netlify Dashboard → Identity → Users
2. Find your admin user
3. Click "Edit" → "Metadata" → "app_metadata"
4. Add: `{ "roles": ["admin"] }`
5. Save

### Test Admin Functions

```bash
# Get reports (requires admin role)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-site.netlify.app/.netlify/functions/api-admin-get-reports

# Update report status
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportId": "report-123", "status": "resolved"}' \
  https://your-site.netlify.app/.netlify/functions/api-admin-update-report
```

## Email Configuration

### Custom Email Templates

1. Go to Netlify Dashboard → Identity → Email templates
2. Customize:
   - **Confirmation email** - Welcome message
   - **Invite email** - Friend invites
   - **Password reset** - Reset instructions
   - **Magic link** - Login link

### Email Notifications

Netlify Forms can send notifications:
1. Go to Dashboard → Forms → Settings
2. Enable email notifications
3. Add recipient emails for reports

## Database Backups

Neon DB (via Netlify) includes automatic backups:
- **Point-in-time recovery** - Available in Neon dashboard
- **Daily backups** - Automatic
- **Manual backup**: Export via Neon dashboard

To access Neon dashboard:
1. Go to Netlify Dashboard → Data → Your database
2. Click "Open in Neon Console"
3. Access backup/restore options

## Next Steps

1. **Customize Identity UI** (optional):
   - Edit `src/systems/AuthManager.ts`
   - Add custom styling

2. **Add Real-Time Features** (future):
   - WebSocket for live updates
   - Supabase or Firebase for real-time chat

3. **Add Payment Processing** (future):
   - Stripe integration for Rowbucks purchases
   - Update `api-buy-rowbucks` function

4. **Admin Dashboard UI** (future):
   - Build React/Vue admin panel
   - Connect to admin Functions

## Support

- Netlify Docs: https://docs.netlify.com
- Neon Docs: https://neon.tech/docs
- Netlify Identity: https://docs.netlify.com/visitor-access/identity
