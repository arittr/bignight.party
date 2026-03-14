import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth";

export function JoinPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/player/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong");
        return;
      }

      const { token, playerId, name: playerName } = await res.json();
      login(token, playerId, playerName);
      navigate("/picks");
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold text-[#e2b04a] mb-2">BigNight</h1>
      <p className="text-gray-400 mb-8">Oscar Prediction Game</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-gray-300 mb-1">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b04a] focus:ring-1 focus:ring-[#e2b04a]"
            placeholder="Enter your name"
            required
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm text-gray-300 mb-1">PIN (4-6 digits)</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b04a] focus:ring-1 focus:ring-[#e2b04a]"
            placeholder="Choose a PIN"
            required
            minLength={4}
            maxLength={6}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#e2b04a] text-[#1a1a2e] font-bold rounded-lg hover:bg-[#c99a3a] transition-colors disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Game"}
        </button>
      </form>
    </div>
  );
}
