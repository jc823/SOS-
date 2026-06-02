import { router, publicProcedure } from "./trpc";

// System-level tRPC procedures (health checks, version info, etc.)
export const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),
});
