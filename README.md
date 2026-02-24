# Row-Trader

**Safe Trading Platform for Kids**

Row-Trader is a secure, educational trading platform designed for kids to safely trade game items (Pokemon, Rowblocks, and more) while learning negotiation and bartering skills.

## Features

- 🔐 **Secure Authentication** - Netlify Identity for safe user accounts
- 🎮 **Game Matching** - Find traders who play the same games as you
- 💬 **Negotiation System** - Make offers, counter-offers, and learn bartering
- 👥 **Friends List** - Add friends and see shared games
- 💰 **Rowbucks Currency** - Earn and spend virtual currency
- ⭐ **Reviews & Ratings** - Build your trading reputation
- 🛡️ **Safety First** - Parental controls, word filters, and reporting system
- 📚 **Educational** - Learn negotiation skills through interactive trading

## Tech Stack

- **Frontend**: TypeScript, Vite, Zustand
- **Backend**: Netlify Functions (serverless)
- **Database**: Neon Postgres (via Netlify DB)
- **Auth**: Netlify Identity
- **Deployment**: Netlify

## Setup

### Prerequisites

- Node.js 18+
- Netlify CLI (`npm install -g netlify-cli`)

### Installation

```bash
# Install dependencies
npm install

# Create Neon database (one-time setup)
netlify db:create

# Initialize database schema
npm run db:init

# Start development server
npm run dev
```

### Netlify Setup

1. **Enable Netlify Identity**:
   - Go to your Netlify site dashboard
   - Navigate to Identity → Enable Identity
   - Configure email templates (optional)

2. **Database**:
   - Already created via `netlify db:create`
   - Schema initialized via `npm run db:init`

3. **Deploy**:
   ```bash
   npm run netlify:deploy
   ```

## Development

```bash
# Local development with Netlify Functions
netlify dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── src/
│   ├── api/              # API client for Netlify Functions
│   ├── stores/           # Zustand state management
│   ├── systems/          # Core systems (Auth, Safety)
│   ├── ui/               # UI components
│   └── utils/            # Utilities (matching, etc.)
├── netlify/
│   └── functions/         # Serverless functions
└── index.html            # Main entry point
```

## Safety Features

- Word filtering for inappropriate content
- Parental approval flow for trades
- Double-confirmation for trades
- Report system for moderation
- Age-appropriate content only

## License

MIT
