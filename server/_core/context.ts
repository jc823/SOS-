import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";

export interface TrpcContext {
  user: Omit<User, "passwordHash"> | null;
  req: Request;
  res: Response;
}
