import { NextRequest, NextResponse } from "next/server";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getQueueStats,
  publishPostNow,
  processDueScheduledPosts,
} from "@/lib/db";
import { QueueApiResponse } from "@/types/scraper";

export async function GET(request: NextRequest): Promise<NextResponse<QueueApiResponse>> {
  try {
    // Automatically process any due posts whenever queue is accessed
    await processDueScheduledPosts().catch((err) =>
      console.warn("Auto-process error in GET /api/queue:", err)
    );

    const posts = await getPosts();
    const stats = await getQueueStats();

    return NextResponse.json(
      {
        success: true,
        data: posts,
        stats,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch queue.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<QueueApiResponse>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.product_title || !body.caption || !body.scheduled_time) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: product_title, caption, or scheduled_time.",
        },
        { status: 400 }
      );
    }

    const newPost = await createPost({
      product_title: body.product_title,
      image_url: body.image_url || "",
      affiliate_url: body.affiliate_url || "",
      caption: body.caption,
      price: body.price || null,
      currency: body.currency || null,
      site_name: body.site_name || "Store",
      scheduled_time: body.scheduled_time,
    });

    // Check if the scheduled time is already due
    await processDueScheduledPosts().catch((err) =>
      console.warn("Auto-process error in POST /api/queue:", err)
    );

    const stats = await getQueueStats();

    return NextResponse.json(
      {
        success: true,
        data: newPost,
        stats,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add post to queue.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<QueueApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => null);
      if (body && body.id) {
        id = body.id;
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing required 'id' parameter." },
        { status: 400 }
      );
    }

    const deleted = await deletePost(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Post with ID ${id} not found.` },
        { status: 404 }
      );
    }

    const stats = await getQueueStats();
    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete post.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<QueueApiResponse>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ success: false, error: "Missing request body." }, { status: 400 });
    }

    // Action: Process all due posts
    if (body.action === "process_due") {
      const result = await processDueScheduledPosts();
      const posts = await getPosts();
      const stats = await getQueueStats();
      return NextResponse.json({ success: true, data: posts, stats }, { status: 200 });
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Missing required 'id' field." },
        { status: 400 }
      );
    }

    // Action: Publish Now
    if (body.action === "publish_now") {
      const publishedPost = await publishPostNow(body.id);
      const stats = await getQueueStats();
      return NextResponse.json({ success: true, data: publishedPost, stats }, { status: 200 });
    }

    // Standard update
    const updated = await updatePost(body.id, {
      caption: body.caption,
      scheduled_time: body.scheduled_time,
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Post with ID ${body.id} not found.` },
        { status: 404 }
      );
    }

    // Check if updated post is due
    await processDueScheduledPosts().catch((err) =>
      console.warn("Auto-process error after PATCH /api/queue:", err)
    );

    const stats = await getQueueStats();
    return NextResponse.json({ success: true, data: updated, stats }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update post.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
