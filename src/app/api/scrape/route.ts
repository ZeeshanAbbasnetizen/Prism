import { NextRequest, NextResponse } from "next/server";
import { scrapeProductUrl } from "@/lib/scraper";
import { addHistoryItem } from "@/lib/db";
import { ScrapeApiResponse } from "@/types/scraper";

export async function POST(request: NextRequest): Promise<NextResponse<ScrapeApiResponse>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.url || typeof body.url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid 'url' parameter in request body.",
        },
        { status: 400 }
      );
    }

    const targetUrl = body.url.trim();

    // Basic URL format validation
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid URL protocol. Only HTTP and HTTPS URLs are supported.",
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format. Please provide a full URL including https://",
        },
        { status: 400 }
      );
    }

    // Perform metadata extraction
    const productData = await scrapeProductUrl(targetUrl);

    // Save to history log
    try {
      await addHistoryItem({
        url: productData.url,
        title: productData.title,
        description: productData.description,
        image_url: productData.image,
        price: productData.price || null,
        currency: productData.currency || null,
        site_name: productData.siteName,
      });
    } catch (e) {
      console.warn("Failed to record history log:", e);
    }

    return NextResponse.json(
      {
        success: true,
        data: productData,
        warning: productData.isFallback
          ? "The target website could not be scraped directly. Clean fallback metadata was generated."
          : undefined,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to scrape product URL.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
