import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "../auth";

export function Layout() {
  const { token, name } = useAuth();
  const location = useLocation();
  const showNav = !!token && location.pathname !== "/";

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && (
        <nav className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-sm text-gray-400">{name}</span>
          <div className="flex gap-4 text-sm">
            <Link to="/picks" className="text-[#e2b04a] hover:underline">Picks</Link>
            <Link to="/leaderboard" className="text-[#e2b04a] hover:underline">Leaderboard</Link>
            <Link to="/my-picks" className="text-[#e2b04a] hover:underline">My Picks</Link>
          </div>
        </nav>
      )}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
