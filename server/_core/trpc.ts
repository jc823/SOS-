import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG } from "../../shared/const";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;

// ─── Base procedures ───────────────────────────────────────────────────────────

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Staff = admin, super_admin, or regular user (not customer)
export const staffProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role === "customer") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Admin = admin or super_admin
export const adminProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Pro procedure — requires active Pro or Agent subscription (admin/super_admin always pass)
export const proProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const role = ctx.user.role;
    const status = ctx.user.subscriptionStatus ?? "free";
    const isAdmin = role === "admin" || role === "super_admin";
    const isPaid = status === "pro" || status === "agent";
    if (!isAdmin && !isPaid) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This feature requires a Pro subscription. Upgrade at /pricing.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Shop manager — can manage their own shop (admin/super_admin also pass)
export const shopManagerProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const role = ctx.user.role;
    const allowed = role === "super_admin" || role === "admin" || role === "shop_manager";
    if (!allowed) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Shop manager access required." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Super admin only
export const superAdminProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
