import * as cheerio from "cheerio";
import { ScrapedProduct } from "@/types/scraper";

const BROWSER_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Format domain name into clean brand title (e.g., 'amazon.com' -> 'Amazon')
 */
export function formatDomainToSiteName(hostname: string): string {
  const cleanHost = hostname.replace(/^www\./, "");
  const parts = cleanHost.split(".");
  const brand = parts[0] || "Store";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

/**
 * Helper to safely resolve relative URLs to absolute
 */
export function resolveUrl(relativeOrAbsolute: string | undefined | null, baseUrl: string): string {
  if (!relativeOrAbsolute) return "";
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Extract JSON-LD product data if available
 */
function extractJsonLd($: cheerio.CheerioAPI): {
  title?: string;
  image?: string;
  description?: string;
  price?: string;
  currency?: string;
  brand?: string;
} {
  const result: {
    title?: string;
    image?: string;
    description?: string;
    price?: string;
    currency?: string;
    brand?: string;
  } = {};

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const type = item["@type"];
        const isProduct =
          type === "Product" ||
          (Array.isArray(type) && type.includes("Product")) ||
          type === "IndividualProduct";

        if (isProduct || !result.title) {
          if (item.name && !result.title) result.title = String(item.name).trim();
          if (item.description && !result.description) result.description = String(item.description).trim();

          // Image
          if (item.image && !result.image) {
            if (typeof item.image === "string") {
              result.image = item.image;
            } else if (Array.isArray(item.image) && item.image[0]) {
              result.image = typeof item.image[0] === "string" ? item.image[0] : item.image[0].url;
            } else if (typeof item.image === "object" && item.image.url) {
              result.image = item.image.url;
            }
          }

          // Brand
          if (item.brand && !result.brand) {
            result.brand = typeof item.brand === "string" ? item.brand : item.brand.name;
          }

          // Offers / Price
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers) {
              if (offers.price && !result.price) result.price = String(offers.price);
              if (offers.lowPrice && !result.price) result.price = String(offers.lowPrice);
              if (offers.priceCurrency && !result.currency) result.currency = String(offers.priceCurrency);
            }
          }
        }
      }
    } catch {
      // Ignore JSON-LD parse errors for malformed tags
    }
  });

  return result;
}

/**
 * Infer currency symbol or standard code from string
 */
function normalizeCurrency(rawCurrency: string | null, priceText: string): string | null {
  if (rawCurrency && rawCurrency.trim().length > 0) {
    return rawCurrency.trim().toUpperCase();
  }

  if (priceText.includes("$")) return "USD";
  if (priceText.includes("€")) return "EUR";
  if (priceText.includes("£")) return "GBP";
  if (priceText.includes("¥")) return "JPY";
  if (priceText.includes("₹") || priceText.toLowerCase().includes("inr")) return "INR";
  if (priceText.toLowerCase().includes("pkr") || priceText.toLowerCase().includes("rs")) return "PKR";
  if (priceText.toLowerCase().includes("cad")) return "CAD";
  if (priceText.toLowerCase().includes("aud")) return "AUD";

  return null;
}

/**
 * Clean and format price string
 */
function cleanPriceString(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/[\d,.]+/);
  if (!match) return null;
  const cleaned = match[0].replace(/,/g, "");
  return isNaN(parseFloat(cleaned)) ? null : cleaned;
}

/**
 * Main Scraper Engine
 */
