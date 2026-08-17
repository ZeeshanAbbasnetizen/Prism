import path from "path";
import fs from "fs";
import crypto from "crypto";
import { DatabaseSync } from "node:sqlite";
import { QueuePost, QueuePostStatus, ParsedHistoryItem } from "@/types/scraper";
import { sendToTelegram } from "./telegram";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "prism.db");
const LEGACY_POSTS_FILE = path.join(DATA_DIR, "posts.json");
const LEGACY_HISTORY_FILE = path.join(DATA_DIR, "history.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global database instance singleton
let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);

    // Enable WAL mode for high concurrency and performance
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA synchronous = NORMAL;");

    // Initialize Schema
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        product_title TEXT NOT NULL,
        image_url TEXT,
        affiliate_url TEXT,
        caption TEXT NOT NULL,
        price TEXT,
        currency TEXT,
        site_name TEXT,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_scheduled_time ON posts(scheduled_time);

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        affiliate_url TEXT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        price REAL,
        currency TEXT,
        site_name TEXT,
        parsed_at TEXT NOT NULL,
        copy_generated TEXT,
        tone TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_history_parsed_at ON history(parsed_at DESC);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Migrate any legacy JSON files if they exist
    migrateLegacyJson(dbInstance);
  }
  return dbInstance;
}

/**
 * Automatically migrate legacy JSON files into SQLite database
 */
function migrateLegacyJson(db: DatabaseSync): void {
  try {
    if (fs.existsSync(LEGACY_POSTS_FILE)) {
      const raw = fs.readFileSync(LEGACY_POSTS_FILE, "utf-8");
      const legacyPosts: QueuePost[] = JSON.parse(raw || "[]");
      if (Array.isArray(legacyPosts) && legacyPosts.length > 0) {
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO posts (
            id, product_title, image_url, affiliate_url, caption,
            price, currency, site_name, scheduled_time, status,
            created_at, updated_at, error_message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of legacyPosts) {
          stmt.run(
            p.id,
            p.product_title,
            p.image_url || null,
            p.affiliate_url || null,
            p.caption,
            p.price || null,
            p.currency || null,
            p.site_name || "Store",
            p.scheduled_time,
            p.status || "pending",
            p.created_at || new Date().toISOString(),
            p.updated_at || null,
            p.error_message || null
          );
        }
      }
    }

    if (fs.existsSync(LEGACY_HISTORY_FILE)) {
      const raw = fs.readFileSync(LEGACY_HISTORY_FILE, "utf-8");
      const legacyHistory: ParsedHistoryItem[] = JSON.parse(raw || "[]");
      if (Array.isArray(legacyHistory) && legacyHistory.length > 0) {
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO history (
            id, url, affiliate_url, title, description, image_url,
            price, currency, site_name, parsed_at, copy_generated, tone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const h of legacyHistory) {
          stmt.run(
            h.id || crypto.randomUUID(),
            h.url,
            h.affiliate_url || null,
            h.title,
            h.description || null,
            h.image_url || null,
            h.price ?? null,
            h.currency || null,
            h.site_name || "Store",
            h.parsed_at || new Date().toISOString(),
            h.copy_generated || null,
            h.tone || null
          );
        }
      }
    }
  } catch (err) {
    console.warn("Legacy JSON migration notice:", err);
  }
}

// ----------------------------------------------------
// QUEUED POSTS CRUD (SQLITE)
// ----------------------------------------------------

export async function getPosts(): Promise<QueuePost[]> {
  const db = getDb();
  const query = db.prepare(`
    SELECT * FROM posts 
    ORDER BY datetime(scheduled_time) ASC
  `);
  const rows = query.all() as unknown as QueuePost[];
  return rows;
}

export async function getPostById(id: string): Promise<QueuePost | null> {
  const db = getDb();
  const query = db.prepare("SELECT * FROM posts WHERE id = ?");
  const row = query.get(id) as unknown as QueuePost | undefined;
  return row || null;
}

