# veritix-sdk

> Official TypeScript SDK for the **Veritix** event ticketing platform on Stacks blockchain.

[![npm version](https://img.shields.io/npm/v/veritix-sdk.svg)](https://www.npmjs.com/package/veritix-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🎫 **Full API coverage** — Events, Tickets, Organizer dashboard, Users, Auth
- 🔐 **Flexible auth** — Bearer token (Node.js) or cookie-based (browser)
- ⛓️ **Stacks helpers** — Build STX transfer transactions for ticket purchases
- 📦 **Dual format** — ESM and CommonJS builds
- 🏷️ **Fully typed** — First-class TypeScript support with exported types
- 🪶 **Zero dependencies** — Only `@stacks/transactions` as optional peer dep
- 🌐 **Universal** — Works in Node.js 18+, browsers, Deno, and Bun

## Installation

```bash
npm install veritix-sdk
```

For Stacks wallet transaction helpers (optional):

```bash
npm install veritix-sdk @stacks/transactions
```

## Quick Start

### Browser (cookie-based auth)

```typescript
import { VeritixClient } from 'veritix-sdk';

const veritix = new VeritixClient({
  baseUrl: 'https://your-veritix-instance.com',
});

// Browse events
const { events, total } = await veritix.events.list({ category: 'Music' });
console.log(`Found ${total} music events`);
```

### Node.js (token-based auth)

```typescript
import { VeritixClient } from 'veritix-sdk';

const veritix = new VeritixClient({
  baseUrl: 'https://your-veritix-instance.com',
  token: 'your-jwt-token',
});

// Create an event
const event = await veritix.events.create({
  title: 'Summer Festival 2026',
  description: 'The biggest music event of the year',
  category: 'Music',
  date: '2026-08-01T18:00:00Z',
  location: 'Lagos, Nigeria',
  image: 'https://example.com/poster.jpg',
  price: '5.0',
  ticketsTotal: 500,
});
```

## API Reference

### Client Configuration

```typescript
const veritix = new VeritixClient({
  baseUrl: string;           // Required: API base URL
  token?: string;            // JWT token for server-side auth
  credentials?: RequestCredentials; // Fetch credentials option
  headers?: Record<string, string>; // Custom headers
  fetch?: typeof fetch;      // Custom fetch implementation
});
```

### Authentication (`veritix.auth`)

Implements Sign-In with Stacks (SIWS):

```typescript
// Step 1: Request a nonce
const { nonce, message, issuedAt } = await veritix.auth.getNonce('SP1ABC...');

// Step 2: User signs `message` with their Stacks wallet (your app handles this)

// Step 3: Verify signature
const { user } = await veritix.auth.verify({
  address: 'SP1ABC...',
  publicKey: '04abc...',
  signature: 'sig...',
  issuedAt,
});

// Check current session
const me = await veritix.auth.me();

// Log out
await veritix.auth.logout();
```

### Events (`veritix.events`)

```typescript
// List with filters & pagination
const { events, total } = await veritix.events.list({
  category: 'Music',        // Filter by category
  status: 'Active',         // Filter by status
  q: 'concert',             // Full-text search
  organizer: 'SP1ABC...',   // Filter by organizer address
  limit: 20,                // Results per page (max 100)
  offset: 0,                // Pagination offset
});

// Get single event
const event = await veritix.events.get('event-id');

// Create event (requires auth)
const newEvent = await veritix.events.create({
  title: 'My Event',
  description: 'Description...',
  category: 'Tech',
  date: '2026-09-15T10:00:00Z',
  location: 'Abuja, Nigeria',
  image: 'https://example.com/image.jpg',
  price: '2.5',
  ticketsTotal: 100,
});

// Update event (organizer only)
const updated = await veritix.events.update('event-id', {
  title: 'Updated Title',
  ticketsTotal: 200,
});

// Cancel event (organizer only)
const cancelled = await veritix.events.cancel('event-id');
```

### Tickets (`veritix.tickets`)

```typescript
// Purchase a ticket (after sending STX payment)
const { ticket, pending } = await veritix.tickets.purchase({
  eventId: 'event-id',
  txId: '0xabc123...',      // Stacks transaction ID
  network: 'testnet',       // or 'mainnet'
});

// List my tickets
const tickets = await veritix.tickets.mine();
```

### Organizer Dashboard (`veritix.organizer`)

```typescript
// List my events with revenue
const { events } = await veritix.organizer.events();

// Get attendees for an event
const { attendees } = await veritix.organizer.attendees('event-id');

// Verify a ticket at the door
const result = await veritix.organizer.verifyTicket('ticket-id');
if (result.ok) {
  console.log('✅ Verified:', result.ticket?.ownerAddress);
}

// Activity feed
const { activity } = await veritix.organizer.activity();
```

### User Profile (`veritix.users`)

```typescript
// Get my profile
const me = await veritix.users.me();

// Update profile
const user = await veritix.users.updateProfile({
  name: 'Anuoluwapo',
  bio: 'Event organizer & Stacks builder',
  avatarUrl: 'https://example.com/avatar.jpg',
});
```

### Stacks Helpers

```typescript
import {
  buildTicketTransfer,
  buildSignInMessage,
  setEscrowAddresses,
  getEscrowAddress,
  stxToMicroStx,
  microStxToStx,
} from 'veritix-sdk';

// Configure escrow addresses
setEscrowAddresses({
  testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  mainnet: 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD7R',
});

// Build an STX transfer for a ticket purchase
const txOptions = buildTicketTransfer({
  recipientAddress: getEscrowAddress('testnet'),
  amountStx: '5.0',
  memo: 'Ticket for event-123',
  network: 'testnet',
});

// Use with @stacks/transactions
import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';

const tx = await makeSTXTokenTransfer({
  ...txOptions,
  senderKey: 'your-private-key',
});
const result = await broadcastTransaction(tx);

// Unit conversion
stxToMicroStx('1.5');   // "1500000"
microStxToStx('1500000'); // "1.5"

// Build a SIWS message for signing
const message = buildSignInMessage({
  address: 'SP1ABC...',
  nonce: 'abc123',
  issuedAt: new Date().toISOString(),
});
```

## Error Handling

The SDK throws typed errors for different HTTP status codes:

```typescript
import {
  VeritixError,
  VeritixAuthError,
  VeritixNotFoundError,
  VeritixValidationError,
} from 'veritix-sdk';

try {
  await veritix.events.get('nonexistent-id');
} catch (error) {
  if (error instanceof VeritixNotFoundError) {
    console.log('Event not found');
  } else if (error instanceof VeritixAuthError) {
    console.log('Please log in first');
  } else if (error instanceof VeritixValidationError) {
    console.log('Invalid input:', error.details);
  } else if (error instanceof VeritixError) {
    console.log(`API error ${error.status}: ${error.message}`);
  }
}
```

| Error Class | HTTP Status | When |
|---|---|---|
| `VeritixValidationError` | 400 | Invalid input |
| `VeritixAuthError` | 401 | Not authenticated |
| `VeritixForbiddenError` | 403 | Insufficient permissions |
| `VeritixNotFoundError` | 404 | Resource not found |
| `VeritixConflictError` | 409 | Duplicate resource |
| `VeritixRateLimitError` | 429 | Too many requests |
| `VeritixServiceError` | 503 | Service unavailable |
| `VeritixError` | Other | Generic API error |

## TypeScript

All types are exported for full IntelliSense and type safety:

```typescript
import type {
  VeritixEvent,
  Ticket,
  EventCategory,
  CreateEventInput,
  ListEventsParams,
} from 'veritix-sdk';

const params: ListEventsParams = {
  category: 'Music' satisfies EventCategory,
  limit: 10,
};
```

## Requirements

- Node.js 18+ (for native `fetch`) or a browser environment
- TypeScript 5.x (recommended, not required)

## License

[MIT](./LICENSE)
