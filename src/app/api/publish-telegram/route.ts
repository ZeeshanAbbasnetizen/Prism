import { NextRequest, NextResponse } from "next/server";
import { sendToTelegram } from "@/lib/telegram";
import { PublishTelegramRequest, PublishTelegramResponse } from "@/types/scraper";

export async function POST(request: NextRequest): Promise<NextResponse<PublishTelegramResponse>> {
  try {
    const body: PublishTelegramRequest = await request.json().catch(() => null);

    if (!body || !body.text || typeof body.text !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing message text to publish.",
        },
        { status: 400 }
      );
    }

    const result = await sendToTelegram(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish to Telegram.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
