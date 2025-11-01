import { PeopleManager } from "@/components/admin/people/people-manager";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";
import { transformPeopleToListItems } from "@/lib/utils/data-transforms";

export default async function PeoplePage() {
  await requireValidatedSession();

  // Fetch people via oRPC server client (no HTTP overhead)
  const people = await serverClient.admin.listPeople();

  // Transform people to match PersonListItem interface using centralized utility
  const peopleForManager = transformPeopleToListItems(people);

  // Server action wrapper for delete using oRPC
  async function handleDelete(personId: string) {
    "use server";
    const result = await serverClient.admin.deletePerson({ id: personId });
    if (!result?.success) {
      throw new Error("Failed to delete person");
    }
  }

  return <PeopleManager onDelete={handleDelete} people={peopleForManager} />;
}
