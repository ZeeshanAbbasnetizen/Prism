import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { QueuePost, QueuePostStatus, ParsedHistoryItem } from "@/types/scraper";
import { sendToTelegram } from "./telegram";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "posts.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

/**
 * Ensure database files and directory exist
 */
async function ensureDb(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    try {
      await fs.access(HISTORY_FILE);
    } catch {
      await fs.writeFile(HISTORY_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to ensure DB directory:", err);
  }
}

/**
 * Read all posts from local JSON database
 */
export async function getPosts(): Promise<QueuePost[]> {
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    const parsed: QueuePost[] = JSON.parse(raw || "[]");
    return parsed.sort(
      (a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
    );
  } catch (err) {
    console.error("Error reading posts DB:", err);
    return [];
  }
}

/**
 * Save posts array to local JSON database
 */
async function savePosts(posts: QueuePost[]): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

/**
 * Get post by ID
 */
export async function getPostById(id: string): Promise<QueuePost | null> {
  const posts = await getPosts();
  return posts.find((p) => p.id === id) || null;
}

/**
 * Create a new scheduled post
 */
export async function createPost(
  params: Omit<QueuePost, "id" | "created_at" | "status"> & { status?: QueuePostStatus }
): Promise<QueuePost> {
  const posts = await getPosts();
  const newPost: QueuePost = {
    id: crypto.randomUUID(),
    product_title: params.product_title,
    image_url: params.image_url,
    affiliate_url: params.affiliate_url,
    caption: params.caption,
    price: params.price ?? null,
    currency: params.currency ?? null,
    site_name: params.site_name || "Store",
    scheduled_time: params.scheduled_time,
    status: params.status || "pending",
    created_at: new Date().toISOString(),
  };

  posts.push(newPost);
  await savePosts(posts);
  return newPost;
}

/**
 * Update an existing post
 */
export async function updatePost(
  id: string,
  update: Partial<Omit<QueuePost, "id" | "created_at">>
): Promise<QueuePost | null> {
  const posts = await getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  posts[idx] = {
    ...posts[idx],
    ...update,
    updated_at: new Date().toISOString(),
  };

  await savePosts(posts);
  return posts[idx];
}

/**
 * Delete a post by ID
 */
export async function deletePost(id: string): Promise<boolean> {
  const posts = await getPosts();
  const initialLen = posts.length;
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === initialLen) return false;

  await savePosts(filtered);
  return true;
}

/**
 * Get stats summary
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  published: number;
  failed: number;
}> {
  const posts = await getPosts();
  return {
    total: posts.length,
    pending: posts.filter((p) => p.status === "pending").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };
}

/**
 * Automatically process and publish all due pending posts
 */
export async function processDueScheduledPosts(): Promise<{
  processed: number;
  published: number;
  failed: number;
}> {
  const posts = await getPosts();
  const now = Date.now();
  let publishedCount = 0;
  let failedCount = 0;

  for (const post of posts) {
    if (post.status === "pending") {
      const scheduledTimeMs = new Date(post.scheduled_time).getTime();
      if (scheduledTimeMs <= now) {
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
    }
  }

  return {
    processed: publishedCount + failedCount,
    published: publishedCount,
    failed: failedCount,
  };
}

/**
 * Publish a specific queued post immediately
 */
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
// PARSED PRODUCTS HISTORY MANAGEMENT
// ----------------------------------------------------

/**
 * Read all parsed product history items
 */
export async function getHistory(): Promise<ParsedHistoryItem[]> {
  await ensureDb();
  try {
    const raw = await fs.readFile(HISTORY_FILE, "utf-8");
    const parsed: ParsedHistoryItem[] = JSON.parse(raw || "[]");
    return parsed.sort(
      (a, b) => new Date(b.parsed_at).getTime() - new Date(a.parsed_at).getTime()
    );
  } catch (err) {
    console.error("Error reading history DB:", err);
    return [];
  }
}

/**
 * Save history array to local JSON database
 */
async function saveHistory(history: ParsedHistoryItem[]): Promise<void> {
  await ensureDb();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

/**
 * Add or update parsed item in history
 */
export async function addHistoryItem(
  item: Omit<ParsedHistoryItem, "id" | "parsed_at">
): Promise<ParsedHistoryItem> {
  const history = await getHistory();
  const existingIdx = history.findIndex((h) => h.url === item.url);

  const newItem: ParsedHistoryItem = {
    id: existingIdx >= 0 ? history[existingIdx].id : crypto.randomUUID(),
    url: item.url,
    affiliate_url: item.affiliate_url,
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    price: item.price ?? null,
    currency: item.currency ?? null,
    site_name: item.site_name || "Store",
    parsed_at: new Date().toISOString(),
    copy_generated: item.copy_generated,
    tone: item.tone,
  };

  if (existingIdx >= 0) {
    history[existingIdx] = newItem;
  } else {
    history.unshift(newItem);
  }

  // Keep up to 200 recent parsed items
  const trimmed = history.slice(0, 200);
  await saveHistory(trimmed);
  return newItem;
}

/**
 * Delete a history item
 */
export async function deleteHistoryItem(id: string): Promise<boolean> {
  const history = await getHistory();
  const filtered = history.filter((h) => h.id !== id);
  if (filtered.length === history.length) return false;

  await saveHistory(filtered);
  return true;
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await ensureDb();
  await saveHistory([]);
}
