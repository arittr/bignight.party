import { EventManager } from "@/components/admin/events/event-manager";
import { deleteEventAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as eventModel from "@/lib/models/event";

export default async function EventsPage() {
  await requireValidatedSession();

  const events = await eventModel.findAll();

  // Transform events to match EventListItem interface
  const eventsForManager = events.map((event) => ({
    _count: {
      categories: event.categories.length,
    },
    description: event.description,
    eventDate: event.eventDate,
    id: event.id,
    name: event.name,
    slug: event.slug,
  }));

  // Server action wrapper for delete
  async function handleDelete(eventId: string) {
    "use server";
    const result = await deleteEventAction({ id: eventId });
    if (!result?.data?.success) {
      throw new Error("Failed to delete event");
    }
  }

  return <EventManager events={eventsForManager} onDelete={handleDelete} />;
}
