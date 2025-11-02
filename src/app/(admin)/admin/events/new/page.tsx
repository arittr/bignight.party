import Link from "next/link";
import { CreateEventForm } from "@/components/admin/events/create-event-form";
import { routes } from "@/lib/routes";

export default function NewEventPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link className="text-blue-600 hover:text-blue-800" href={routes.admin.events.index()}>
          &larr; Back to Events
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <CreateEventForm />
      </div>
    </div>
  );
}
