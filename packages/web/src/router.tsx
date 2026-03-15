import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/layout";
import { JoinPage } from "./pages/join";
import { PicksPage } from "./pages/picks";
import { LeaderboardPage } from "./pages/leaderboard";
import { MyPicksPage } from "./pages/my-picks";
import { AdminPage } from "./pages/admin";
import { AdminLivePage } from "./pages/admin-live";
import { AdminPlayersPage } from "./pages/admin-players";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<JoinPage />} />
          <Route path="/picks" element={<PicksPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/my-picks" element={<MyPicksPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/live" element={<AdminLivePage />} />
          <Route path="/admin/players" element={<AdminPlayersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
