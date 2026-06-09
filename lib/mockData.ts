import type {
  AppEvent,
  Ticket,
  OrganizerEvent,
  Activity,
  Attendee,
} from "./types";

export const shortAddr = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

export const mockEvents: AppEvent[] = [
  {
    id: "evt-001",
    title: "Stacks Builders Summit 2026",
    description:
      "A full-day summit bringing together Stacks builders, designers, and founders to share what they're shipping. Talks, workshops, and a closing networking party.",
    category: "Conference",
    date: "2026-08-12T10:00:00Z",
    location: "Lagos, Nigeria",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    price: 25,
    ticketsTotal: 500,
    ticketsLeft: 142,
    organizer: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
    status: "Active",
  },
  {
    id: "evt-002",
    title: "Afrobeats Night: Live in Concert",
    description:
      "A high-energy live music night featuring the freshest Afrobeats acts. Doors open at 7pm, show starts at 8pm.",
    category: "Music",
    date: "2026-07-20T20:00:00Z",
    location: "Accra, Ghana",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
    price: 15,
    ticketsTotal: 1000,
    ticketsLeft: 612,
    organizer: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    status: "Active",
  },
  {
    id: "evt-003",
    title: "Web3 Design Workshop",
    description:
      "A hands-on workshop covering the principles of designing for decentralized products. Bring your laptop.",
    category: "Workshop",
    date: "2026-09-04T14:00:00Z",
    location: "Online",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
    price: 5,
    ticketsTotal: 200,
    ticketsLeft: 88,
    organizer: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
    status: "Active",
  },
  {
    id: "evt-004",
    title: "Lagos Marathon 2026",
    description:
      "The annual Lagos Marathon. Run with thousands of others through the city. Includes a finisher medal and a ticket to the after-party.",
    category: "Sports",
    date: "2026-10-15T06:00:00Z",
    location: "Lagos, Nigeria",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80",
    price: 10,
    ticketsTotal: 5000,
    ticketsLeft: 2330,
    organizer: "SPMR2N4XJ8GMTPK9FZSDC8K9YQ6TG7H3M2VJW9XA",
    status: "Active",
  },
  {
    id: "evt-005",
    title: "Generative Art Exhibition",
    description:
      "An evening showcase of generative and on-chain art from artists across Africa. Wine, conversations, and the opportunity to collect.",
    category: "Art",
    date: "2026-07-30T18:00:00Z",
    location: "Cape Town, South Africa",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&q=80",
    price: 12,
    ticketsTotal: 150,
    ticketsLeft: 0,
    organizer: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    status: "Sold Out",
  },
];

export const mockTickets: Ticket[] = [
  {
    id: "tkt-1001",
    eventId: "evt-001",
    eventName: "Stacks Builders Summit 2026",
    eventDate: "2026-08-12T10:00:00Z",
    location: "Lagos, Nigeria",
    owner: "SP3CURRENTUSER9XY2VJ8DR6KMP4Q2WLA8N3FB7XY",
    status: "Valid",
  },
  {
    id: "tkt-1002",
    eventId: "evt-002",
    eventName: "Afrobeats Night: Live in Concert",
    eventDate: "2026-07-20T20:00:00Z",
    location: "Accra, Ghana",
    owner: "SP3CURRENTUSER9XY2VJ8DR6KMP4Q2WLA8N3FB7XY",
    status: "Used",
  },
  {
    id: "tkt-1003",
    eventId: "evt-003",
    eventName: "Web3 Design Workshop",
    eventDate: "2026-09-04T14:00:00Z",
    location: "Online",
    owner: "SP3CURRENTUSER9XY2VJ8DR6KMP4Q2WLA8N3FB7XY",
    status: "Cancelled",
  },
];

const sampleAttendees: Attendee[] = [
  {
    wallet: "SPATTENDEE1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6",
    ticketId: "tkt-2001",
    purchasedAt: "2026-05-12T11:00:00Z",
    checkedIn: true,
  },
  {
    wallet: "SPATTENDEE2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7",
    ticketId: "tkt-2002",
    purchasedAt: "2026-05-13T09:24:00Z",
    checkedIn: false,
  },
  {
    wallet: "SPATTENDEE3E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2",
    ticketId: "tkt-2003",
    purchasedAt: "2026-05-14T15:42:00Z",
    checkedIn: false,
  },
  {
    wallet: "SPATTENDEE4T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7",
    ticketId: "tkt-2004",
    purchasedAt: "2026-05-15T18:00:00Z",
    checkedIn: true,
  },
];

export const mockOrganizerEvents: OrganizerEvent[] = [
  {
    ...mockEvents[0],
    ticketsSold: mockEvents[0].ticketsTotal - mockEvents[0].ticketsLeft,
    revenue:
      (mockEvents[0].ticketsTotal - mockEvents[0].ticketsLeft) *
      mockEvents[0].price,
    attendees: sampleAttendees,
  },
  {
    ...mockEvents[2],
    ticketsSold: mockEvents[2].ticketsTotal - mockEvents[2].ticketsLeft,
    revenue:
      (mockEvents[2].ticketsTotal - mockEvents[2].ticketsLeft) *
      mockEvents[2].price,
    attendees: sampleAttendees.slice(0, 2),
  },
];

export const mockActivity: Activity[] = [
  {
    id: "act-1",
    type: "purchase",
    label: "You bought a ticket to Stacks Builders Summit 2026",
    timestamp: "2026-06-05T14:22:00Z",
  },
  {
    id: "act-2",
    type: "create",
    label: "You created the event 'Web3 Design Workshop'",
    timestamp: "2026-06-02T10:08:00Z",
  },
  {
    id: "act-3",
    type: "verify",
    label: "You verified ticket tkt-1002 at Afrobeats Night",
    timestamp: "2026-05-30T21:14:00Z",
  },
  {
    id: "act-4",
    type: "withdraw",
    label: "You withdrew 320 STX from Stacks Builders Summit",
    timestamp: "2026-05-28T09:00:00Z",
  },
];

export const currentUser = {
  wallet: "SP3CURRENTUSER9XY2VJ8DR6KMP4Q2WLA8N3FB7XY",
  role: "Organizer" as "Organizer" | "Attendee",
  totalTicketsOwned: mockTickets.length,
  totalEventsCreated: mockOrganizerEvents.length,
};
