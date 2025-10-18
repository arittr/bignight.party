import type { WorkType } from "@prisma/client";
import Link from "next/link";
import * as workModel from "@/lib/models/work";
import { TypeFilter } from "./_components/type-filter";

interface WorksPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function WorksPage(props: WorksPageProps) {
  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type as WorkType | undefined;

  // Fetch works based on type filter
  const works = typeFilter ? await workModel.findByType(typeFilter) : await workModel.findAll();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Works</h1>
        <Link
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          href="/admin/works/new"
        >
          New Work
        </Link>
      </div>

      {/* Type filter */}
      <TypeFilter />

      {/* Works table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nominations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {works.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan={5}>
                  No works found. Create one to get started.
                </td>
              </tr>
            ) : (
              works.map((work) => (
                <tr className="hover:bg-gray-50" key={work.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      href={`/admin/works/${work.id}`}
                    >
                      {work.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {work.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{work.year || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {work.nominations.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      className="text-blue-600 hover:text-blue-900"
                      href={`/admin/works/${work.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
