import Link from "next/link";
import { CreateWorkForm } from "@/components/admin/works/create-work-form";
import { requireValidatedSession } from "@/lib/auth/config";

export default async function NewWorkPage() {
  await requireValidatedSession();

  return (
    <div>
      <div className="mb-8">
        <Link className="text-blue-600 hover:text-blue-800 mb-4 inline-block" href="/admin/works">
          ← Back to Works
        </Link>
        <h1 className="text-3xl font-bold">Create New Work</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <CreateWorkForm />
      </div>
    </div>
  );
}
