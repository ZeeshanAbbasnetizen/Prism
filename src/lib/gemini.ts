import { GoogleGenAI } from "@google/genai";
import { GenerateCopyRequest, CopyTone, SocialPlatform } from "@/types/scraper";

/**
 * Append affiliate tag/parameter to destination URL cleanly
 */
export function appendAffiliateTag(originalUrl: string, affiliateTag?: string): string {
  if (!affiliateTag || !affiliateTag.trim()) return originalUrl;

  const tag = affiliateTag.trim();
  try {
    const urlObj = new URL(originalUrl);

    // If tag is like "tag=mydeals-20" or "ref=aff123"
    if (tag.includes("=")) {
      const [key, val] = tag.split("=");
      if (key && val) {
        urlObj.searchParams.set(key, val);
        return urlObj.href;
      }
    }

    // Default to 'tag' parameter (common for Amazon/general stores)
    urlObj.searchParams.set("tag", tag);
    return urlObj.href;
  } catch {
    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}${tag}`;
  }
}

/**
 * Clean algorithmic template fallback if Gemini API is unreachable or key is unset
 */
export function generateTemplateCopy(data: GenerateCopyRequest, finalUrl: string): string {
  const platform = data.platform || "telegram";
  const tone = data.tone || "urgent";
  const priceDisplay = data.price
    ? `${data.currency === "USD" || data.currency === "$" ? "$" : data.currency ? `${data.currency} ` : "$"}${data.price}`
    : "Special Deal Available";

  const store = data.siteName || "Store";
  const storeTag = store.replace(/\s+/g, "");
  const shortTitle = data.title.length > 65 ? data.title.substring(0, 62) + "..." : data.title;
  const descBullet = data.description
    ? data.description.length > 90
      ? data.description.substring(0, 87) + "..."
      : data.description
    : "Top rated customer choice with fast delivery.";

  // Platform: INSTAGRAM
  if (platform === "instagram") {
    if (tone === "minimal") {
      return `✨ ${shortTitle}
💰 Price: ${priceDisplay} on ${store}

🔗 Link in Bio & Stories to shop!
.
.
#Deals #${storeTag} #Sale #Shopping #Affiliate #ad #MustHave #DealAlert #ShoppingOnline #BestPrice #Trending`;
    }
    if (tone === "features") {
      return `💡 SMART VALUE PICK: ${shortTitle}

✨ KEY HIGHLIGHT: ${descBullet}
🛡 Premium build quality & verified customer satisfaction.

💰 Current Deal: ${priceDisplay} (${store})

👉 Tap the link in our bio/story to grab this deal!
.
.
#ProductReview #SmartBuy #${storeTag} #TechDeals #HomeFinds #ShoppingTips #Affiliate #ad #Discounts #DealsOfTheDay`;
    }
    if (tone === "story") {
      return `⭐️ COMMUNITY FAVORITE: ${shortTitle}

"If you've been waiting for a discount on this, now is the time to grab it."

✔️ Verified availability on ${store}
✔️ ${descBullet}

💰 Deal Price: ${priceDisplay}

👉 Link in bio to shop now!
.
.
#CustomerFavorite #MustHave #${storeTag} #ShoppingFinds #DealHunter #Affiliate #ad #BestDeals #OnlineShopping`;
    }
    // Default: Urgent
    return `🔥 MEGA DEAL ALERT: ${shortTitle}

⚡️ Why You Need It: ${descBullet}
📦 Limited quantity available at this price on ${store}!

💰 Price Drop: ${priceDisplay}

👉 Tap the Link in Bio & Stories to grab yours before it sells out!
.
.
#DealAlert #${storeTag} #PriceDrop #FlashSale #AmazonFinds #ViralDeals #ShoppingOnline #Deals #Affiliate #ad #MustHave`;
  }

  // Platform: FACEBOOK
  if (platform === "facebook") {
    if (tone === "minimal") {
      return `⚡️ ${shortTitle}
💰 Price: ${priceDisplay} on ${store}

👉 Grab it here: ${finalUrl}

#Deals #${storeTag} #ad`;
    }
    if (tone === "features") {
      return `💡 SMART BUY: ${shortTitle}

Looking for reliability and top performance?
• Standout Feature: ${descBullet}
• Current Deal Price: ${priceDisplay} on ${store}

👉 View full specs & order here: ${finalUrl}

#BestBuy #${storeTag} #ProductReview #ad`;
    }
    // Default: Urgent
    return `🚨 HUGE DEAL: ${shortTitle}

Don't miss this price drop on ${store}!
• Highlight: ${descBullet}
• Deal Price: ${priceDisplay}

👉 Get the deal now before stock runs out:
${finalUrl}

#DealAlert #${storeTag} #PriceDrop #ShoppingDeal #ad`;
  }

  // Platform: PINTEREST
  if (platform === "pinterest") {
    return `📌 PIN TITLE: ${shortTitle} - ${priceDisplay} Deal on ${store}

Looking for the best deal on ${data.title}? 
${descBullet}

💰 Current Price: ${priceDisplay}
🛍 Store: ${store}

👉 Click the link to save big & order today!
#${storeTag} #Deals #MustHave #ShoppingGuide #BestFinds #ad`;
  }

  // Platform: YOUTUBE
  if (platform === "youtube") {
    return `🛍️ PRODUCT DEAL: ${shortTitle}

💰 DEAL PRICE: ${priceDisplay} (${store})
🔗 BUY HERE: ${finalUrl}

✨ KEY HIGHLIGHTS:
• ${descBullet}
• High customer ratings and fast shipping availability.

💬 PINNED COMMENT:
"🔥 Get the deal on ${store} here 👉 ${finalUrl} (#ad)"

📢 FTC DISCLOSURE:
This post contains affiliate links. If you purchase through these links, we may earn a commission at no additional cost to you.

#Deals #${storeTag} #Affiliate #ad`;
  }

  // Platform: TELEGRAM (Default)
  if (tone === "minimal") {
    return `⚡️ <b>${shortTitle}</b>
💰 <b>Price:</b> ${priceDisplay} on ${store}

👉 <a href="${finalUrl}">Get Deal Here</a>
#Deals #${storeTag} #ad`;
  }

  if (tone === "features") {
    return `💡 <b>SMART BUY: ${shortTitle}</b>

• <b>Key Feature:</b> ${descBullet}
• <b>The Benefit:</b> Premium build quality and exceptional daily performance.

💰 <b>Current Price:</b> ${priceDisplay} (${store})

👉 <a href="${finalUrl}">View Full Specs &amp; Order on ${store}</a>

#BestBuy #${storeTag} #ProductReview #ad`;
  }

  if (tone === "story") {
    return `⭐️ <b>COMMUNITY FAVORITE: ${shortTitle}</b>

"If you've been waiting for a price drop on this, now is the time to grab it."

• <b>Highlight:</b> ${descBullet}
• <b>Verified:</b> Genuine availability on ${store}

💰 <b>Deal Price:</b> ${priceDisplay}

👉 <a href="${finalUrl}">Claim this deal before it sells out</a>

#MustHave #${storeTag} #ShoppingDeal #ad`;
  }

  // Default: "urgent"
  return `🔥 <b>URGENT DEAL ALERT: ${shortTitle}</b>

• <b>Why You Need It:</b> ${descBullet}
• <b>Stock Status:</b> Limited quantity at this price on ${store}!

💰 <b>Price Drop:</b> ${priceDisplay}

👉 <a href="${finalUrl}">Click here to grab this deal on ${store}</a>

#Deals #${storeTag} #PriceDrop #ad`;
}

