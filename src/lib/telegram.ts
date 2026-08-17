import { PublishTelegramRequest, PublishTelegramResponse } from "@/types/scraper";

/**
 * Send deal photo and formatted caption to Telegram Channel/Group/Chat
 */
export async function sendToTelegram(params: PublishTelegramRequest): Promise<PublishTelegramResponse> {
  const botToken = params.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = params.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || botToken.trim() === "" || botToken === "your_telegram_bot_token_here") {
    throw new Error(
      "Telegram Bot Token is not configured. Please set TELEGRAM_BOT_TOKEN in .env.local or via Settings."
    );
  }

  if (!targetChatId || targetChatId.trim() === "") {
    throw new Error(
      "Telegram Chat ID is missing. Please provide a Channel Username (e.g. @mychannel) or numeric Chat ID."
    );
  }

  const cleanChatId = targetChatId.trim();
  const caption = params.text.trim();
  const parseMode = params.parseMode || "HTML";

  // If image URL is provided, attempt sendPhoto first
  if (params.imageUrl && params.imageUrl.startsWith("http")) {
    try {
      // Telegram sendPhoto captions have a 1024 character limit
      const safeCaption = caption.length > 1020 ? caption.substring(0, 1017) + "..." : caption;

      const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cleanChatId,
          photo: params.imageUrl,
          caption: safeCaption,
          parse_mode: parseMode,
        }),
      });

      const photoData = await photoRes.json();

      if (photoData.ok && photoData.result) {
        return {
          success: true,
          messageId: photoData.result.message_id,
          chatTitle: photoData.result.chat?.title || photoData.result.chat?.username || cleanChatId,
        };
      }

      console.warn("sendPhoto returned error, attempting sendMessage fallback:", photoData.description);
    } catch (e) {
      console.warn("sendPhoto request failed, attempting sendMessage fallback:", e);
    }
  }

  // Fallback / Text message delivery via sendMessage
  const messageRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: cleanChatId,
      text: caption,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    }),
  });

  const messageData = await messageRes.json();

  if (!messageData.ok) {
    const errorMsg = messageData.description || "Failed to post message to Telegram.";
    throw new Error(errorMsg);
  }

  return {
    success: true,
    messageId: messageData.result.message_id,
    chatTitle: messageData.result.chat?.title || messageData.result.chat?.username || cleanChatId,
  };
}
