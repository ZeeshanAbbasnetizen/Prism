export interface PublishFacebookParams {
  caption: string;
  imageUrl?: string;
  affiliateUrl?: string;
  pageAccessToken?: string;
  pageId?: string;
}

export interface PublishFacebookResult {
  success: boolean;
  messageId?: string;
  targetTitle?: string;
  postUrl?: string;
  shareIntentUrl?: string;
  error?: string;
}

/**
 * Generate 1-click Facebook Share Dialog Intent URL
 */
export function getFacebookShareUrl(affiliateUrl?: string, caption?: string): string {
  const target = affiliateUrl || "https://www.facebook.com";
  const params = new URLSearchParams({
    u: target,
  });
  if (caption) {
    params.set("quote", caption.substring(0, 500));
  }
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Publish post or photo to Facebook Page via Meta Graph API
 */
export async function sendToFacebook(params: PublishFacebookParams): Promise<PublishFacebookResult> {
  const pageAccessToken = params.pageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = params.pageId || process.env.FACEBOOK_PAGE_ID;

  // Fallback: If API credentials are not configured, provide 1-click Facebook Share Dialog Intent
  if (!pageAccessToken || !pageId || pageAccessToken.trim() === "" || pageId.trim() === "") {
    const shareUrl = getFacebookShareUrl(params.affiliateUrl, params.caption);
    return {
      success: true,
      messageId: `fb-intent-${Date.now()}`,
      targetTitle: "Facebook Share Dialog",
      postUrl: shareUrl,
      shareIntentUrl: shareUrl,
    };
  }

  const cleanPageId = pageId.trim();
  const cleanToken = pageAccessToken.trim();
  const cleanCaption = params.caption.trim();

  try {
    if (params.imageUrl && params.imageUrl.startsWith("http")) {
      // Photo Post
      const res = await fetch(`https://graph.facebook.com/v19.0/${cleanPageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: params.imageUrl,
          message: cleanCaption,
          access_token: cleanToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.id) {
        const errorMsg = data.error?.message || "Failed to publish photo to Facebook Page.";
        throw new Error(errorMsg);
      }

      return {
        success: true,
        messageId: data.id || data.post_id,
        targetTitle: `Facebook Page (${cleanPageId})`,
        postUrl: `https://www.facebook.com/${data.post_id || data.id}`,
      };
    } else {
      // Feed Link / Text Post
      const res = await fetch(`https://graph.facebook.com/v19.0/${cleanPageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanCaption,
          link: params.affiliateUrl || undefined,
          access_token: cleanToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.id) {
        const errorMsg = data.error?.message || "Failed to publish feed post to Facebook Page.";
        throw new Error(errorMsg);
      }

      return {
        success: true,
        messageId: data.id,
        targetTitle: `Facebook Page (${cleanPageId})`,
        postUrl: `https://www.facebook.com/${data.id}`,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Facebook publication error.";
    throw new Error(message);
  }
}
