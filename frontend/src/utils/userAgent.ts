export type ParsedUserAgent = {
  os: string;
  browser: string;
  device: string;
};

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return {
      os: "Unknown",
      browser: "Unknown",
      device: "Unknown",
    };
  }

  const ua = userAgent.toLowerCase();
  const os = getOs(ua);
  const browser = getBrowser(ua);
  const device = getDevice(ua);

  return { os, browser, device };
}

export function summarizeUserAgent(userAgent: string | null): string {
  const parsed = parseUserAgent(userAgent);
  return [parsed.os, parsed.browser, parsed.device].filter((item) => item !== "Unknown").join(" · ") || "Unknown";
}

function getOs(ua: string) {
  if (ua.includes("android")) {
    return "Android";
  }
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    return "iOS";
  }
  if (ua.includes("mac os x") || ua.includes("macintosh")) {
    return "macOS";
  }
  if (ua.includes("windows")) {
    return "Windows";
  }
  if (ua.includes("linux")) {
    return "Linux";
  }
  return "Unknown";
}

function getBrowser(ua: string) {
  if (ua.includes("edg/") || ua.includes("edge/")) {
    return "Edge";
  }
  if (ua.includes("firefox/")) {
    return "Firefox";
  }
  if (ua.includes("chrome/") || ua.includes("crios/")) {
    return "Chrome";
  }
  if (ua.includes("safari/")) {
    return "Safari";
  }
  return "Unknown";
}

function getDevice(ua: string) {
  if (ua.includes("ipad") || ua.includes("tablet")) {
    return "Tablet";
  }
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) {
    return "Mobile";
  }
  return "Desktop";
}
