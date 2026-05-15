# Backend Migration: Rust → Node/Express + SQLite

**Date**: May 15, 2026  
**Status**: Infrastructure Complete

## Executive Summary

The VAWT backend has been migrated from Rust/Axum (in `/api`) to Node/Express + TypeScript (in `/server`) for Vercel compatibility. All infrastructure, database, middleware, auth system, and core read-only endpoints are implemented and compiled successfully.

## Why This Migration?

- **Architectural Decision**: DECISIONS.md Decision 5 specifies Vercel-maintainable backends. Node/Express is a better fit for Vercel's serverless platform than Rust.
- **Deployment Simplicity**: Rust on Vercel requires workarounds; Node.js is natively supported.
- **Team Maintenance**: Node/Express is more approachable for future maintainers than Axum.
- **Discord Bot**: Rust is retained for the Discord bot service (`/discord-bot`), which is the appropriate use case.

## What's Been Built

### 1. Infrastructure
- `package.json` with all required dependencies (Express, TypeScript, zod, jose, helmet, cors, better-sqlite3, etc.)
- `tsconfig.json` configured for strict TypeScript on Node.js
- `src/config.ts` validates all environment variables at startup using zod
- `.env.example` with all required variables from ARCHITECTURE.md
- `.gitignore` for Node/SQLite typical exclusions

### 2. Database Layer
- `src/db/client.ts` - SQLite connection singleton with WAL mode and foreign key enforcement
- `src/db/migrate.ts` - Migration runner supporting numbered .sql files
- `db/migrations/001_initial_schema.sql` - Full initial schema with all 6 core tables:
  - `users` - Email/Discord accounts, admin flag
  - `sessions` - Session tracking with revocation support
  - `magic_link_tokens` - Magic link tokens (hashed, with expiry)
  - `votes` - Votes by source with deduplication
  - `bout_admin_overrides` - Manual bout status/schedule overrides
  - `bracket_predictions` - User bracket picks and scores

### 3. Middleware Layer
- `middleware/errorHandler.ts` - Global error handler with JSON responses
- `middleware/auth.ts` - JWT verification, `requireAuth` and `optionalAuth`
- `middleware/validate.ts` - Zod schema validation wrapper for request bodies
- `middleware/requireServiceKey.ts` - X-Service-Key validation for bot calls (timing-safe)

### 4. Data Layer
- `src/data/loader.ts` - Loads and caches tournament and distillery JSON
  - `getTournaments()`, `getTournament(year)`, `getDistilleries()`, `getDistillery(id)`
  - Watches for file changes and auto-reloads
  - Admin support via `forceReload()` method

### 5. Authentication System
Complete authentication stack per ARCHITECTURE.md:

**Services**:
- `services/authService.ts` - JWT signing, session creation/verification
- `services/magicLinkService.ts` - Magic link token generation, verification, and email sending
- `services/discordOAuthService.ts` - Discord OAuth2 exchange and user upsert

**Routes** (`routes/auth.ts`):
- `POST /api/auth/magic-link/request` - Request magic link email
- `GET /api/auth/magic-link/verify?token=` - Verify token, create session, return JWT
- `GET /api/auth/discord/authorize` - Start Discord OAuth flow
- `GET /api/auth/discord/callback?code=&state=` - Complete OAuth, upsert user
- `POST /api/auth/discord/link` - Link Discord to existing email account
- `POST /api/auth/logout` - Revoke session
- `GET /api/auth/me` - Get current user profile

### 6. Core Read-Only Endpoints
- `routes/health.ts` - `GET /api/health`
- `routes/tournaments.ts` - Tournament, bout, and active-bout endpoints with vote merging
- `routes/distilleries.ts` - Distillery registry and detail endpoints

### 7. Stub Routes (Ready for Implementation)
- `routes/votes.ts` - Vote casting, results, vote import (returns 501)
- `routes/brackets.ts` - Bracket CRUD and scoring (returns 501)
- `routes/users.ts` - User endpoints (returns 501)
- `routes/admin.ts` - Admin operations (returns 501)

### 8. App Factory
- `src/app.ts` - Express app factory (separate from server startup for testing)
- `src/index.ts` - Server entry point with database init, data loader, graceful shutdown

## File Structure

