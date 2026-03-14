// TODO: Implement full auth context in auth task
// Stub for hook imports

export interface AuthState {
  token: string | null;
  playerId: string | null;
  name: string | null;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  throw new Error("useAuth must be used within an AuthProvider");
}
