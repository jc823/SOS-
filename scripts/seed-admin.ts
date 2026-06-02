import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./local.db" });
const db = drizzle(client);

const USERNAME = "admin";
const PASSWORD = "admin123";
const NAME = "Admin";

const existing = await db.select().from(users).where(eq(users.username, USERNAME)).limit(1);
if (existing.length > 0) {
  console.log(`User "${USERNAME}" already exists (id=${existing[0].id}). No changes made.`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(PASSWORD, 12);
const openId = `local_${Date.now()}_seed`;

await db.insert(users).values({
  openId,
  username: USERNAME,
  passwordHash,
  name: NAME,
  loginMethod: "password",
  role: "super_admin",
  lastSignedIn: new Date(),
});

console.log(`✓ Created super_admin user:`);
console.log(`  Username: ${USERNAME}`);
console.log(`  Password: ${PASSWORD}`);
console.log(`  → Go to http://localhost:5173/login and sign in`);

client.close();
