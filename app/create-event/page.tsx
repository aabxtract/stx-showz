import EventForm from "@/components/EventForm";
import PageHeader from "@/components/PageHeader";

export default function CreateEventPage() {
  return (
    <div className="container-page max-w-3xl">
      <PageHeader
        title="Create a new event"
        subtitle="Set up your event and configure how tickets are sold. Everything below will be minted on Stacks once on-chain integration ships."
      />
      <EventForm />
    </div>
  );
}
