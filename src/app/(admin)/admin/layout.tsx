import Link from "next/link";
import { redirect } from "next/navigation";
import { requireValidatedSession } from "@/lib/auth/config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireValidatedSession();

  // Redirect if not admin
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">BigNight Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your events</p>
        </div>

        <nav className="space-y-2">
          <Link
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            href="/admin"
          >
            Dashboard
          </Link>
          <Link
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            href="/admin/events"
          >
            Events
          </Link>
          <Link
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            href="/admin/games"
          >
            Games
          </Link>
          <Link
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            href="/admin/works"
          >
            Works
          </Link>
          <Link
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            href="/admin/people"
          >
            People
          </Link>
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Signed in as:
            <br />
            <span className="text-white">{session.user.email}</span>
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
