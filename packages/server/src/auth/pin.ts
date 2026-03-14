export async function hashPin(pin: string): Promise<string> {
  return Bun.password.hash(pin, { algorithm: "bcrypt", cost: 10 });
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return Bun.password.verify(pin, hash);
}
