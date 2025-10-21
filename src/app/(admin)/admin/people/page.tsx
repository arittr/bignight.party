import { PeopleManager } from "@/components/admin/people/people-manager";
import { deletePersonAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as personModel from "@/lib/models/person";

export default async function PeoplePage() {
  await requireValidatedSession();

  const people = await personModel.findAll();

  // Transform people to match PersonListItem interface
  const peopleForManager = people.map((person) => ({
    id: person.id,
    name: person.name,
    nominationsCount: person.nominations.length,
    role: null,
    worksCount: 0, // TODO: Add works count when work-person relationship is implemented
  }));

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
