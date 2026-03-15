import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function AdminPage() {
  const { token, isAdmin, loginAdmin } = useAuth();
  const queryClient = useQueryClient();

  if (!isAdmin) return <AdminLogin onLogin={loginAdmin} />;
  return <AdminDashboard token={token!} queryClient={queryClient} />;
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      setError("Invalid PIN");
      return;
    }
    const { token } = await res.json();
    onLogin(token);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold text-[#e2b04a] mb-6">Admin Access</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Admin PIN"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#e2b04a] focus:ring-1 focus:ring-[#e2b04a] focus:outline-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 bg-[#e2b04a] text-[#1a1a2e] font-bold rounded-lg"
        >
          Login
        </button>
      </form>
    </div>
  );
}

interface Category {
  id: string;
  name: string;
  nominations?: unknown[];
}

interface GameState {
  phase?: string;
}

interface PreviewData {
  categories?: unknown[];
}

function AdminDashboard({
  token,
  queryClient,
}: {
  token: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  // Wikipedia import state
  const [wikiUrl, setWikiUrl] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Fetch game state
  const { data: gameState } = useQuery<GameState>({
    queryKey: ["game-state"],
    queryFn: async () => {
      const res = await fetch("/api/game", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.categories;
    },
  });

  async function handlePreview() {
    const res = await fetch("/api/admin/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: wikiUrl }),
    });
    if (res.ok) setPreviewData(await res.json());
  }

  async function handleImport() {
    setImportStatus("Importing...");
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: wikiUrl }),
    });
    if (res.ok) {
      setImportStatus("Imported!");
      setPreviewData(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } else {
      const body = await res.json();
      setImportStatus(`Error: ${body.error}`);
    }
  }

  async function handleReset() {
    if (!confirm("Are you sure? This deletes ALL data.")) return;
    await fetch("/api/admin/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ confirm: true }),
    });
    queryClient.invalidateQueries();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e2b04a]">Admin Dashboard</h1>
        <Link to="/admin/live" className="px-4 py-2 bg-[#e2b04a] text-[#1a1a2e] font-bold rounded-lg text-sm hover:bg-[#c99a3a]">
          Go Live
        </Link>
        <Link to="/admin/players" className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20">
          Players
        </Link>
      </div>
      <p className="text-sm text-gray-400">
        Phase: {gameState?.phase ?? "loading..."}
      </p>

      {/* Wikipedia Import */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Import from Wikipedia
        </h2>
        <div className="flex gap-2">
          <input
            type="url"
            value={wikiUrl}
            onChange={(e) => setWikiUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/97th_Academy_Awards"
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#e2b04a] focus:outline-none"
          />
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20"
          >
            Preview
          </button>
        </div>

        {previewData && (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              {previewData.categories?.length} categories found
            </p>
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-2 bg-[#e2b04a] text-[#1a1a2e] font-bold rounded-lg text-sm"
            >
              Import
            </button>
          </div>
        )}
        {importStatus && (
          <p className="text-sm text-gray-400">{importStatus}</p>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            Categories ({categories.length})
          </h2>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="text-sm text-gray-300 flex justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-gray-500">
                  {cat.nominations?.length} nominees
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reset */}
      <section>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
        >
          Reset Game
        </button>
      </section>
    </div>
  );
}
