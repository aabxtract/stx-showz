# STX Showz

A frontend prototype for a Stacks-based event ticketing platform. Mock data only — no smart contract, wallet, or backend integration yet.

## Stack
- Next.js 14 (App Router) · TypeScript · Tailwind CSS

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Routes
- `/` — landing page
- `/events` — browse events (search + filter)
- `/events/[id]` — event detail
- `/create-event` — organizer creates an event (mock submit)
- `/my-tickets` — tickets owned by current user
- `/tickets/[id]` — single ticket with QR placeholder
- `/organizer/dashboard` — organizer overview
- `/organizer/events/[id]` — manage one event
- `/organizer/verify` — verify a ticket at the door
- `/profile` — user profile and activity

All data lives in `lib/mockData.ts`.
