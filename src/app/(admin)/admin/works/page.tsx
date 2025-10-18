import Link from "next/link";
import { WorkType } from "@prisma/client";
import * as workModel from "@/lib/models/work";

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
          href="/admin/works/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          New Work
        </Link>
      </div>

      {/* Type filter */}
      <div className="mb-6">
        <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Type
        </label>
        <form>
          <select
            id="typeFilter"
            name="type"
            defaultValue={typeFilter || ""}
            onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) {
                form.submit();
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value={WorkType.FILM}>Film</option>
            <option value={WorkType.TV_SHOW}>TV Show</option>
            <option value={WorkType.ALBUM}>Album</option>
            <option value={WorkType.SONG}>Song</option>
            <option value={WorkType.PLAY}>Play</option>
            <option value={WorkType.BOOK}>Book</option>
          </select>
        </form>
      </div>

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
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No works found. Create one to get started.
                </td>
              </tr>
            ) : (
              works.map((work) => (
                <tr key={work.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/works/${work.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
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
                      href={`/admin/works/${work.id}`}
                      className="text-blue-600 hover:text-blue-900"
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
