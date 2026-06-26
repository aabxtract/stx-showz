import EventForm from "@/components/EventForm";
import PageHeader from "@/components/PageHeader";

export default function CreateEventPage() {
  return (
    <div className="container-page max-w-3xl">
      <PageHeader
        title="Create a new event"
        subtitle="Set up your event and choose whether to sell tickets on Stacks or Bitcoin."
      />
      <EventForm />
    </div>
  );
}
