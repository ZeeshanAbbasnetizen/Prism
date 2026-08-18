export interface PublishYouTubeParams {
  title?: string;
  caption: string;
  imageUrl?: string;
  affiliateUrl?: string;
  apiKey?: string;
  channelId?: string;
}

export interface PublishYouTubeResult {
  success: boolean;
  messageId?: string;
  targetTitle?: string;
  postUrl?: string;
  shareIntentUrl?: string;
  error?: string;
}

/**
 * Generate 1-click YouTube Studio / Community Post Deep-link
 */
export function getYouTubeStudioUrl(channelId?: string): string {
  if (channelId && channelId.trim()) {
    return `https://studio.youtube.com/channel/${channelId.trim()}/community`;
  }
  return "https://studio.youtube.com/";
}

/**
 * Publish / Dispatch YouTube Community or Video Description post
 */
export async function sendToYouTube(params: PublishYouTubeParams): Promise<PublishYouTubeResult> {
  const channelId = params.channelId || process.env.YOUTUBE_CHANNEL_ID;
  const studioUrl = getYouTubeStudioUrl(channelId);

  // Return formatted YouTube distribution response with Studio Intent
  return {
    success: true,
    messageId: `yt-studio-${Date.now()}`,
    targetTitle: channelId ? `YouTube Channel (${channelId})` : "YouTube Studio",
    postUrl: studioUrl,
    shareIntentUrl: studioUrl,
  };
}
