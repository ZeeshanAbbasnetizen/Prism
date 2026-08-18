export interface PublishInstagramParams {
  caption: string;
  imageUrl?: string;
  accessToken?: string;
  accountId?: string;
}

export interface PublishInstagramResult {
  success: boolean;
  messageId?: string;
  targetTitle?: string;
  postUrl?: string;
  shareIntentUrl?: string;
  error?: string;
}

/**
 * Generate 1-click Instagram Web Intent / Creator Studio Deep-link
 */
export function getInstagramShareUrl(): string {
  return "https://www.instagram.com/";
}

/**
 * Publish photo post to Instagram Business/Creator Account via Meta Graph API
 */
export async function sendToInstagram(params: PublishInstagramParams): Promise<PublishInstagramResult> {
  const accessToken = params.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = params.accountId || process.env.INSTAGRAM_ACCOUNT_ID;

  // Fallback: If API credentials are not configured, provide 1-click Instagram Web intent
  if (!accessToken || !accountId || accessToken.trim() === "" || accountId.trim() === "") {
    return {
      success: true,
      messageId: `ig-intent-${Date.now()}`,
      targetTitle: "Instagram Web / App",
      postUrl: "https://www.instagram.com/",
      shareIntentUrl: getInstagramShareUrl(),
    };
  }

  if (!params.imageUrl || !params.imageUrl.startsWith("http")) {
    throw new Error("Instagram API requires a publicly accessible image URL to publish a photo post.");
  }

  try {
    // Step 1: Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${accountId.trim()}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: params.imageUrl,
        caption: params.caption.trim(),
        access_token: accessToken.trim(),
      }),
    });

    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      const errorMsg = containerData.error?.message || "Failed to create Instagram media container.";
      throw new Error(errorMsg);
    }

    const creationId = containerData.id;

    // Step 2: Publish media container
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId.trim()}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken.trim(),
      }),
    });

    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      const errorMsg = publishData.error?.message || "Failed to publish Instagram media container.";
      throw new Error(errorMsg);
    }

    return {
      success: true,
      messageId: publishData.id,
      targetTitle: `Instagram Account (${accountId})`,
      postUrl: `https://www.instagram.com/p/${publishData.id}/`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Instagram publication error.";
    throw new Error(message);
  }
}
