# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start frontend development server with HMR
- `npm run build` - Type-check with TypeScript and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run server` - Start API server in development mode (with watch)
- `npm run server:start` - Start API server in production mode

To run both frontend and server, open two terminals:
```bash
# Terminal 1 - Frontend (port 5173)
npm run dev

# Terminal 2 - API Server (port 3001)
npm run server
```

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for bundling and dev server
- MUI (Material-UI) v7 with Emotion for styling
- Recharts for data visualization
- ESLint with TypeScript and React hooks plugins

**Backend:**
- Express.js API server
- PostgreSQL with TimescaleDB for time-series data
- pg (node-postgres) for database connection

## Architecture

### Project Structure

```
spread-sniper-ui/
├── src/                    # Frontend React application
│   ├── dashboard/          # Dashboard pages and components
│   │   ├── pages/          # Overview, Performance, Scanner, Trades, Risk, RegimeHistory
│   │   └── components/     # DashboardLayout, DashboardHeader, DashboardSidebar
│   ├── hooks/              # useApi.ts - API data fetching hooks
│   ├── theme/              # MUI theme customizations
│   └── components/         # Shared components
├── server/                 # Express API server
│   ├── index.js            # API routes and TimescaleDB queries
│   ├── .env                # Database credentials (not committed)
│   └── package.json        # Server dependencies
└── dist/                   # Production build output
```

### Routing

The app uses React Router for client-side routing. Routes are defined in `src/main.tsx`:
- `/` - Redirects to `/dashboard`
- `/dashboard` - Main dashboard with nested routes:
  - `/dashboard/overview` - Trading overview
  - `/dashboard/performance` - Performance charts
  - `/dashboard/scanner` - Opportunity scanner
  - `/dashboard/trades` - Trade history
  - `/dashboard/risk` - Risk metrics
  - `/dashboard/regime-history` - Market regime history

### API Endpoints

The Express server (`server/index.js`) provides these endpoints:
- `GET /api/overview` - Dashboard summary metrics
- `GET /api/performance` - Equity curve, drawdown, P&L data
- `GET /api/scanner` - Active trading opportunities
- `GET /api/trades` - Trade history with pagination
- `GET /api/risk` - Risk metrics and exposure
- `GET /api/regime-history` - Market regime changes over time

### Theme System

Custom MUI theme with light/dark mode support, built around a green brand color (#02cd0d).

- `src/theme/AppTheme.tsx` - Theme provider wrapper that composes all customizations
- `src/theme/themePrimitives.ts` - Color palettes (brand, gray, green, orange, red), typography, and shape definitions
- `src/theme/customizations/` - Component-specific style overrides organized by MUI category:
  - `inputs.tsx` - Form controls (buttons, text fields, etc.)
  - `dataDisplay.ts` - Lists, tables, typography
  - `feedback.ts` - Alerts, dialogs, progress
  - `navigation.tsx` - Menus, tabs, app bars
  - `surfaces.ts` - Cards, paper, accordions

Wrap pages with `<AppTheme>` to apply the theme. Use `disableCustomTheme` prop to opt out.

### Page Structure

Pages compose MUI components with the theme wrapper. The marketing page (`src/MarketingPage.tsx`) demonstrates the pattern: wrap content in `AppTheme`, include `CssBaseline`, then render sections.

Reusable marketing components live in `src/components/` (Hero, Features, Pricing, FAQ, etc.).