/**
 * Get specific copywriting guidelines according to selected platform & tone
 */
function getPlatformInstructions(platform: SocialPlatform = "telegram", tone: CopyTone = "urgent", finalUrl: string): string {
  const toneDesc =
    tone === "features"
      ? "Focus on features vs benefits, specifications, practical utility and smart buyer logic."
      : tone === "minimal"
      ? "Ultra-crisp, concise, 2-3 sentences max, no fluff, direct to point."
      : tone === "story"
      ? "Conversational, enthusiastic review style, community recommendation."
      : "Urgent deal alert, FOMO, price drop emphasis, fast action.";

  switch (platform) {
    case "instagram":
      return `
PLATFORM: INSTAGRAM CAPTION
TONE: ${toneDesc}
FORMATTING RULES:
1. Craft an eye-catching, highly visual caption with spaced paragraphs and clean emoji accents.
2. Structure:
   - Line 1: High-impact hook headline with emojis (e.g. 🔥 MEGA DEAL ALERT or ✨ SMART BUY).
   - 2-3 concise bullet points with emojis highlighting standout features, price, and store.
   - Clear Call-To-Action indicating "👉 Tap the Link in Bio & Stories to shop!" or "👉 Save this post & check link in bio!". (Note: Instagram captions do not support clickable hyperlinks, so reference Link in Bio / Story).
   - Bottom: Dot-separated section with 15-20 viral, trending deal hashtags relevant to the product category + mandatory #ad disclosure (e.g. #ad #dealalert #affiliate #shopping #musthave #finds #amazonfinds).
3. Do NOT use HTML tags (like <b> or <a>). Use standard plain text with emojis and clean line breaks.
4. Return ONLY the raw Instagram post text ready to copy/publish.
`;

    case "facebook":
      return `
PLATFORM: FACEBOOK POST
TONE: ${toneDesc}
FORMATTING RULES:
1. Structure:
   - Catchy conversational headline that hooks Facebook readers.
   - 2-3 bullet points highlighting value, benefits, and price drop.
   - Prominent, direct clickable affiliate URL: 👉 Grab the deal here: ${finalUrl}
   - Footer with 3-5 relevant hashtags and mandatory #ad disclosure.
2. Clean spacing, engaging emojis, standard plain text (no HTML tags).
3. Return ONLY the raw Facebook post text ready to publish.
`;

    case "pinterest":
      return `
PLATFORM: PINTEREST PIN
TONE: ${toneDesc}
FORMATTING RULES:
1. Structure:
   - Line 1: PIN TITLE: [SEO Keyword Rich Title under 90 characters including product and price]
   - Line 2+: PIN DESCRIPTION: Engaging, searchable product description highlighting lifestyle benefits, price, quality, and store.
   - Clear CTA: "Click the pin link to check current price and buy on [Store]!"
   - 4-6 high-ranking Pinterest keywords/hashtags (e.g. #HomeDeals #MustHaveFinds #ad).
2. Do NOT use HTML tags.
3. Return ONLY the raw Pin copy ready to publish.
`;

    case "youtube":
      return `
PLATFORM: YOUTUBE COMMUNITY POST & VIDEO DESCRIPTION / PINNED COMMENT
TONE: ${toneDesc}
FORMATTING RULES:
1. Structure into clear sections:
   🛍️ PRODUCT DEAL: [Catchy Title]
   💰 PRICE: [Price] on [Store]
   🔗 DIRECT LINK: ${finalUrl}
   
   ✨ KEY HIGHLIGHTS:
   • Feature 1
   • Feature 2
   
   💬 PINNED COMMENT COPY:
   "🔥 Grab this deal on [Store] here 👉 ${finalUrl} (#ad)"
   
   📢 FTC DISCLOSURE:
   This post contains affiliate links. We may earn a commission from qualifying purchases.
2. Clean formatting with clear headers and emojis.
3. Return ONLY the raw post text ready to publish.
`;

    case "telegram":
    default:
      return `
PLATFORM: TELEGRAM CHANNEL DEAL POST
TONE: ${toneDesc}
FORMATTING RULES:
1. Format strictly for Telegram HTML. Allowed tags: <b>bold</b>, <i>italic</i>, <a href="url">link</a>, <code>code</code>.
2. Structure:
   - Line 1: Strong bold headline (e.g. 🚨 <b>MEGA DEAL ALERT: [Catchy Short Title]</b>)
   - 2 concise bullet points starting with • highlighting the best features.
   - Price highlight line in bold with emojis (e.g., 💰 <b>Price: $29.99</b>).
   - Clear Call-To-Action link containing the affiliate URL: 👉 <a href="${finalUrl}">Grab the Deal on [Store]</a>
   - Footer: 3-5 relevant hashtags and mandatory #ad disclosure (e.g. #Deals #Shopping #ad).
3. Do NOT use markdown asterisks (*), underscores (_), or backticks. Use ONLY HTML tags (<b>, <i>, <a>).
4. Keep the total text punchy, crisp, and under 750 characters so it fits comfortably within Telegram image captions.
5. Return ONLY the raw post text ready to publish. No conversational filler or explanations.
`;
  }
}

