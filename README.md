# Veritix

A blockchain-backed event ticketing platform built on [Stacks](https://www.stacks.co/). Organizers create events, sell tickets paid in STX (or Bitcoin), and verify attendees on-chain. Attendees connect a Stacks wallet (Leather or Xverse), purchase tickets, and receive a QR code for entry verification.

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Pages](#pages)
- [API Routes](#api-routes)
- [Smart Contract](#smart-contract)
- [TypeScript SDK](#typescript-sdk)
- [Testing](#testing)
- [PWA Support](#pwa-support)

---

## How It Works

1. **Organizer creates an event** — fills in title, date, location, image, price, and ticket supply. Can choose Stacks or Bitcoin network.
2. **Attendee browses events** — search by title, filter by category (Music, Tech, Sports, Art, Conference, Workshop).
3. **Attendee buys a ticket** — connects their Stacks wallet, signs a transaction to transfer STX to the escrow address. The backend verifies the on-chain payment via Hiro API before issuing the ticket.
4. **Ticket is issued** — the attendee sees a QR code on their ticket detail page. The QR encodes the ticket ID.
5. **Organizer verifies entry** — at the door, the organizer scans the ticket ID (manual entry or QR scan), marks it as "Used". The ticket can only be used once.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Zod validation, JWT auth |
| Database | PostgreSQL via Prisma ORM |
| Blockchain | Stacks (Clarity smart contract), Hiro API for transaction verification |
| Wallet | `@stacks/connect` — Leather, Xverse |
| Auth | SIWS (Sign-In with Stacks) with JWT session cookies |
| QR Codes | `qrcode` library (SVG generation) |
| SDK | `veritix-sdk` — standalone TypeScript client in `packages/veritix-sdk` |
| PWA | Service worker with offline caching, web manifest |

---

## Project Structure

```
stx-showz/
├── app/                          # Next.js App Router pages & API
│   ├── api/
│   │   ├── auth/                 # SIWS authentication (nonce, verify, me, logout)
│   │   ├── events/               # Event CRUD (list, create, get, update, cancel)
│   │   ├── tickets/              # Ticket purchase, list user tickets, ticket detail
│   │   ├── organizer/            # Organizer-specific (events, attendees, verify, activity)
│   │   ├── users/                # User profile update
│   │   └── upload/               # Image upload endpoint
│   ├── events/                   # Event browse & detail pages
│   ├── tickets/                  # Ticket detail page
│   ├── my-tickets/               # User's tickets list
│   ├── organizer/                # Organizer dashboard, event management, verification
│   ├── create-event/             # Event creation form
│   ├── profile/                  # User profile & activity
│   ├── login/ & signup/          # Auth pages
│   └── layout.tsx                # Root layout (providers, navbar, footer)
├── components/                   # Reusable React components
│   ├── EventCard.tsx             # Event card for grid display
│   ├── EventForm.tsx             # Event creation form with image upload
│   ├── QRCode.tsx                # Real QR code generator (qrcode library)
│   ├── ImageUpload.tsx           # Drag-and-drop image uploader
│   ├── NotificationProvider.tsx  # Toast notification system
│   ├── WalletProvider.tsx        # Stacks wallet connection & SIWS auth
│   ├── ThemeProvider.tsx         # Dark mode with localStorage persistence
│   ├── Navbar.tsx                # Responsive navigation with mobile menu
│   ├── TicketCard.tsx            # Ticket list card
│   ├── TicketStatusBadge.tsx     # Status indicator (Valid/Used/Cancelled)
│   ├── OrganizerStats.tsx        # Stats grid component
│   ├── EmptyState.tsx            # Empty state placeholder
│   └── PageHeader.tsx            # Page title + subtitle + action
├── lib/                          # Shared utilities
│   ├── apiClient.ts              # SDK wrapper for frontend API calls
│   ├── auth.ts                   # JWT session management
│   ├── hiro.ts                   # Hiro API transaction verification
│   ├── prisma.ts                 # Prisma client singleton
│   ├── serializers.ts            # Prisma → JSON serializers
│   ├── siwsMessage.ts            # SIWS message builder
│   └── types.ts                  # TypeScript interfaces
├── packages/veritix-sdk/         # Standalone TypeScript SDK
│   └── src/
│       ├── client.ts             # HTTP client with retry/timeout
│       ├── events.ts             # Event CRUD operations
│       ├── tickets.ts            # Ticket purchase & listing
│       ├── organizer.ts          # Organizer operations (verify, attendees)
│       ├── auth.ts               # Auth operations
│       ├── users.ts              # User operations
│       ├── types.ts              # SDK type definitions
│       └── errors.ts             # Typed error hierarchy
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed script
├── contracts/                    # Clarity smart contract
│   └── event-registry.clar       # On-chain event registry
├── tests/                        # Unit tests
├── scripts/                      # Utility scripts
│   ├── spam-create-event.ts      # Mainnet stress test (100 wallets)
│   └── smoke.ts                  # End-to-end smoke test
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
└── deployments/                  # Clarinet deployment plans
    ├── default.testnet-plan.yaml
    └── default.mainnet-plan.yaml
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Docker** (for PostgreSQL)
- **Stacks wallet** — [Leather](https://leather.xyz) or [Xverse](https://xverse.app)

### Installation

```bash
git clone https://github.com/aabxtract/stx-showz.git
cd stx-showz
npm install
```

### Database Setup

```bash
# Start PostgreSQL
docker compose up -d

# Copy environment file
cp .env.example .env
# Edit .env with your database URL and secrets

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing session tokens (min 32 chars) |
| `ESCROW_ADDRESS_TESTNET` | Yes | Stacks testnet address receiving ticket payments |
| `ESCROW_ADDRESS_MAINNET` | Yes | Stacks mainnet address receiving ticket payments |
| `NEXT_PUBLIC_ESCROW_ADDRESS_TESTNET` | Yes | Client-side testnet escrow (for wallet transfers) |
| `NEXT_PUBLIC_ESCROW_ADDRESS_MAINNET` | Yes | Client-side mainnet escrow (for wallet transfers) |
| `HIRO_API_URL` | No | Override Hiro API base URL (defaults to `https://api.hiro.so`) |
| `DEV_AUTH_BYPASS` | No | Set `"true"` to skip SIWS auth in development |
| `DEV_PAYMENT_BYPASS` | No | Set `"true"` to skip real payments in development |
| `NEXT_PUBLIC_DEV_PAYMENT_BYPASS` | No | Client-side payment bypass flag |

> **Warning:** Never deploy with `DEV_AUTH_BYPASS` or `DEV_PAYMENT_BYPASS` set to `"true"`.

---

## Database

### Schema

**User** — wallet-based identity
- `id`, `address` (unique), `name`, `bio`, `avatarUrl`

**Event** — created by organizers
- `id`, `title`, `description`, `category`, `date`, `location`, `image`
- `price` (decimal), `network` ("stacks" | "bitcoin")
- `ticketsTotal`, `ticketsSold`, `status` (Active | SoldOut | Cancelled | Ended)
- `organizerId` → User

**Ticket** — purchased by attendees
- `id`, `eventId` → Event, `ownerId` → User
- `txId` (unique), `txStatus`, `amountStx`, `paidTo`, `network`
- `status` (Pending | Valid | Used | Cancelled), `usedAt`

**Nonce** — SIWS nonce management (address, nonce, expiresAt)

**RateLimit** — IP-based rate limiting (key, count, windowStart)

### Commands

```bash
npm run db:migrate    # Create migrations
npm run db:reset      # Reset database
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio
```

---

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page with hero, how-it-works, and featured events | No |
| `/events` | Browse all events with search and category filter | No |
| `/events/[id]` | Event detail with buy ticket flow | No |
| `/create-event` | Event creation form (Stacks or Bitcoin network) | Yes |
| `/my-tickets` | List of tickets owned by current user | Yes |
| `/tickets/[id]` | Ticket detail with QR code for entry | Yes |
| `/organizer/dashboard` | Organizer overview with revenue stats | Yes |
| `/organizer/events/[id]` | Manage event, view attendees, cancel | Yes |
| `/organizer/verify` | Verify ticket at the door | Yes |
| `/profile` | User profile, stats, and activity feed | Yes |
| `/login` | Connect wallet & sign in | No |
| `/signup` | Connect wallet & sign up | No |

---

## API Routes

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Generate SIWS nonce for wallet address |
| POST | `/api/auth/verify` | Verify SIWS signature, create session |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/logout` | Clear session cookie |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (query: `category`, `status`, `organizer`, `q`, `limit`, `offset`) |
| POST | `/api/events` | Create event (auth required) |
| GET | `/api/events/[id]` | Get event detail |
| PATCH | `/api/events/[id]` | Update event (organizer only) |
| DELETE | `/api/events/[id]` | Cancel event (organizer only) |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Purchase ticket (auth + on-chain payment required) |
| GET | `/api/tickets/me` | List current user's tickets |
| GET | `/api/tickets/[id]` | Get ticket detail (owner only) |

### Organizer

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizer/events` | List organizer's events with revenue |
| GET | `/api/organizer/events/[id]/attendees` | List attendees for an event |
| POST | `/api/organizer/verify` | Mark ticket as used (idempotent) |
| GET | `/api/organizer/activity` | Activity feed (events, purchases, check-ins) |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/users/me` | Update user profile (name, bio, avatar) |
| POST | `/api/upload` | Upload event image (JPEG, PNG, WebP, GIF; max 5MB) |

---

## Smart Contract

Located at `contracts/event-registry.clar` (Clarity v3). Deployed to both testnet and mainnet.

### Functions

| Function | Type | Description |
|----------|------|-------------|
| `create-event` | public | Store event metadata on-chain (title, description, category, location, image, date, price, supply) |
| `cancel-event` | public | Mark event as cancelled (organizer only) |
| `get-event` | read-only | Retrieve event data by ID |
| `event-exists` | read-only | Check if event ID exists |
| `tickets-left` | read-only | Get remaining ticket supply |
| `get-last-event-id` | read-only | Get the latest event ID |

### Deployment

```bash
# Using Clarinet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

Deployment plans are in `deployments/`. The deployer mnemonic is configured in `settings/Mainnet.toml` and `settings/Testnet.toml`.

---

## TypeScript SDK

A standalone SDK is available in `packages/veritix-sdk` for integrating with the Veritix API from any TypeScript project.

### Installation

```bash
npm install veritix-sdk
```

### Usage

```typescript
import { VeritixClient } from "veritix-sdk";

const client = new VeritixClient({
  baseUrl: "https://your-veritix-domain.com",
});

// List events
const { events, total } = await client.events.list({
  category: "Music",
  limit: 10,
});

// Get event
const event = await client.events.get("event-id");

// Create event
const newEvent = await client.events.create({
  title: "Summer Festival",
  description: "Annual summer music festival",
  category: "Music",
  date: "2026-08-01T18:00:00Z",
  location: "Lagos, Nigeria",
  image: "https://example.com/poster.jpg",
  price: "5.0",
  network: "stacks",
  ticketsTotal: 500,
});

// Purchase ticket
const ticket = await client.tickets.purchase({
  eventId: "event-id",
  txId: "0x...",
  network: "testnet",
});

// Verify ticket (organizer)
const result = await client.organizer.verifyTicket("ticket-id");
```

### SDK Modules

- `client.events` — Event CRUD (list, get, create, update, cancel)
- `client.tickets` — Ticket purchase and listing
- `client.organizer` — Organizer operations (verify, attendees)
- `client.auth` — Authentication (nonce, verify, me, logout)
- `client.users` — User profile updates

### Error Handling

```typescript
import { VeritixError, VeritixAuthError, VeritixNotFoundError } from "veritix-sdk";

try {
  await client.events.get("nonexistent");
} catch (error) {
  if (error instanceof VeritixNotFoundError) {
    console.log("Event not found");
  } else if (error instanceof VeritixAuthError) {
    console.log("Authentication required");
  } else if (error instanceof VeritixError) {
    console.log("API error:", error.message);
  }
}
```

---

## Testing

### Unit Tests

```bash
npm run test
```

Tests cover:
- JWT auth (sign, verify, reject invalid tokens)
- Hiro API transaction verification (success, pending, failed, amount/sender/recipient checks)
- SIWS message construction
- Event serializer (Decimal handling, ticketsLeft calculation, ISO dates)
- API client event mapping

### Smoke Tests

```bash
npm run test:smoke
```

End-to-end test against a running dev server covering:
- Authentication flow
- Event CRUD
- Ticket purchase
- Organizer verification
- Profile updates

### Stress Testing

```bash
# Generate 100 wallets, fund them, and call create-event on mainnet
DEPLOYER_MNEMONIC="your mnemonic" npx tsx scripts/spam-create-event.ts

# Fund only (no contract calls)
FUND_ONLY=1 DEPLOYER_MNEMONIC="your mnemonic" npx tsx scripts/spam-create-event.ts

# Skip funding, just interact
SKIP_FUND=1 DEPLOYER_MNEMONIC="your mnemonic" npx tsx scripts/spam-create-event.ts
```

Generated wallets are saved to `scripts/generated-wallets.json`.

---

## PWA Support

The app is PWA-enabled with:

- **Web manifest** at `/manifest.json` — standalone display, theme color, icons
- **Service worker** at `/sw.js` — stale-while-revalidate caching for offline support
- **Mobile-optimized** — responsive design with touch-friendly targets, xs breakpoint (400px)

Install the app on your phone's home screen for a native-like experience.

---

## License

MIT
