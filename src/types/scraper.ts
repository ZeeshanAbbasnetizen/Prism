export type CopyTone = "urgent" | "features" | "minimal" | "story";

export type SocialPlatform = "telegram" | "instagram" | "facebook" | "pinterest" | "youtube";

export type QueuePostStatus = "pending" | "published" | "failed";

export interface QueuePost {
  id: string;
  product_title: string;
  image_url: string;
  affiliate_url: string;
  caption: string;
  price?: string | null;
  currency?: string | null;
  site_name?: string;
  platform?: SocialPlatform;
  target_channel?: string | null;
  scheduled_time: string; // ISO datetime string
  status: QueuePostStatus;
  created_at: string; // ISO datetime string
  updated_at?: string; // ISO datetime string
  error_message?: string;
}

export interface QueueApiResponse {
  success: boolean;
  data?: QueuePost[] | QueuePost;
  stats?: {
    total: number;
    pending: number;
    published: number;
    failed: number;
  };
  error?: string;
}

export interface ScrapedProduct {
  url: string;
  canonicalUrl?: string;
  title: string;
  description: string;
  image: string;
  images: string[];
  price: string | null;
  currency: string | null;
  siteName: string;
  favicon?: string;
  scrapedAt: string;
  isFallback?: boolean;
}

export interface ParsedHistoryItem {
  id: string;
  url: string;
  affiliate_url?: string;
  title: string;
  description?: string;
  image_url?: string;
  price?: string | null;
  currency?: string | null;
  site_name: string;
  parsed_at: string; // ISO string
  copy_generated?: string;
  tone?: CopyTone;
  platform?: SocialPlatform;
}

export interface HistoryApiResponse {
  success: boolean;
  data?: ParsedHistoryItem[];
  stats?: {
    total: number;
    uniqueStores: number;
  };
  error?: string;
}

export interface ScrapeRequest {
  url: string;
}

export interface ScrapeApiResponse {
  success: boolean;
  data?: ScrapedProduct;
  error?: string;
  warning?: string;
}

export interface GenerateCopyRequest {
  title: string;
  price?: string | null;
  currency?: string | null;
  description?: string;
  url: string;
  siteName?: string;
  affiliateTag?: string;
  tone?: CopyTone;
  platform?: SocialPlatform;
  customApiKey?: string;
}

export interface GenerateCopyResponse {
  success: boolean;
  copy?: string;
  platform?: SocialPlatform;
  error?: string;
}

export interface PublishTelegramRequest {
  text: string;
  imageUrl?: string;
  chatId?: string;
  botToken?: string;
  parseMode?: "HTML" | "Markdown";
}

export interface PublishTelegramResponse {
  success: boolean;
  messageId?: number;
  chatTitle?: string;
  error?: string;
}

export interface PublishSocialRequest {
  platform: SocialPlatform;
  text: string;
  imageUrl?: string;
  affiliateUrl?: string;
  title?: string;
  siteName?: string;
  price?: string | null;
  currency?: string | null;
  // Platform specific overrides
  telegramChatId?: string;
  telegramBotToken?: string;
  instagramAccessToken?: string;
  instagramAccountId?: string;
  facebookPageAccessToken?: string;
  facebookPageId?: string;
  pinterestAccessToken?: string;
  pinterestBoardId?: string;
  youtubeApiKey?: string;
  youtubeChannelId?: string;
}

export interface PublishSocialResponse {
  success: boolean;
  platform: SocialPlatform;
  messageId?: string | number;
  targetTitle?: string;
  postUrl?: string;
  shareIntentUrl?: string;
  error?: string;
}

export interface AppSettings {
  geminiApiKey: string;
  defaultAffiliateTag: string;
  defaultPlatform: SocialPlatform;

  // Telegram
  telegramBotToken: string;
  telegramChatId: string;

  // Instagram
  instagramAccessToken: string;
  instagramAccountId: string;

  // Facebook
  facebookPageAccessToken: string;
  facebookPageId: string;

  // Pinterest
  pinterestAccessToken: string;
  pinterestBoardId: string;

  // YouTube
  youtubeApiKey: string;
  youtubeChannelId: string;
}