/**
 * Generate high-converting deal copy using Gemini AI
 */
export async function generateAffiliateCopy(params: GenerateCopyRequest): Promise<string> {
  const apiKey = params.customApiKey || process.env.GEMINI_API_KEY;
  const affiliateTag = params.affiliateTag || process.env.DEFAULT_AFFILIATE_TAG;
  const finalUrl = appendAffiliateTag(params.url, affiliateTag);
  const tone = params.tone || "urgent";
  const platform = params.platform || "telegram";

  // If no Gemini API key configured, use clean platform template
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return generateTemplateCopy({ ...params, tone, platform }, finalUrl);
  }

  const platformInstructions = getPlatformInstructions(platform, tone, finalUrl);

  const prompt = `
You are an expert affiliate marketer and professional social media copywriter.
Create a high-converting, tailored deal post for this product:

- Target Platform: ${platform.toUpperCase()}
- Product Title: ${params.title}
- Price: ${params.price ? `${params.currency || '$'}${params.price}` : 'Check site for price'}
- Store/Platform: ${params.siteName || 'Online Store'}
- Description: ${params.description || 'Quality product available at a great price.'}
- Affiliate Product URL: ${finalUrl}

${platformInstructions}
`;

  try {
    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const outputText = response.text || "";

    if (outputText && outputText.trim().length > 0) {
      const cleaned = outputText
        .replace(/^```(html|text|markdown)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      return cleaned;
    }

    return generateTemplateCopy({ ...params, tone, platform }, finalUrl);
  } catch (error: unknown) {
    console.warn("Gemini generation failed, using template fallback:", error);
    return generateTemplateCopy({ ...params, tone, platform }, finalUrl);
  }
}
