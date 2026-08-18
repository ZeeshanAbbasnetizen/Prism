import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

import { getPosts, updatePost } from "../src/lib/db";
import { publishSocialPost } from "../src/lib/publisher";
import { formatInKarachi } from "../src/lib/dateUtils";
import { SocialPlatform } from "../src/types/scraper";

interface WorkerRunResult {
  totalChecked: number;
  dueCount: number;
  published: number;
  failed: number;
}

/**
 * Execute a single pass to check and publish due scheduled posts
 */
export async function runSchedulerWorker(): Promise<WorkerRunResult> {
  const startTime = new Date();
  console.log(`\n======================================================`);
  console.log(`[Worker] Running multi-platform deal dispatcher...`);
  console.log(`[Worker] Current Time: ${formatInKarachi(startTime.toISOString())}`);
  console.log(`======================================================`);

  const posts = await getPosts();
  const now = Date.now();

  const pendingPosts = posts.filter((p) => p.status === "pending");
  const duePosts = pendingPosts.filter(
    (p) => new Date(p.scheduled_time).getTime() <= now
  );

  console.log(`[Worker] Total Posts: ${posts.length} | Pending: ${pendingPosts.length} | Due Now: ${duePosts.length}`);

  let published = 0;
  let failed = 0;

  if (duePosts.length === 0) {
    console.log(`[Worker] No scheduled posts due for release right now.`);
    return {
      totalChecked: posts.length,
      dueCount: 0,
      published: 0,
      failed: 0,
    };
  }

  for (const post of duePosts) {
    const platform = (post.platform || "telegram") as SocialPlatform;
    console.log(`\n------------------------------------------------------`);
    console.log(`[Worker] Publishing Post ID: ${post.id}`);
    console.log(`[Worker] Platform: ${platform.toUpperCase()}`);
    console.log(`[Worker] Product: "${post.product_title}"`);
    console.log(`[Worker] Scheduled For: ${formatInKarachi(post.scheduled_time)}`);
    console.log(`[Worker] Store: ${post.site_name || "Store"}`);

    try {
      const result = await publishSocialPost({
        platform,
        text: post.caption,
        imageUrl: post.image_url,
        affiliateUrl: post.affiliate_url,
        title: post.product_title,
        siteName: post.site_name,
        price: post.price,
        currency: post.currency,
      });

      if (!result.success) {
        throw new Error(result.error || `Failed to deliver post to ${platform}.`);
      }

      await updatePost(post.id, {
        status: "published",
        error_message: undefined,
      });

      published++;
      console.log(`[Worker] ✓ SUCCESS: Post delivered to ${platform}! (Message ID: ${result.messageId})`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : `Failed to publish post to ${platform}.`;
      console.error(`[Worker] ✗ FAILED: ${errorMsg}`);

      await updatePost(post.id, {
        status: "failed",
        error_message: errorMsg,
      });

      failed++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`[Worker] Batch completed: ${published} published, ${failed} failed.`);
  console.log(`======================================================\n`);

  return {
    totalChecked: posts.length,
    dueCount: duePosts.length,
    published,
    failed,
  };
}

// Check command line arguments for continuous mode
const isContinuous = process.argv.includes("--continuous") || process.argv.includes("--watch");
const intervalSeconds = 30;

if (isContinuous) {
  console.log(`[Worker] Starting continuous background worker (Interval: ${intervalSeconds}s)...`);
  runSchedulerWorker();
  setInterval(() => {
    runSchedulerWorker();
  }, intervalSeconds * 1000);
} else {
  // Single pass run
  runSchedulerWorker()
    .then((res) => {
      process.exit(res.failed > 0 && res.published === 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("[Worker] Fatal error running scheduler worker:", err);
      process.exit(1);
    });
}
