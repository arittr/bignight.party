import type { WorkType } from "@prisma/client";
import { WorksManager } from "@/components/admin/works/works-manager";
import { deleteWorkAction } from "@/lib/actions/admin-actions";
import { requireValidatedSession } from "@/lib/auth/config";
import * as workModel from "@/lib/models/work";

interface WorksPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function WorksPage(props: WorksPageProps) {
  await requireValidatedSession();

  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type as WorkType | undefined;

  // Fetch works based on type filter
  const works = typeFilter ? await workModel.findByType(typeFilter) : await workModel.findAll();

  // Transform works to match WorkListItem interface
  const worksForManager = works.map((work) => ({
    id: work.id,
    nominationsCount: work.nominations.length,
    title: work.title,
    type: work.type,
    year: work.year,
  }));

  // Server action wrapper for delete
  async function handleDelete(workId: string) {
    "use server";
    const result = await deleteWorkAction({ id: workId });
    if (!result?.data?.success) {
      throw new Error("Failed to delete work");
    }
  }

  return (
    <WorksManager onDelete={handleDelete} typeFilter={typeFilter ?? null} works={worksForManager} />
  );
}
