import { NextRequest, NextResponse } from "next/server";
import { generateAffiliateCopy } from "@/lib/gemini";
import { GenerateCopyRequest, GenerateCopyResponse } from "@/types/scraper";

export async function POST(request: NextRequest): Promise<NextResponse<GenerateCopyResponse>> {
  try {
    const body: GenerateCopyRequest = await request.json().catch(() => null);

    if (!body || !body.title || !body.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required product title or URL.",
        },
        { status: 400 }
      );
    }

    const copy = await generateAffiliateCopy(body);

    return NextResponse.json(
      {
        success: true,
        copy,
        platform: body.platform || "telegram",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate copy.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
