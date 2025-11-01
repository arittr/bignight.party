import type { WorkType } from "@prisma/client";
import { WorksManager } from "@/components/admin/works/works-manager";
import { serverClient } from "@/lib/api/server-client";
import { requireValidatedSession } from "@/lib/auth/config";
import { transformWorksToListItems } from "@/lib/utils/data-transforms";

interface WorksPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function WorksPage(props: WorksPageProps) {
  await requireValidatedSession();

  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type as WorkType | undefined;

  // Fetch works via oRPC server client (no HTTP overhead)
  const allWorks = await serverClient.admin.listWorks();

  // Apply type filter client-side (consider adding to contract if needed frequently)
  const works = typeFilter ? allWorks.filter((w) => w.type === typeFilter) : allWorks;

  // Transform works to match WorkListItem interface using centralized utility
  const worksForManager = transformWorksToListItems(works);

  // Server action wrapper for delete using oRPC
  async function handleDelete(workId: string) {
    "use server";
    const result = await serverClient.admin.deleteWork({ id: workId });
    if (!result?.success) {
      throw new Error("Failed to delete work");
    }
  }

  return (
    <WorksManager onDelete={handleDelete} typeFilter={typeFilter ?? null} works={worksForManager} />
  );
}
