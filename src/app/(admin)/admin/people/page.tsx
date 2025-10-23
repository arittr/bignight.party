import { PeopleManager } from "@/components/admin/people/people-manager";
import { deletePersonAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as personModel from "@/lib/models/person";
import { transformPeopleToListItems } from "@/lib/utils/data-transforms";

export default async function PeoplePage() {
  await requireValidatedSession();

  const people = await personModel.findAllWithCounts();

  // Transform people to match PersonListItem interface using centralized utility
  const peopleForManager = transformPeopleToListItems(people);

  // Server action wrapper for delete
  async function handleDelete(personId: string) {
    "use server";
    const result = await deletePersonAction({ id: personId });
    if (!result?.data?.success) {
      throw new Error("Failed to delete person");
    }
  }

  return <PeopleManager onDelete={handleDelete} people={peopleForManager} />;
}
