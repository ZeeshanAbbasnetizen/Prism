export interface PublishPinterestParams {
  title?: string;
  caption: string;
  imageUrl?: string;
  affiliateUrl?: string;
  accessToken?: string;
  boardId?: string;
}

export interface PublishPinterestResult {
  success: boolean;
  messageId?: string;
  targetTitle?: string;
  postUrl?: string;
  shareIntentUrl?: string;
  error?: string;
}

/**
 * Generate 1-click Pinterest Pin Creator Intent URL
 */
export function getPinterestShareUrl(affiliateUrl?: string, imageUrl?: string, description?: string): string {
  const targetUrl = affiliateUrl || "https://www.pinterest.com";
  const params = new URLSearchParams({
    url: targetUrl,
  });
  if (imageUrl) {
    params.set("media", imageUrl);
  }
  if (description) {
    params.set("description", description.substring(0, 500));
  }
  return `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
}

/**
 * Publish Pin to Pinterest via Pinterest API v5
 */
export async function sendToPinterest(params: PublishPinterestParams): Promise<PublishPinterestResult> {
  const accessToken = params.accessToken || process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = params.boardId || process.env.PINTEREST_BOARD_ID;

  // Fallback: If API credentials are not configured, provide 1-click Pinterest Pin Builder Intent
  if (!accessToken || !boardId || accessToken.trim() === "" || boardId.trim() === "") {
    const shareUrl = getPinterestShareUrl(params.affiliateUrl, params.imageUrl, params.caption);
    return {
      success: true,
      messageId: `pin-intent-${Date.now()}`,
      targetTitle: "Pinterest Pin Builder",
      postUrl: shareUrl,
      shareIntentUrl: shareUrl,
    };
  }

  if (!params.imageUrl || !params.imageUrl.startsWith("http")) {
    throw new Error("Pinterest requires a publicly accessible image URL to create a Pin.");
  }

  const cleanBoardId = boardId.trim();
  const cleanToken = accessToken.trim();
  const cleanTitle = (params.title || "Special Deal").substring(0, 100);
  const cleanDesc = params.caption.trim().substring(0, 800);

  try {
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: cleanBoardId,
        title: cleanTitle,
        description: cleanDesc,
        link: params.affiliateUrl || undefined,
        media_source: {
          source_type: "image_url",
          url: params.imageUrl,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.id) {
      const errorMsg = data.message || "Failed to create Pin via Pinterest API.";
      throw new Error(errorMsg);
    }

    return {
      success: true,
      messageId: data.id,
      targetTitle: `Pinterest Board (${cleanBoardId})`,
      postUrl: `https://www.pinterest.com/pin/${data.id}/`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Pinterest Pin creation error.";
    throw new Error(message);
  }
}