```
server/
├── src/
│   ├── config.ts              # Environment validation
│   ├── app.ts                 # Express factory
│   ├── index.ts               # Server entry point
│   ├── db/
│   │   ├── client.ts          # SQLite connection
│   │   └── migrate.ts         # Migration runner
│   ├── data/
│   │   └── loader.ts          # JSON data loader
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── auth.ts
│   │   ├── validate.ts
│   │   ├── requireServiceKey.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── health.ts
│   │   ├── tournaments.ts
│   │   ├── distilleries.ts
│   │   ├── auth.ts
│   │   ├── votes.ts           # Stub
│   │   ├── brackets.ts        # Stub
│   │   ├── users.ts           # Stub
│   │   ├── admin.ts           # Stub
│   │   └── index.ts           # Router composition
│   ├── services/
│   │   ├── authService.ts
│   │   ├── magicLinkService.ts
│   │   └── discordOAuthService.ts
│   └── utils/
│       └── crypto.ts          # Hashing, UUID generation
├── db/
│   └── migrations/
│       └── 001_initial_schema.sql
├── dist/                      # Compiled output (generated)
├── package.json
├── tsconfig.json
└── .env.example
```

## Build Status

✅ **TypeScript**: Compiles without errors (strict mode)  
✅ **Dependencies**: All npm packages installed  
✅ **Database Schema**: Valid SQLite, ready for migrations  
✅ **Endpoints**: All routes type-safe and functional  
✅ **Security**: Timing-safe comparisons, hashed tokens, JWT with session verification  

## How to Use This Backend

### Local Development

```bash
cd server
npm install
cp .env.example .env
# Edit .env with local values (or accept defaults for dev)
npm run dev
# Server listens on PORT (default 3000)
```

### Running on Vercel

Update `vercel.json` at project root:
```json
{
  "buildCommand": "cd server && npm install && npm run build",
  "installCommand": "cd server && npm install",
  "outputDirectory": "server/dist"
}
```

Create `.env.production` with:
```
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
DATABASE_PATH=/tmp/vawt.db  # Or Vercel-compatible persistent store
JWT_SECRET=<secure random>
JWT_EXPIRY=30d
MAGIC_LINK_BASE_URL=https://your-domain.com
MAGIC_LINK_EXPIRY_MINUTES=15
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@your-domain.com
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://your-domain.com/api/auth/discord/callback
SERVICE_KEY=<secure random>
INITIAL_ADMIN_EMAIL=organizer@example.com
```

## Next Steps

### Phase 2.2: Voting System (Ready to Implement)
- Implement `POST /api/tournaments/:year/bouts/:boutId/vote` with deduplication
- Implement `GET /api/tournaments/:year/votes` with source breakdown
- Implement vote import endpoint for admin CSV upload

### Phase 2.3: Bracket Predictions (Ready to Implement)
- Implement `POST /api/brackets` with validation
- Implement `PUT /api/brackets/:id/picks` with scoring
- Implement `GET /api/tournaments/:year/leaderboard`

### Phase 2.3: Discord Bot Integration
- The Discord bot (`/discord-bot`) calls this API via HTTP
- Bot will use `X-Service-Key` header for authentication
- All endpoints follow REST contract in ARCHITECTURE.md

## Deprecation Notice: Rust API

The `/api` directory (Rust/Axum implementation) is **deprecated** and will be removed once all functionality is migrated to Node. Current status:

- ✅ Tournament read-only endpoints - Migrated to `/server/src/routes/tournaments.ts`
- ✅ User auth endpoints - Migrated to `/server/src/routes/auth.ts`
- ⏳ Bracket CRUD - Ready to implement in `/server/src/routes/brackets.ts`
- ⏳ Vote endpoints - Ready to implement in `/server/src/routes/votes.ts`

Do not add new features to `/api`. Use `/server` for all new work.

## Questions & Support

- **Architecture decisions**: See DECISIONS.md Decision 13 (Rust → Node migration)
- **API contract**: See ARCHITECTURE.md lines 305-365 for endpoint specifications
- **Database schema**: See ARCHITECTURE.md lines 126-216 and `/server/db/migrations/001_initial_schema.sql`
- **Environment variables**: See ARCHITECTURE.md lines 434-453 and `/server/.env.example`
