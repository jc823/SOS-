/**
 * Tests for the leads tRPC procedures.
 *
 * These tests use in-memory mocks so no real DB connection is needed.
 * They verify the public `submit` procedure validates input correctly,
 * and the admin `list`, `updateStatus`, and `stats` procedures are
 * protected behind the adminProcedure guard.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the DB helpers so tests don't need a real database ───
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    createLead: vi.fn().mockResolvedValue(42),
    getAllLeads: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "John Smith",
        email: "john@test.com",
        phone: "5551234567",
        shopName: "Elite Auto Spa",
        overallPercentage: 65.5,
        status: "new",
        notes: null,
        source: "self-assessment",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        scores: null,
        pillarResults: null,
      },
    ]),
    updateLeadStatus: vi.fn().mockResolvedValue(undefined),
    getLeadsStats: vi.fn().mockResolvedValue({ total: 1, byStatus: { new: 1 } }),
  };
});

// ─── Context helpers ───
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      username: null,
      shopId: null,
      email: "admin@scaledetailing.com",
      name: "Admin User",
      loginMethod: "password",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      username: null,
      shopId: null,
      email: "user@test.com",
      name: "Regular User",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ───
describe("leads.submit (public procedure)", () => {
  it("accepts a valid lead submission and returns success + leadId", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      name: "John Smith",
      email: "john@eliteautospa.com",
      phone: "5551234567",
      shopName: "Elite Auto Spa",
      overallPercentage: 65.5,
      pillarResults: [
        { id: "services", label: "Services", percentage: 70, band: "good" },
      ],
      source: "self-assessment",
    });
    expect(result.success).toBe(true);
    expect(result.leadId).toBe(42);
  });

  it("rejects a submission with an invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({
        name: "John Smith",
        email: "not-an-email",
        phone: "5551234567",
      })
    ).rejects.toThrow();
  });

  it("rejects a submission with a missing name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({
        name: "",
        email: "john@test.com",
        phone: "5551234567",
      })
    ).rejects.toThrow();
  });

  it("rejects a submission with a phone number that is too short", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({
        name: "John Smith",
        email: "john@test.com",
        phone: "123",
      })
    ).rejects.toThrow();
  });

  it("works without optional fields (shopName, scores, pillarResults)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      name: "Jane Doe",
      email: "jane@test.com",
      phone: "5559876543",
    });
    expect(result.success).toBe(true);
  });
});

describe("leads.list (admin procedure)", () => {
  it("returns leads list for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const leads = await caller.leads.list();
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
    expect(leads[0]).toMatchObject({ name: "John Smith", email: "john@test.com" });
  });

  it("rejects access for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.list()).rejects.toThrow();
  });

  it("rejects access for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.leads.list()).rejects.toThrow();
  });
});

describe("leads.updateStatus (admin procedure)", () => {
  it("allows admin to update lead status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.leads.updateStatus({
      id: 1,
      status: "contacted",
      notes: "Called on Jan 2, left voicemail",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status values", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.leads.updateStatus({
        id: 1,
        status: "invalid_status" as "new",
      })
    ).rejects.toThrow();
  });

  it("rejects access for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.leads.updateStatus({ id: 1, status: "contacted" })
    ).rejects.toThrow();
  });
});

describe("leads.stats (admin procedure)", () => {
  it("returns stats for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.leads.stats();
    expect(stats).toMatchObject({ total: 1, byStatus: { new: 1 } });
  });

  it("rejects access for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.stats()).rejects.toThrow();
  });
});
