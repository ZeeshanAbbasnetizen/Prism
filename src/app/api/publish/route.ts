import { NextRequest, NextResponse } from "next/server";
import { publishSocialPost } from "@/lib/publisher";
import { PublishSocialRequest, PublishSocialResponse } from "@/types/scraper";

export async function POST(request: NextRequest): Promise<NextResponse<PublishSocialResponse>> {
  try {
    const body: PublishSocialRequest = await request.json().catch(() => null);

    if (!body || !body.text || typeof body.text !== "string") {
      return NextResponse.json(
        {
          success: false,
          platform: body?.platform || "telegram",
          error: "Missing message text or caption to publish.",
        },
        { status: 400 }
      );
    }

    const result = await publishSocialPost(body);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process social publication.";
    return NextResponse.json(
      {
        success: false,
        platform: "telegram",
        error: message,
      },
      { status: 500 }
    );
  }
}
