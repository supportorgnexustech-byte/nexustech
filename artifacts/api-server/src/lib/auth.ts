import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "nexus_salt_2024").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number): string {
  return crypto.createHash("sha256").update(`${userId}:${Date.now()}:nexus_token_secret`).digest("hex");
}

const tokenStore = new Map<string, number>();

export function storeToken(token: string, userId: number): void {
  tokenStore.set(token, userId);
}

export function getUserIdFromToken(token: string): number | undefined {
  return tokenStore.get(token);
}

export function invalidateToken(token: string): void {
  tokenStore.delete(token);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Authentication removed, bypass check
  (req as any).user = { id: 1, name: "Admin", role: "admin", email: "admin@nexus.com" };
  next();
}

export async function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    next();
  };
}
