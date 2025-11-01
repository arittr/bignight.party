import { EventManager } from "@/components/admin/events/event-manager";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";
import { transformEventsToListItems } from "@/lib/utils/data-transforms";

export default async function EventsPage() {
  await requireValidatedSession();

  // Fetch events via oRPC server client (no HTTP overhead)
  const events = await serverClient.admin.listEvents();

  // Transform events to match EventListItem interface using centralized utility
  const eventsForManager = transformEventsToListItems(events);

  // Server action wrapper for delete using oRPC
  async function handleDelete(eventId: string) {
    "use server";
    const result = await serverClient.admin.deleteEvent({ id: eventId });
    if (!result?.success) {
      throw new Error("Failed to delete event");
    }
  }

  return <EventManager events={eventsForManager} onDelete={handleDelete} />;
}
