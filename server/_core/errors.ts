import { TRPCError } from "@trpc/server";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "INTERNAL_SERVER_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toTRPCError(err: unknown): TRPCError {
  if (err instanceof TRPCError) return err;
  if (err instanceof Error) {
    return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message, cause: err });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: String(err) });
}
