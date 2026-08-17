import { NextRequest, NextResponse } from "next/server";
import { processDueScheduledPosts, getQueueStats } from "@/lib/db";
import { formatInKarachi, TIMEZONE_LABEL } from "@/lib/dateUtils";

/**
 * Validate incoming CRON authorization header or secret param
 */
function isAuthorized(request: NextRequest): boolean {
  const serverCronSecret = process.env.CRON_SECRET;

  // If no secret configured in production environment, reject for safety
  if (!serverCronSecret) {
    // If running in development without CRON_SECRET, allow default
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    return false;
  }

  // 1. Check Bearer token in Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === serverCronSecret) return true;
  }

  // 2. Check x-cron-secret header
  const customHeader = request.headers.get("x-cron-secret");
  if (customHeader && customHeader === serverCronSecret) {
    return true;
  }

  // 3. Check secret query parameter (?secret=...)
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  if (querySecret && querySecret === serverCronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleCronTrigger(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCronTrigger(request);
}

async function handleCronTrigger(request: NextRequest): Promise<NextResponse> {
  const nowIso = new Date().toISOString();

  // Validate authentication
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized. Invalid or missing CRON_SECRET token.",
        hint: "Provide 'Authorization: Bearer <CRON_SECRET>' header or '?secret=<CRON_SECRET>' query parameter.",
      },
      { status: 401 }
    );
  }

  try {
    console.log(`[Cron Trigger] Webhook triggered at ${formatInKarachi(nowIso)}`);

    const result = await processDueScheduledPosts();
    const stats = await getQueueStats();

    return NextResponse.json(
      {
        success: true,
        message: "Cron scheduled deal dispatch completed successfully.",
        timestamp: nowIso,
        formattedTime: formatInKarachi(nowIso),
        timezone: TIMEZONE_LABEL,
        summary: result,
        stats,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron trigger execution failed.";
    console.error("[Cron Trigger] Error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: nowIso,
      },
      { status: 500 }
    );
  }
}
