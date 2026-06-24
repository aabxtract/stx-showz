# Veritix

A blockchain-backed event ticketing platform built on Stacks. Organizers can create events, sell tickets paid in STX, and verify attendees on-chain.

## Stack
- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Prisma ORM · PostgreSQL
- Stacks blockchain (Clarity smart contract + Hiro API for tx verification)
- Stacks wallet integration via `@stacks/connect` (Leather / Xverse)
- JWT session auth with SIWS (Sign-In with Stacks)
- TypeScript SDK (`veritix-sdk`) in `packages/veritix-sdk`
- PWA-enabled with service worker and manifest

## Run

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- A Stacks wallet (Leather or Xverse)

### Setup
```bash
npm install
docker compose up -d          # start PostgreSQL
npm run db:migrate            # run Prisma migrations
npm run db:seed               # seed sample data
npm run dev                   # start dev server
```

Open http://localhost:3000

### Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret for signing session tokens
- `HIRO_API_URL` — Hiro API base URL (testnet or mainnet)
- `ESCROW_ADDRESS` — Stacks address that receives ticket payments

## Routes
- `/` — landing page with featured events
- `/events` — browse events (search + filter by category)
- `/events/[id]` — event detail + buy ticket with Stacks wallet
- `/create-event` — organizer creates an event (auth required)
- `/my-tickets` — tickets owned by current user
- `/tickets/[id]` — single ticket with QR code
- `/organizer/dashboard` — organizer overview with revenue stats
- `/organizer/events/[id]` — manage one event, view attendees
- `/organizer/verify` — verify a ticket at the door
- `/profile` — user profile, stats, and activity feed

## API Routes
- `POST /api/auth/nonce` — generate SIWS nonce
- `POST /api/auth/verify` — verify SIWS signature, create session
- `GET /api/auth/me` — get current user
- `POST /api/auth/logout` — clear session
- `GET /api/events` — list events (search, filter, paginate)
- `POST /api/events` — create event (auth required)
- `GET /api/events/[id]` — get event detail
- `PATCH /api/events/[id]` — update event (organizer only)
- `DELETE /api/events/[id]` — cancel event (organizer only)
- `POST /api/tickets` — purchase ticket (auth required)
- `GET /api/tickets/me` — list user's tickets
- `GET /api/tickets/[id]` — get ticket detail (owner only)
- `GET /api/organizer/events` — organizer's events with revenue
- `GET /api/organizer/events/[id]/attendees` — list attendees
- `POST /api/organizer/verify` — mark ticket as used
- `GET /api/organizer/activity` — activity feed
- `PATCH /api/users/me` — update profile
- `POST /api/upload` — upload event image

## Smart Contract
The Clarity smart contract is at `contracts/event-registry.clar` and is deployed to both testnet and mainnet. It handles:
- `create-event` — store event metadata on-chain
- `cancel-event` — mark event as cancelled
- Read-only helpers: `get-event`, `event-exists`, `tickets-left`

## SDK
A TypeScript SDK is available in `packages/veritix-sdk`:
```typescript
import { VeritixClient } from "veritix-sdk";
const client = new VeritixClient({ baseUrl: "https://your-domain.com" });
```

## Testing
```bash
npm run test          # unit tests
npm run test:smoke    # end-to-end smoke test against dev server
```
