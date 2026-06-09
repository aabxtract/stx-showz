import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import OrganizerStats from "@/components/OrganizerStats";
import EmptyState from "@/components/EmptyState";
import { mockOrganizerEvents } from "@/lib/mockData";

export default function OrganizerDashboardPage() {
  const events = mockOrganizerEvents;
  const totalEvents = events.length;
  const totalTicketsSold = events.reduce((s, e) => s + e.ticketsSold, 0);
  const totalRevenue = events.reduce((s, e) => s + e.revenue, 0);

  return (
    <div className="container-page">
      <PageHeader
        title="Organizer dashboard"
        subtitle="An overview of your events and ticket sales."
        action={
          <Link href="/create-event" className="btn-primary">
            + New Event
          </Link>
        }
      />

      <OrganizerStats
        stats={[
          { label: "Total events", value: totalEvents },
          { label: "Tickets sold", value: totalTicketsSold.toLocaleString() },
          { label: "Total revenue", value: `${totalRevenue.toLocaleString()} STX` },
        ]}
      />

      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-4">Your events</h2>
        {events.length === 0 ? (
          <EmptyState
            icon="🪄"
            title="You haven't created any events yet"
            action={
              <Link href="/create-event" className="btn-primary">
                Create your first event
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {events.map((e) => {
              const date = new Date(e.date);
              const pct = (e.ticketsSold / e.ticketsTotal) * 100;
              return (
                <div key={e.id} className="card p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{e.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {e.status ?? "Active"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        📅{" "}
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · 📍 {e.location}
                      </div>
                      <div className="mt-3 max-w-md">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>
                            {e.ticketsSold} / {e.ticketsTotal} tickets
                          </span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 lg:gap-8">
                      <div>
                        <div className="text-xs text-slate-500">Revenue</div>
                        <div className="font-semibold">{e.revenue} STX</div>
                      </div>
                      <Link
                        href={`/organizer/events/${e.id}`}
                        className="btn-secondary"
                      >
                        Manage Event
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