export async function scrapeProductUrl(targetUrl: string): Promise<ScrapedProduct> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new Error("Invalid URL provided. Please include http:// or https://");
  }

  const hostname = parsedUrl.hostname;
  const siteNameFallback = formatDomainToSiteName(hostname);
  const defaultFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

  let html = "";
  let isFallback = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENTS[0],
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Ch-Ua": '"Not A(Brand";v="99", "Chromium";v="123", "Google Chrome";v="123"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      html = await response.text();
    } else {
      isFallback = true;
    }
  } catch {
    isFallback = true;
  }

  // If HTML could not be fetched (blocked/timeout), return clean structured fallback
  if (isFallback || !html) {
    // Generate readable title from URL slug if possible
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const lastSlug = pathSegments[pathSegments.length - 1] || "";
    const cleanSlugTitle = lastSlug
      .replace(/[-_+]/g, " ")
      .replace(/\.(html|php|asp)$/i, "")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      url: targetUrl,
      canonicalUrl: targetUrl,
      title: cleanSlugTitle || `Product on ${siteNameFallback}`,
      description: `Discovered product on ${siteNameFallback}. Visit the official site for full specifications, customer reviews, and latest availability.`,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      images: [],
      price: null,
      currency: null,
      siteName: siteNameFallback,
      favicon: defaultFavicon,
      scrapedAt: new Date().toISOString(),
      isFallback: true,
    };
  }

  // Load Cheerio
  const $ = cheerio.load(html);

  // 1. Extract JSON-LD structured data
  const jsonLd = extractJsonLd($);

  // 2. Extract Canonical URL
  const canonicalUrl = resolveUrl(
    $('link[rel="canonical"]').attr("href") ||
      $('meta[property="og:url"]').attr("content"),
    targetUrl
  );

  // 3. Extract Title
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    jsonLd.title ||
    $('meta[name="title"]').attr("content") ||
    $("#productTitle").text().trim() ||
    $("h1.product-title").text().trim() ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  // Clean title noise
  if (title) {
    title = title
      .replace(/\s+/g, " ")
      .replace(/ - (Amazon|AliExpress|eBay|Walmart|Etsy|Target)$/i, "")
      .replace(/ \| (Amazon|AliExpress|eBay|Walmart|Etsy|Target)$/i, "")
      .trim();
  } else {
    title = `Featured Product - ${siteNameFallback}`;
  }

  // 4. Extract Description
  let description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    jsonLd.description ||
    $('meta[name="description"]').attr("content") ||
    $('meta[itemprop="description"]').attr("content") ||
    $("#feature-bullets").text().trim() ||
    $(".product-description").text().trim() ||
    $("p").first().text().trim();

  if (description) {
    description = description.replace(/\s+/g, " ").trim();
    if (description.length > 300) {
      description = description.substring(0, 297) + "...";
    }
  } else {
    description = `View details, pricing, and availability for this item on ${siteNameFallback}.`;
  }

  // 5. Extract Images
  const discoveredImages: string[] = [];

  const ogImage = $('meta[property="og:image:secure_url"]').attr("content") ||
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image:src"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[itemprop="image"]').attr("content") ||
    jsonLd.image;

  if (ogImage) {
    discoveredImages.push(resolveUrl(ogImage, targetUrl));
  }

  // Additional image selectors
  const domImage =
    $("#landingImage").attr("data-old-hires") ||
    $("#landingImage").attr("src") ||
    $("#imgBlkFront").attr("src") ||
    $(".product-featured-image").attr("src") ||
    $('link[rel="image_src"]').attr("href");

  if (domImage) {
    const resolved = resolveUrl(domImage, targetUrl);
    if (!discoveredImages.includes(resolved)) {
      discoveredImages.push(resolved);
    }
  }

  // Collect any other high-res images on page
  $("img").each((_, el) => {
    const src = $(el).attr("data-zoom-image") || $(el).attr("data-src") || $(el).attr("src");
    if (src && !src.includes("data:image") && !src.includes("icon") && !src.includes("logo")) {
      const resolved = resolveUrl(src, targetUrl);
      if (resolved && !discoveredImages.includes(resolved) && discoveredImages.length < 5) {
        discoveredImages.push(resolved);
      }
    }
  });

  const mainImage =
    discoveredImages[0] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

  // 6. Extract Price & Currency
  let rawPrice =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content") ||
    $('meta[name="product:price:amount"]').attr("content") ||
    $('meta[itemprop="price"]').attr("content") ||
    $('span[itemprop="price"]').text() ||
    jsonLd.price ||
    $(".a-price .a-offscreen").first().text() ||
    $(".product-price").first().text() ||
    $('[data-price]').first().attr("data-price") ||
    $(".price").first().text();

  let rawCurrency =
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content") ||
    $('meta[name="product:price:currency"]').attr("content") ||
    $('meta[itemprop="priceCurrency"]').attr("content") ||
    jsonLd.currency ||
    null;

  const price = cleanPriceString(rawPrice);
  const currency = normalizeCurrency(rawCurrency, rawPrice || "");

  // 7. Extract Site Name
  const siteName =
    $('meta[property="og:site_name"]').attr("content") ||
    jsonLd.brand ||
    siteNameFallback;

  // 8. Extract Favicon
  const faviconRaw =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href");

  const favicon = resolveUrl(faviconRaw, targetUrl) || defaultFavicon;

  return {
    url: targetUrl,
    canonicalUrl: canonicalUrl || targetUrl,
    title,
    description,
    image: mainImage,
    images: discoveredImages,
    price,
    currency,
    siteName,
    favicon,
    scrapedAt: new Date().toISOString(),
    isFallback: false,
  };
}
