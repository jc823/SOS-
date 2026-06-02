import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── tRPC API ───────────────────────────────────────────────────────────────
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      let user = null;
      const token = req.cookies?.[COOKIE_NAME];
      if (token) {
        const payload = await sdk.verifySessionToken(token);
        if (payload?.sub) {
          try {
            const row = await db.getUserByOpenId(payload.sub);
            if (row) {
              const { passwordHash: _, ...safe } = row;
              user = safe;
            }
          } catch {
            // ignore DB errors during auth
          }
        }
      }
      return { user, req, res };
    },
  }),
);

// ─── Serve static frontend in production ───────────────────────────────────
const isProd = ENV.nodeEnv === "production";
if (isProd) {
  const distDir = path.resolve(process.cwd(), "dist/public");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(ENV.port, () => {
  console.log(`[Server] Running on http://localhost:${ENV.port}`);
  console.log(`[Server] Mode: ${ENV.nodeEnv}`);
});

export { app };
