import { PrismaClient, EventCategory, EventStatus } from "@prisma/client";
import { mockEvents } from "../lib/mockData";

const prisma = new PrismaClient();

const categoryMap: Record<string, EventCategory> = {
  Music: "Music",
  Tech: "Tech",
  Sports: "Sports",
  Art: "Art",
  Conference: "Conference",
  Workshop: "Workshop",
};

const statusMap: Record<string, EventStatus> = {
  Active: "Active",
  "Sold Out": "SoldOut",
  Cancelled: "Cancelled",
  Ended: "Ended",
};

async function main() {
  console.log("Seeding...");

  for (const evt of mockEvents) {
    const organizer = await prisma.user.upsert({
      where: { address: evt.organizer },
      update: {},
      create: { address: evt.organizer },
    });

    const sold = evt.ticketsTotal - evt.ticketsLeft;

    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: {
        id: evt.id,
        title: evt.title,
        description: evt.description,
        category: categoryMap[evt.category],
        date: new Date(evt.date),
        location: evt.location,
        image: evt.image,
        price: evt.price,
        ticketsTotal: evt.ticketsTotal,
        ticketsSold: sold,
        status: statusMap[evt.status ?? "Active"],
        organizerId: organizer.id,
      },
    });
  }

  console.log(`Seeded ${mockEvents.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
