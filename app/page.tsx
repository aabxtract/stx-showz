import Link from "next/link";
import EventCard from "@/components/EventCard";
import { mockEvents } from "@/lib/mockData";

const steps = [
  {
    title: "Create your event",
    desc: "Set up your event in minutes — pick a date, upload an image, and configure ticket supply.",
    icon: "✨",
  },
  {
    title: "Sell tickets on Stacks",
    desc: "Tickets are minted on the Stacks blockchain. Attendees pay in STX, you keep ownership of the funds.",
    icon: "🎟️",
  },
  {
    title: "Verify at the door",
    desc: "Scan attendee tickets at the entrance. Verification is instant and tamper-proof.",
    icon: "✅",
  },
];

export default function HomePage() {
  const featured = mockEvents.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, rgba(109,73,255,0.18), transparent 60%), radial-gradient(50% 50% at 0% 100%, rgba(180,150,255,0.18), transparent 60%)",
          }}
        />
        <div className="container-page pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Built on Stacks
            </div>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
              Create, sell, and verify event tickets on{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-800 bg-clip-text text-transparent">
                Stacks.
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-2xl">
              A simple event ticketing platform where organizers can create
              events, sell tickets, and verify attendees with blockchain-backed
              tickets.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/events" className="btn-primary text-base !py-3 !px-6">
                Explore Events
              </Link>
              <Link
                href="/signup"
                className="btn-secondary text-base !py-3 !px-6"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page !py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="text-slate-600 mt-2">
            Three steps from idea to a verified attendee at your door.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-6">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="text-xs font-mono text-brand-600">
                STEP 0{i + 1}
              </div>
              <h3 className="font-semibold text-lg mt-1">{s.title}</h3>
              <p className="text-slate-600 text-sm mt-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured events */}
      <section className="container-page !pt-4 !pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Featured events
            </h2>
            <p className="text-slate-600 mt-1">
              Hand-picked events happening soon.
            </p>
          </div>
          <Link
            href="/events"
            className="hidden sm:inline text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            See all events →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>

        <div className="mt-16 card p-8 sm:p-12 bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center">
          <h3 className="text-2xl sm:text-3xl font-semibold">
            Ready to host your next event?
          </h3>
          <p className="mt-2 text-brand-100 max-w-xl mx-auto">
            Spin up a blockchain-backed ticket sale in minutes. No middlemen, no
            chargebacks.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="btn bg-white text-brand-700 hover:bg-brand-50 !py-3 !px-6"
            >
              Get Started
            </Link>
            <Link
              href="/events"
              className="btn bg-brand-700/40 text-white border border-white/30 hover:bg-brand-700/60 !py-3 !px-6"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
