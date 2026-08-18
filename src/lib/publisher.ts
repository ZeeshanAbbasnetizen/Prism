import {
  SocialPlatform,
  PublishSocialRequest,
  PublishSocialResponse,
} from "@/types/scraper";
import { sendToTelegram } from "./telegram";
import { sendToInstagram } from "./instagram";
import { sendToFacebook } from "./facebook";
import { sendToPinterest } from "./pinterest";
import { sendToYouTube } from "./youtube";

/**
 * Clean platform label
 */
export function getPlatformDisplayName(platform: SocialPlatform): string {
  switch (platform) {
    case "telegram":
      return "Telegram";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "pinterest":
      return "Pinterest";
    case "youtube":
      return "YouTube";
    default:
      return "Telegram";
  }
}

/**
 * Unified multi-platform social publisher dispatcher
 */
export async function publishSocialPost(
  request: PublishSocialRequest
): Promise<PublishSocialResponse> {
  const platform = request.platform || "telegram";

  try {
    switch (platform) {
      case "telegram": {
        const res = await sendToTelegram({
          text: request.text,
          imageUrl: request.imageUrl,
          chatId: request.telegramChatId,
          botToken: request.telegramBotToken,
          parseMode: "HTML",
        });
        return {
          success: true,
          platform: "telegram",
          messageId: res.messageId,
          targetTitle: res.chatTitle,
        };
      }

      case "instagram": {
        const res = await sendToInstagram({
          caption: request.text,
          imageUrl: request.imageUrl,
          accessToken: request.instagramAccessToken,
          accountId: request.instagramAccountId,
        });
        return {
          success: true,
          platform: "instagram",
          messageId: res.messageId,
          targetTitle: res.targetTitle,
          postUrl: res.postUrl,
          shareIntentUrl: res.shareIntentUrl,
        };
      }

      case "facebook": {
        const res = await sendToFacebook({
          caption: request.text,
          imageUrl: request.imageUrl,
          affiliateUrl: request.affiliateUrl,
          pageAccessToken: request.facebookPageAccessToken,
          pageId: request.facebookPageId,
        });
        return {
          success: true,
          platform: "facebook",
          messageId: res.messageId,
          targetTitle: res.targetTitle,
          postUrl: res.postUrl,
          shareIntentUrl: res.shareIntentUrl,
        };
      }

      case "pinterest": {
        const res = await sendToPinterest({
          title: request.title,
          caption: request.text,
          imageUrl: request.imageUrl,
          affiliateUrl: request.affiliateUrl,
          accessToken: request.pinterestAccessToken,
          boardId: request.pinterestBoardId,
        });
        return {
          success: true,
          platform: "pinterest",
          messageId: res.messageId,
          targetTitle: res.targetTitle,
          postUrl: res.postUrl,
          shareIntentUrl: res.shareIntentUrl,
        };
      }

      case "youtube": {
        const res = await sendToYouTube({
          title: request.title,
          caption: request.text,
          imageUrl: request.imageUrl,
          affiliateUrl: request.affiliateUrl,
          apiKey: request.youtubeApiKey,
          channelId: request.youtubeChannelId,
        });
        return {
          success: true,
          platform: "youtube",
          messageId: res.messageId,
          targetTitle: res.targetTitle,
          postUrl: res.postUrl,
          shareIntentUrl: res.shareIntentUrl,
        };
      }

      default: {
        throw new Error(`Unsupported social platform: ${platform}`);
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : `Failed to publish to ${getPlatformDisplayName(platform)}.`;
    return {
      success: false,
      platform,
      error: message,
    };
  }
}
