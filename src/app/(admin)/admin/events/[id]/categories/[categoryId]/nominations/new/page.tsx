import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateNominationForm } from "@/components/admin/nominations/create-nomination-form";
import * as categoryModel from "@/lib/models/category";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";
import { routes } from "@/lib/routes";

type PageProps = {
  params: Promise<{
    id: string;
    categoryId: string;
  }>;
};

export default async function NewNominationPage({ params }: PageProps) {
  const { id: eventId, categoryId } = await params;

  // Fetch category to verify it exists and belongs to this event
  const category = await categoryModel.findById(categoryId);

  if (!category || category.eventId !== eventId) {
    redirect(routes.admin.events.detail(eventId));
  }

  // Fetch all works and people for dropdowns
  const works = await workModel.findAll();
  const people = await personModel.findAll();

  return (
    <div>
      <div className="mb-6">
        <Link
          className="text-blue-600 hover:text-blue-800 text-sm"
          href={routes.admin.events.categories.detail(eventId, categoryId)}
        >
          ← Back to Category
        </Link>
      </div>

      <CreateNominationForm
        categoryId={categoryId}
        categoryName={category.name}
        eventId={eventId}
        people={people}
        works={works}
      />
    </div>
  );
}
