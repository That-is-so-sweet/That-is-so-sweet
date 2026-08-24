export interface ParsedLocationLink {
  url: string;
  isShortLink: boolean;
}

const SHORT_LINK_HOSTS = ["maps.app.goo.gl", "goo.gl"];
const FULL_LINK_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "google.com.tw",
  "www.google.com.tw",
  "maps.google.com.tw",
];

// 判斷輸入文字是否為 Google Maps 連結；非連結（純文字地點）回傳 null。
export function parseLocationInput(raw: string): ParsedLocationLink | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  if (SHORT_LINK_HOSTS.includes(host)) {
    return { url: trimmed, isShortLink: true };
  }
  if (FULL_LINK_HOSTS.includes(host) && (url.pathname.includes("/maps/") || url.pathname === "/maps")) {
    return { url: trimmed, isShortLink: false };
  }
  return null;
}

// 完整連結（如 .../maps/place/<name>/@lat,lng,17z）可以直接從路徑解碼出地點名稱，
// 不需要發送任何網路請求。解析不出來就回傳 null，呼叫端會 fallback 用原始輸入文字。
export function extractPlaceNameFromFullUrl(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  } catch {
    return null;
  }
}

const MOCK_RESOLVED_PLACE_NAME = "台北市信義區";
const MOCK_RESOLVE_DELAY_MS = 600;

// Google Maps 短連結（maps.app.goo.gl / goo.gl/maps）只有在伺服器端發送請求才能
// 解析出真實地點名稱，瀏覽器端直接 fetch 別人網站會遇到 CORS 封鎖、無法保證成功。
// 這個專案是純 client-side、無後端架構（見 CLAUDE.md），所以短連結解析目前用固定
// 假地點名稱模擬（加一個小延遲讓 UI 呈現「解析中」的過渡狀態）。
// 之後如果要接上真的後端/API，只需要換掉這個函式的實作，呼叫端不用改。
export function mockResolveShortLink(_url: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_RESOLVED_PLACE_NAME), MOCK_RESOLVE_DELAY_MS);
  });
}
