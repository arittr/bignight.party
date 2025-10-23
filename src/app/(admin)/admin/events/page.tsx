import { EventManager } from "@/components/admin/events/event-manager";
import { deleteEventAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as eventModel from "@/lib/models/event";
import { transformEventsToListItems } from "@/lib/utils/data-transforms";

export default async function EventsPage() {
  await requireValidatedSession();

  // Use optimized query with category counts (no N+1 queries)
  const events = await eventModel.findAllWithCategoryCounts();

  // Transform events to match EventListItem interface using centralized utility
  const eventsForManager = transformEventsToListItems(events);

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
