import { GoogleGenAI } from "@google/genai";
import { GenerateCopyRequest, CopyTone } from "@/types/scraper";

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
  const priceDisplay = data.price
    ? `${data.currency === "USD" || data.currency === "$" ? "$" : data.currency ? `${data.currency} ` : "$"}${data.price}`
    : "Special Deal Available";

  const store = data.siteName || "Store";
  const shortTitle = data.title.length > 65 ? data.title.substring(0, 62) + "..." : data.title;
  const descBullet = data.description
    ? data.description.length > 90
      ? data.description.substring(0, 87) + "..."
      : data.description
    : "Top rated customer choice with fast delivery.";

  if (data.tone === "minimal") {
    return `⚡️ <b>${shortTitle}</b>
💰 <b>Price:</b> ${priceDisplay} on ${store}

👉 <a href="${finalUrl}">Get Deal Here</a>
#Deals #${store.replace(/\s+/g, "")} #ad`;
  }

  if (data.tone === "features") {
    return `💡 <b>SMART BUY: ${shortTitle}</b>

• <b>Key Feature:</b> ${descBullet}
• <b>The Benefit:</b> Premium build quality and exceptional daily performance.

💰 <b>Current Price:</b> ${priceDisplay} (${store})

👉 <a href="${finalUrl}">View Full Specs &amp; Order on ${store}</a>

#BestBuy #${store.replace(/\s+/g, "")} #ProductReview #ad`;
  }

  if (data.tone === "story") {
    return `⭐️ <b>COMMUNITY FAVORITE: ${shortTitle}</b>

"If you've been waiting for a price drop on this, now is the time to grab it."

• <b>Highlight:</b> ${descBullet}
• <b>Verified:</b> Genuine availability on ${store}

💰 <b>Deal Price:</b> ${priceDisplay}

👉 <a href="${finalUrl}">Claim this deal before it sells out</a>

#MustHave #${store.replace(/\s+/g, "")} #ShoppingDeal #ad`;
  }

  // Default: "urgent"
  return `🔥 <b>URGENT DEAL ALERT: ${shortTitle}</b>

• <b>Why You Need It:</b> ${descBullet}
• <b>Stock Status:</b> Limited quantity at this price on ${store}!

💰 <b>Price Drop:</b> ${priceDisplay}

👉 <a href="${finalUrl}">Click here to grab this deal on ${store}</a>

#Deals #${store.replace(/\s+/g, "")} #PriceDrop #ad`;
}

/**
 * Get specific copywriting guidelines according to selected tone
 */
function getToneInstructions(tone: CopyTone = "urgent"): string {
  switch (tone) {
    case "urgent":
      return `
TONE: Urgent Deal Alert (High-energy, FOMO, price drop emphasis).
- Headline: 🚨 <b>MEGA DEAL ALERT: [Catchy Short Title]</b> or 🔥 <b>LIMITED TIME DEAL: [Title]</b>
- Bullet 1: ⚡️ <b>Why It's Hot:</b> Highlight the biggest selling point.
- Bullet 2: 📦 <b>Availability:</b> Emphasize fast shipping or limited stock.
- Emphasize urgency and savings.
`;
    case "features":
      return `
TONE: Feature vs. Benefit (Rational, smart buyer breakdown).
- Headline: 💡 <b>SMART VALUE PICK: [Short Title]</b>
- Bullet 1: 🛠 <b>Standout Spec:</b> The key technical or build feature.
- Bullet 2: ✨ <b>Real Benefit:</b> How it actually solves a problem or saves time.
- Emphasize durability, utility, and quality for the price.
`;
    case "minimal":
      return `
TONE: Short & Minimalist (Ultra-clean, crisp, no-fluff).
- Headline: <b>[Short Title]</b>
- Bullet: • <b>Highlight:</b> 1 short sentence.
- Price line: 💰 <b>Price: [Price]</b> on [Store]
- Keep under 300 characters total.
`;
    case "story":
      return `
TONE: Story & Authentic Review (Enthusiast recommendation).
- Headline: ⭐️ <b>TOP REVIEWED: [Short Title]</b>
- Bullet 1: 💬 <b>User Verdict:</b> "One of the most reliable picks in its category."
- Bullet 2: 🎯 <b>Key Reason:</b> Highlight real-world performance.
- Friendly, trustworthy, conversational style.
`;
    default:
      return `
TONE: Urgent Deal Alert (High-converting deal alert).
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

  // If no Gemini API key configured, use clean template
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return generateTemplateCopy({ ...params, tone }, finalUrl);
  }

  const toneInstructions = getToneInstructions(tone);

  const prompt = `
You are an expert affiliate marketer and copywriter.
Create a high-converting, engaging Telegram deal alert post for this product:

- Product Title: ${params.title}
- Price: ${params.price ? `${params.currency || '$'}${params.price}` : 'Check site for price'}
- Store/Platform: ${params.siteName || 'Online Store'}
- Description: ${params.description || 'Quality product available at a great price.'}
- Affiliate Product URL: ${finalUrl}

${toneInstructions}

STRICT FORMATTING RULES:
1. Format strictly for Telegram HTML. Allowed tags: <b>bold</b>, <i>italic</i>, <a href="url">link</a>, <code>code</code>.
2. Structure:
   - Line 1: Strong bold headline
   - 2 concise bullet points starting with • highlighting the best features.
   - Price highlight line in bold with emojis (e.g., 💰 <b>Price: $29.99</b>).
   - Clear Call-To-Action link containing the affiliate URL: 👉 <a href="${finalUrl}">Grab the Deal on ${params.siteName || 'Store'}</a>
   - Footer: 3-5 relevant hashtags and mandatory #ad disclosure (e.g. #Deals #Shopping #ad).
3. Do NOT use markdown asterisks (*), underscores (_), or backticks. Use ONLY HTML tags (<b>, <i>, <a>).
4. Keep the total text punchy, crisp, and under 750 characters so it fits comfortably within Telegram image captions.
5. Return ONLY the raw post text ready to publish. No conversational filler or explanations.
`;

  try {
    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const outputText = response.text || "";

    if (outputText && outputText.trim().length > 0) {
      const cleaned = outputText
        .replace(/^```(html)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      return cleaned;
    }

    return generateTemplateCopy({ ...params, tone }, finalUrl);
  } catch (error: unknown) {
    console.warn("Gemini generation failed, using template fallback:", error);
    return generateTemplateCopy({ ...params, tone }, finalUrl);
  }
}
