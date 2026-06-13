import type { Event, User } from "@prisma/client";

export function serializeEvent(
  event: Event & { organizer?: Pick<User, "address" | "name"> | null },
) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date.toISOString(),
    location: event.location,
    image: event.image,
    price: event.price.toString(),
    ticketsTotal: event.ticketsTotal,
    ticketsSold: event.ticketsSold,
    ticketsLeft: event.ticketsTotal - event.ticketsSold,
    status: event.status,
    organizerId: event.organizerId,
    organizer: event.organizer
      ? { address: event.organizer.address, name: event.organizer.name }
      : undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
