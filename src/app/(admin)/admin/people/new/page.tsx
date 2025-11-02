import Link from "next/link";
import { CreatePersonForm } from "@/components/admin/people/create-person-form";
import { routes } from "@/lib/routes";

export default function NewPersonPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          href={routes.admin.people.index()}
        >
          ← Back to People
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Person</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <CreatePersonForm />
        </div>
      </div>
    </div>
  );
}
