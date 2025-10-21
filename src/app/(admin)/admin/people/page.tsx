import Image from "next/image";
import Link from "next/link";
import * as personModel from "@/lib/models/person";

export default async function PeoplePage() {
  const people = await personModel.findAll();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">People</h1>
        <Link
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          href="/admin/people/new"
        >
          Add Person
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                Name
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                Image
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                Nominations
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                scope="col"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {people.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan={4}>
                  No people found. Add your first person to get started.
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr className="hover:bg-gray-50" key={person.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{person.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {person.imageUrl ? (
                      <Image
                        alt={person.name}
                        className="h-10 w-10 rounded-full object-cover"
                        height={40}
                        src={person.imageUrl}
                        unoptimized
                        width={40}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {person.nominations.length} nomination
                      {person.nominations.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      className="text-blue-600 hover:text-blue-900 font-medium"
                      href={`/admin/people/${person.id}`}
                    >
                      View Details
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