export async function createPost(
  params: Omit<QueuePost, "id" | "created_at" | "status"> & { status?: QueuePostStatus }
): Promise<QueuePost> {
  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const status = params.status || "pending";

  const stmt = db.prepare(`
    INSERT INTO posts (
      id, product_title, image_url, affiliate_url, caption,
      price, currency, site_name, scheduled_time, status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    params.product_title,
    params.image_url || null,
    params.affiliate_url || null,
    params.caption,
    params.price || null,
    params.currency || null,
    params.site_name || "Store",
    params.scheduled_time,
    status,
    createdAt
  );

  return {
    id,
    product_title: params.product_title,
    image_url: params.image_url,
    affiliate_url: params.affiliate_url,
    caption: params.caption,
    price: params.price,
    currency: params.currency,
    site_name: params.site_name,
    scheduled_time: params.scheduled_time,
    status,
    created_at: createdAt,
  };
}

export async function updatePost(
  id: string,
  update: Partial<Omit<QueuePost, "id" | "created_at">>
): Promise<QueuePost | null> {
  const db = getDb();
  const existing = await getPostById(id);
  if (!existing) return null;

  const updatedAt = new Date().toISOString();
  const merged = { ...existing, ...update, updated_at: updatedAt };

  const stmt = db.prepare(`
    UPDATE posts SET
      product_title = ?,
      image_url = ?,
      affiliate_url = ?,
      caption = ?,
      price = ?,
      currency = ?,
      site_name = ?,
      scheduled_time = ?,
      status = ?,
      updated_at = ?,
      error_message = ?
    WHERE id = ?
  `);

  stmt.run(
    merged.product_title,
    merged.image_url || null,
    merged.affiliate_url || null,
    merged.caption,
    merged.price || null,
    merged.currency || null,
    merged.site_name || "Store",
    merged.scheduled_time,
    merged.status,
    updatedAt,
    merged.error_message || null,
    id
  );

  return merged;
}

export async function deletePost(id: string): Promise<boolean> {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM posts WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  published: number;
  failed: number;
}> {
  const db = getDb();
  const totalRow = db.prepare("SELECT count(*) as count FROM posts").get() as { count: number };
  const pendingRow = db.prepare("SELECT count(*) as count FROM posts WHERE status = 'pending'").get() as { count: number };
  const publishedRow = db.prepare("SELECT count(*) as count FROM posts WHERE status = 'published'").get() as { count: number };
  const failedRow = db.prepare("SELECT count(*) as count FROM posts WHERE status = 'failed'").get() as { count: number };

  return {
    total: totalRow?.count || 0,
    pending: pendingRow?.count || 0,
    published: publishedRow?.count || 0,
    failed: failedRow?.count || 0,
  };
}

export async function processDueScheduledPosts(): Promise<{
  processed: number;
  published: number;
  failed: number;
}> {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const query = db.prepare(`
    SELECT * FROM posts 
    WHERE status = 'pending' AND datetime(scheduled_time) <= datetime(?)
    ORDER BY datetime(scheduled_time) ASC
  `);

  const duePosts = query.all(nowIso) as unknown as QueuePost[];
  let publishedCount = 0;
  let failedCount = 0;

  for (const post of duePosts) {
    try {
      console.log(`[Auto-Publisher] Processing due post: ${post.id} (${post.product_title})`);
      await sendToTelegram({
        text: post.caption,
        imageUrl: post.image_url,
        parseMode: "HTML",
      });
      await updatePost(post.id, {
        status: "published",
        error_message: undefined,
      });
      publishedCount++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to auto-publish post.";
      console.error(`[Auto-Publisher] Failed to publish post ${post.id}:`, errorMsg);
      await updatePost(post.id, {
        status: "failed",
        error_message: errorMsg,
      });
      failedCount++;
    }
  }

  return {
    processed: publishedCount + failedCount,
    published: publishedCount,
    failed: failedCount,
  };
}

export async function publishPostNow(id: string): Promise<QueuePost> {
  const post = await getPostById(id);
  if (!post) {
    throw new Error(`Post with ID ${id} not found.`);
  }

  try {
    await sendToTelegram({
      text: post.caption,
      imageUrl: post.image_url,
      parseMode: "HTML",
    });

    const updated = await updatePost(id, {
      status: "published",
      error_message: undefined,
    });
    return updated!;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to publish post.";
    await updatePost(id, {
      status: "failed",
      error_message: errorMsg,
    });
    throw new Error(errorMsg);
  }
}

// ----------------------------------------------------
// PARSED PRODUCTS HISTORY (SQLITE)
// ----------------------------------------------------

export async function getHistory(): Promise<ParsedHistoryItem[]> {
  const db = getDb();
  const query = db.prepare("SELECT * FROM history ORDER BY datetime(parsed_at) DESC LIMIT 200");
  const rows = query.all() as unknown as ParsedHistoryItem[];
  return rows;
}

export async function addHistoryItem(
  item: Omit<ParsedHistoryItem, "id" | "parsed_at">
): Promise<ParsedHistoryItem> {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM history WHERE url = ?").get(item.url) as { id: string } | undefined;

  const id = existing ? existing.id : crypto.randomUUID();
  const parsedAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO history (
      id, url, affiliate_url, title, description, image_url,
      price, currency, site_name, parsed_at, copy_generated, tone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      image_url = excluded.image_url,
      price = excluded.price,
      currency = excluded.currency,
      site_name = excluded.site_name,
      parsed_at = excluded.parsed_at,
      copy_generated = coalesce(excluded.copy_generated, history.copy_generated),
      tone = coalesce(excluded.tone, history.tone)
  `);

  stmt.run(
    id,
    item.url,
    item.affiliate_url || null,
    item.title,
    item.description || null,
    item.image_url || null,
    item.price ?? null,
    item.currency || null,
    item.site_name || "Store",
    parsedAt,
    item.copy_generated || null,
    item.tone || null
  );

  return {
    id,
    url: item.url,
    affiliate_url: item.affiliate_url,
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    price: item.price,
    currency: item.currency,
    site_name: item.site_name,
    parsed_at: parsedAt,
    copy_generated: item.copy_generated,
    tone: item.tone,
  };
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM history WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function clearHistory(): Promise<void> {
  const db = getDb();
  db.exec("DELETE FROM history;");
}
