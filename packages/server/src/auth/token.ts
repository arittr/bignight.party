import { SignJWT, jwtVerify } from "jose";

// TODO: import TOKEN_EXPIRY_HOURS from @bignight/shared once constants are defined there
const TOKEN_EXPIRY_HOURS = 24;

export interface TokenPayload {
  playerId: string;
  isAdmin: boolean;
}

interface SignOptions {
  expiresInSeconds?: number;
}

const JWT_SECRET_STRING = process.env.JWT_SECRET ?? "bignight-dev-secret-change-in-prod";
const secret = new TextEncoder().encode(JWT_SECRET_STRING);

export async function signToken(payload: TokenPayload, options?: SignOptions): Promise<string> {
  const expiresIn = options?.expiresInSeconds ?? TOKEN_EXPIRY_HOURS * 3600;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { playerId: payload.playerId as string, isAdmin: payload.isAdmin as boolean };
  } catch {
    return null;
  }
}
