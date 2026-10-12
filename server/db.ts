import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
const memoryUsers = new Map<string, User>();

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    // In-memory fallback for local development without DB connection
    const existing = memoryUsers.get(user.openId);
    const now = new Date();
    const role = user.role ?? existing?.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
    const updatedUser: User = {
      id: existing?.id ?? memoryUsers.size + 1,
      openId: user.openId,
      name: user.name ?? existing?.name ?? null,
      email: user.email ?? existing?.email ?? null,
      mobileNumber: user.mobileNumber ?? existing?.mobileNumber ?? null,
      bloodGroup: user.bloodGroup ?? existing?.bloodGroup ?? null,
      livingCity: user.livingCity ?? existing?.livingCity ?? null,
      loginMethod: user.loginMethod ?? existing?.loginMethod ?? null,
      role: role as "user" | "admin",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    memoryUsers.set(user.openId, updatedUser);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "mobileNumber", "bloodGroup", "livingCity"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    return memoryUsers.get(openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : memoryUsers.get(openId);
}

export async function updateUserProfile(openId: string, profile: { name: string; mobileNumber: string; bloodGroup: string; livingCity: string }) {
  const db = await getDb();
  if (!db) {
    const existing = memoryUsers.get(openId);
    if (existing) {
      const updated = { ...existing, ...profile, updatedAt: new Date() };
      memoryUsers.set(openId, updated);
      return updated;
    }
    return undefined;
  }

  await db.update(users).set(profile).where(eq(users.openId, openId));
  return getUserByOpenId(openId);
}

// TODO: add feature queries here as your schema grows.
