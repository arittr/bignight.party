import Link from "next/link";
import * as categoryModel from "@/lib/models/category";
import * as eventModel from "@/lib/models/event";
import * as gameModel from "@/lib/models/game";
import * as nominationModel from "@/lib/models/nomination";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";

export default async function AdminDashboardPage() {
  // Fetch all data in parallel
  const [events, games, categories, works, people, nominations] = await Promise.all([
    eventModel.findAll(),
    gameModel.findAll(),
    categoryModel.findAll(),
    workModel.findAll(),
    personModel.findAll(),
    nominationModel.findAll(),
  ]);

  // Calculate counts
  const stats = [
    { color: "bg-blue-500", count: events.length, href: "/admin/events", name: "Events" },
    { color: "bg-green-500", count: games.length, href: "/admin/games", name: "Games" },
    { color: "bg-purple-500", count: categories.length, href: "/admin/events", name: "Categories" },
    { color: "bg-orange-500", count: works.length, href: "/admin/works", name: "Works" },
    { color: "bg-pink-500", count: people.length, href: "/admin/people", name: "People" },
    {
      color: "bg-indigo-500",
      count: nominations.length,
      href: "/admin/events",
      name: "Nominations",
    },
  ];

  // Get recent events and games (up to 5 each)
  const recentEvents = events.slice(0, 5);
  const recentGames = games.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your BigNight events and games</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            href={stat.href}
            key={stat.name}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.count}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-10`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            className="block p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
            href="/admin/events/new"
          >
            Create New Event
          </Link>
          <Link
            className="block p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center font-medium"
            href="/admin/games/new"
          >
            Create New Game
          </Link>
          <Link
            className="block p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center font-medium"
            href="/admin/works/new"
          >
            Add Work
          </Link>
          <Link
            className="block p-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-center font-medium"
            href="/admin/people/new"
          >
            Add Person
          </Link>
        </div>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Events</h2>
            <Link
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              href="/admin/events"
            >
              View all
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {recentEvents.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentEvents.map((event) => (
                  <Link
                    className="block p-4 hover:bg-gray-50 transition-colors"
                    href={`/admin/events/${event.id}`}
                    key={event.id}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{event.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString()
                            : "No date set"}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.categories.length} categories
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No events created yet</p>
                <Link
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                  href="/admin/events/new"
                >
                  Create your first event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Games */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Games</h2>
            <Link
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              href="/admin/games"
            >
              View all
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {recentGames.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentGames.map((game) => (
                  <Link
                    className="block p-4 hover:bg-gray-50 transition-colors"
                    href={`/admin/games/${game.id}`}
                    key={game.id}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{game.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {game.event ? game.event.name : "No event"}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            game.status === "SETUP"
                              ? "bg-gray-100 text-gray-800"
                              : game.status === "OPEN"
                                ? "bg-blue-100 text-blue-800"
                                : game.status === "LIVE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {game.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No games created yet</p>
                <Link
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                  href="/admin/games/new"
                >
                  Create your first game
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
