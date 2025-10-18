import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Redirect if no session
  if (!session) {
    redirect("/");
  }

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
            href="/admin"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/events"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/admin/games"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Games
          </Link>
          <Link
            href="/admin/works"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Works
          </Link>
          <Link
            href="/admin/people"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
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
