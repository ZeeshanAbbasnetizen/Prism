import { NextRequest, NextResponse } from "next/server";
import { getHistory, addHistoryItem, deleteHistoryItem, clearHistory } from "@/lib/db";
import { HistoryApiResponse } from "@/types/scraper";

export async function GET(): Promise<NextResponse<HistoryApiResponse>> {
  try {
    const items = await getHistory();
    const uniqueStores = new Set(items.map((i) => i.site_name)).size;

    return NextResponse.json(
      {
        success: true,
        data: items,
        stats: {
          total: items.length,
          uniqueStores,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch parsed history.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<HistoryApiResponse>> {
  try {
    const body = await request.json();

    if (!body.url || !body.title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (url, title)." },
        { status: 400 }
      );
    }

    const saved = await addHistoryItem({
      url: body.url,
      affiliate_url: body.affiliate_url,
      title: body.title,
      description: body.description,
      image_url: body.image_url,
      price: body.price,
      currency: body.currency,
      site_name: body.site_name,
      copy_generated: body.copy_generated,
      tone: body.tone,
    });

    return NextResponse.json({ success: true, data: [saved] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save to history.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<HistoryApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (action === "clear") {
      await clearHistory();
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing history ID to delete." },
        { status: 400 }
      );
    }

    const deleted = await deleteHistoryItem(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "History item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete history item.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
