# Row-Trader: Complete Netlify Setup Guide
## eBay-Like Marketplace on Serverless Infrastructure

**Last Updated**: February 24, 2026  
**Status**: Production-Ready MVP

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Key Components](#key-components)
5. [Admin Dashboard](#admin-dashboard)
6. [User Dashboard](#user-dashboard)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 1. Overview

### What This Setup Provides

Row-Trader is a **full-stack trading platform** built on Netlify + Neon DB, inspired by eBay's marketplace model:

- ✅ **User Authentication** - Netlify Identity (sign-up, login, forgot password)
- ✅ **Item Listings** - Create, browse, filter by shared games
- ✅ **Offers & Negotiations** - Make offers, counter-offer, accept/decline
- ✅ **User Dashboard** - "My Row-Trader" (like "My eBay") - profile, listings, trades, Rowbucks
- ✅ **Admin Dashboard** - Moderation hub for reports, user management
- ✅ **Backend APIs** - 15+ Netlify Functions for secure DB operations
- ✅ **Database** - Neon Postgres (serverless, auto-scaling)
- ✅ **Forms** - Netlify Forms for reports, onboarding quiz
- ✅ **Safety** - Word filters, parental controls, reporting system

### Why Netlify + Neon?

| Feature | Netlify | Neon |
|---------|---------|------|
| **Hosting** | ✅ Static site hosting | - |
| **Auth** | ✅ Identity (JWT) | - |
| **APIs** | ✅ Functions (serverless) | - |
| **Forms** | ✅ Built-in forms | - |
| **Database** | - | ✅ Serverless Postgres |
| **Cost (MVP)** | Free (100GB bandwidth) | Free (500MB, 10h compute) |
| **Scaling** | Auto-scales | Auto-scales |
| **Deploy** | Git push → auto-deploy | - |

**Total Cost**: $0/month for MVP (<10k users)

---

## 2. Architecture

### High-Level Flow

```
User Browser
    ↓
[Netlify Identity] → JWT Token
    ↓
[Netlify Functions] → Validate Token
    ↓
[Neon DB] → Query/Mutate Data
    ↓
[Response] → Update UI (Zustand Store)
```

### Component Structure

```
Row-Trader/
├── src/
│   ├── ui/
│   │   ├── EnhancedTradingUI.ts    # Main trading hub
│   │   ├── AdminDashboardUI.ts     # Admin panel (NEW)
│   │   ├── AuthUI.ts               # Login/signup
│   │   └── ...
│   ├── stores/
│   │   ├── TradingStoreExtended.ts  # State management
│   │   └── TradingStoreWithAPI.ts   # API integration
│   ├── systems/
│   │   ├── AuthManager.ts          # Netlify Identity wrapper
│   │   └── SafetyModerator.ts      # Content filtering
│   └── api/
│       └── tradingApi.ts           # Function client
├── netlify/
│   └── functions/
│       ├── api-*.ts                # 15+ serverless endpoints
│       ├── db-schema.ts            # DB initialization
│       └── utils/
│           ├── db.ts               # DB connection
│           └── safety.ts           # Safety checks
└── netlify.toml                    # Netlify config
```

---

## 3. Step-by-Step Setup

### Prerequisites

- Node.js 18+ installed
- Git repository cloned
- Netlify account (free tier)
- GitHub account (for Git integration)

### Step 1: Netlify Site Setup

1. **Create Site**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repo
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables** (will be set automatically by `netlify db:create`):
   - `DATABASE_URL` - Auto-set by Netlify DB

### Step 2: Enable Netlify Identity

1. **Enable Identity**:
   - Dashboard → Site → Identity → Enable Identity
   - Settings → Registration: **Open** (or invite-only for production)
   - Settings → Email confirmation: **Required**

2. **Configure Roles**:
   - Identity → Settings → User metadata
   - Add roles: `user`, `child`, `parent`, `admin`
   - Admin role: Set manually in Identity UI for admin users

3. **Email Templates** (Optional):
   - Identity → Email templates
   - Customize welcome, confirmation, password reset emails

### Step 3: Create Neon Database

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login & Link**:
   ```bash
   netlify login
   netlify link  # Link to your site
   ```

3. **Create Database**:
   ```bash
   netlify db:create
   ```
   This:
   - Creates a Neon Postgres database
   - Sets `DATABASE_URL` env var automatically
   - Connects to your Netlify site

### Step 4: Install Dependencies

```bash
npm install
```

**Key Dependencies**:
- `@neondatabase/serverless` - Neon DB driver
- `netlify-identity-widget` - Auth UI
- `@netlify/functions` - Function types
- `zustand` - State management

### Step 5: Initialize Database Schema

1. **Deploy Site** (first time):
   ```bash
   netlify deploy --prod
   ```

2. **Initialize DB**:
   ```bash
   # Option 1: Via deployed function
   curl https://your-site.netlify.app/.netlify/functions/api-init-db
   
   # Option 2: Via npm script
   npm run db:init
   ```

   This creates all tables:
   - `users` - User accounts, roles, Rowbucks
   - `listings` - Item listings
   - `offers` - Trade offers
   - `friends` - Friend relationships
   - `reviews` - Trade reviews
   - `reports` - Moderation reports
   - `gifts` - Gift transactions
   - `rowbucks_history` - Currency history

### Step 6: Test Locally

```bash
netlify dev
```

This runs:
- Frontend on `http://localhost:8888`
- Functions on `http://localhost:8888/.netlify/functions/*`
- Database connection (via `DATABASE_URL`)

**Test Flow**:
1. Open `http://localhost:8888`
2. Sign up (creates user in Identity + DB)
3. Create listing (calls `api-create-listing`)
4. Make offer (calls `api-make-offer`)
5. Accept trade (calls `api-accept-trade`)

### Step 7: Deploy to Production

```bash
# Build + deploy
npm run netlify:deploy

# Or full deployment (build + db init + deploy)
npm run deploy-full
```

---

## 4. Key Components

### 4.1 User Authentication (Netlify Identity)

**How It Works**:
- User signs up → Netlify Identity creates account
- Email confirmation → User clicks link
- Login → JWT token stored in browser
- Functions → Validate token from `event.clientContext.user`

**Code Example** (`src/systems/AuthManager.ts`):
```typescript
import netlifyIdentity from 'netlify-identity-widget';

netlifyIdentity.on('login', (user) => {
  // User logged in, sync data from DB
  tradingApi.syncUserData(user.id);
});

netlifyIdentity.open('signup'); // Open signup modal
netlifyIdentity.open('recover'); // Open forgot password
```

**Forgot Password Flow**:
1. User clicks "Forgot password"
2. `netlifyIdentity.open('recover')` opens modal
3. User enters email
4. Netlify sends reset email
5. User clicks link → resets password

### 4.2 Netlify Functions (Backend APIs)

**Structure**:
Each function in `netlify/functions/api-*.ts`:

```typescript
import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';

export const handler: Handler = async (event) => {
  // 1. Get authenticated user
  const user = await getCurrentUser(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  
  // 2. Connect to DB
  const db = getDb();
  
  // 3. Process request
  const body = JSON.parse(event.body || '{}');
  const result = await db`SELECT * FROM listings WHERE user_id = ${user.id}`;
  
  // 4. Return response
  return {
    statusCode: 200,
    body: JSON.stringify({ listings: result }),
  };
};
```

**Available Functions**:
- `api-create-listing` - Create new listing
- `api-make-offer` - Make offer on listing
- `api-accept-trade` - Accept trade offer
- `api-get-matches` - Get listings matching shared games
- `api-get-user` - Get user profile data
- `api-add-friend` - Add friend
- `api-send-gift` - Send gift
- `api-add-review` - Add trade review
- `api-report` - Submit report
- `api-admin-get-reports` - Get all reports (admin only)
- `api-admin-update-report` - Update report status (admin only)

### 4.3 Database (Neon Postgres)

**Connection** (`netlify/functions/utils/db.ts`):
```typescript
import { neon } from '@neondatabase/serverless';

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}
```

**Query Example**:
```typescript
const db = getDb();
const users = await db`SELECT * FROM users WHERE email = ${email}`;
```

**Schema** (`netlify/functions/db-schema.ts`):
- 8 tables (users, listings, offers, friends, reviews, reports, gifts, rowbucks_history)
- Full SQL schema with indexes, constraints
- Run `api-init-db` to create tables

### 4.4 Netlify Forms

**Usage** (`index.html` or components):
```html
<form name="report" netlify>
  <input type="hidden" name="form-name" value="report">
  <input name="reason" required>
  <textarea name="details" required></textarea>
  <button type="submit">Submit Report</button>
</form>
```

**Features**:
- Auto-spam protection (honeypot)
- Email notifications (configure in Netlify dashboard)
- Stores submissions in Netlify UI

---

## 5. Admin Dashboard

### Access

**URL**: `/admin` (or button in main hub for admin users)

**Role Check**:
```typescript
const isAdmin = clientContext?.user?.app_metadata?.roles?.includes('admin');
```

### Features

1. **Reports Queue**:
   - View pending/reviewed/resolved reports
   - Update report status
   - Ban users

2. **Statistics**:
   - Total reports
   - Pending count
   - Resolved count

3. **User Management** (future):
   - Ban/unban users
   - View user activity
   - Manage roles

**Code** (`src/ui/AdminDashboardUI.ts`):
```typescript
const adminUI = new AdminDashboardUI('admin-container');
adminUI.show(); // Shows dashboard if user is admin
```

---

## 6. User Dashboard ("My Row-Trader")

### Features (eBay-Like)

1. **Profile**:
   - Username, email
   - Favorite games
   - Expert level (Newbie → Master Barterer)
   - Badges

2. **My Listings**:
   - Active listings
   - Sold/traded items
   - Create new listing

3. **My Offers**:
   - Pending offers
   - Counter-offers
   - Trade history

4. **Rowbucks**:
   - Current balance
   - Transaction history
   - Buy more

5. **Friends**:
   - Friends list
   - Friend requests
   - Shared games

6. **Reviews**:
   - Received reviews
   - Average rating
   - Leave review after trade

**Access**: Button in main hub → "My Profile"

---

## 7. Best Practices

### Security

1. **All DB operations in Functions** (never client-side)
2. **JWT validation** on every Function call
3. **Role-based access** (admin checks)
4. **HTTPS** (auto on Netlify)
5. **Content filtering** (safety.ts)

### Performance

1. **Lazy load** components (dynamic imports)
2. **Cache** user data in Zustand store
3. **Optimize** Function cold starts (keep warm)
4. **Index** DB columns (already in schema)

### Monitoring

1. **Netlify Logs**: View Function logs in dashboard
2. **Error Tracking**: Add Sentry (optional)
3. **Analytics**: Netlify Analytics (paid) or Google Analytics

### Costs

**Free Tier Limits**:
- Netlify: 100GB bandwidth, 300 build minutes/month
- Neon: 500MB storage, 10 compute hours/month

**Upgrade When**:
- >10k users → Neon Pro ($19/mo unlimited)
- >100GB bandwidth → Netlify Pro ($19/mo)

---

## 8. Troubleshooting

### Issue: "DATABASE_URL not set"

**Solution**:
```bash
netlify db:create  # Creates DB and sets env var
```

### Issue: "Function returns 401 Unauthorized"

**Solution**:
- Check user is logged in (`authManager.isAuthenticated()`)
- Verify JWT token in Function (`getCurrentUser()`)
- Check Identity is enabled in Netlify dashboard

### Issue: "DB query fails"

**Solution**:
- Verify `DATABASE_URL` is set
- Check DB schema is initialized (`api-init-db`)
- Test connection: `netlify dev` → check Function logs

### Issue: "Admin dashboard shows 'Access Denied'"

**Solution**:
- Set admin role in Netlify Identity UI:
  - Identity → Users → Select user → Edit metadata
  - Add role: `admin`

---

## 🎉 You're All Set!

Row-Trader is now a **production-ready, eBay-like marketplace** on serverless infrastructure.

**Next Steps**:
1. Test all features locally (`netlify dev`)
2. Deploy to production (`npm run netlify:deploy`)
3. Set admin role for your account
4. Monitor logs and reports

**Support**:
- Netlify Docs: https://docs.netlify.com
- Neon Docs: https://neon.tech/docs
- Row-Trader Issues: GitHub repo

---

**Happy Trading! 🌊🧩**
