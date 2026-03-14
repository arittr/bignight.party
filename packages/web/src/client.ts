const API_BASE = "/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = JSON.parse(localStorage.getItem("bignight_auth") ?? "{}")?.token;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  join: (data: { name: string; pin: string }) =>
    apiFetch<{ token: string; playerId: string; name: string }>("/player/join", {
      method: "POST", body: JSON.stringify(data),
    }),
};
