import crypto from "crypto";
import { getDb } from "./db";
import { webhooks, webhookDeliveries } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import type { Webhook, WebhookDelivery } from "../drizzle/schema";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: unknown;
}

// ─── HTTP dispatch ─────────────────────────────────────────────────────────────
export async function dispatchWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<{ success: boolean; status?: number; error?: string }> {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": payload.event,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return { success: res.ok, status: res.status };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export async function getWebhooks(): Promise<Webhook[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
}

export async function getWebhookById(id: number): Promise<Webhook | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
  return rows[0];
}

export async function getWebhookDeliveries(webhookId: number, limit = 50): Promise<WebhookDelivery[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, webhookId))
    .orderBy(desc(webhookDeliveries.deliveredAt))
    .limit(limit);
}

export async function createWebhook(data: {
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  createdById: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhooks).values({
    name: data.name,
    url: data.url,
    secret: data.secret ?? null,
    events: data.events,
    active: data.active,
    createdById: data.createdById,
    failCount: 0,
  });
  return (result as any).insertId ?? 0;
}

export async function updateWebhook(
  id: number,
  data: Partial<{ name: string; url: string; secret: string; events: string[]; active: boolean }>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(webhooks).set(data).where(eq(webhooks.id, id));
}

export async function deleteWebhook(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(webhooks).where(eq(webhooks.id, id));
}

// ─── Event dispatch ────────────────────────────────────────────────────────────
export async function dispatchWebhookEvent(event: string, data: unknown): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const activeWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.active, true));

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  for (const wh of activeWebhooks) {
    const events = (wh.events as string[]) ?? [];
    if (!events.includes(event) && !events.includes("*")) continue;

    const result = await dispatchWebhook(wh.url, wh.secret ?? "", payload);

    // Log delivery
    await db.insert(webhookDeliveries).values({
      webhookId: wh.id,
      event,
      payload: payload as unknown as Record<string, unknown>,
      responseStatus: result.status ?? null,
      responseBody: result.error ?? null,
      success: result.success,
      attemptNumber: 1,
    });

    // Update webhook stats
    await db
      .update(webhooks)
      .set({
        lastTriggeredAt: new Date(),
        lastStatus: result.status ?? null,
        failCount: result.success ? 0 : (wh.failCount ?? 0) + 1,
      })
      .where(eq(webhooks.id, wh.id));
  }
}
