/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ad Blocker cho M3U8/HLS Player
 * 
 * Chiến lược:
 * 1. Custom HLS Loader: intercept M3U8 manifest, lọc quảng cáo trước khi Hls.js parse
 * 2. Discontinuity Analysis: phát hiện pre-roll/mid-roll bằng phân tích segment groups
 * 3. Domain Comparison: so sánh domain segment với domain chính
 * 4. Manual Skip Button: khi không tự detect được, hiển thị nút bỏ qua
 */

// Domain quảng cáo phổ biến
const AD_DOMAINS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleads",
  "adservice",
  "popads.net",
  "popcash.net",
  "juicyads.com",
  "exoclick.com",
  "trafficjunky.com",
  "imasdk.googleapis.com",
  "serving-sys.com",
  "moatads.com",
  "adsrvr.org",
];

// Keyword trong URL quảng cáo
const AD_URL_KEYWORDS = [
  "/ad/",
  "/ads/",
  "/advert/",
  "preroll",
  "midroll",
  "postroll",
  "commercial",
  "sponsor",
  "vast",
  "vpaid",
  "/advertisement/",
];

/**
 * Kiểm tra URL có phải quảng cáo không
 */
export function isAdUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    AD_DOMAINS.some((d) => lower.includes(d)) ||
    AD_URL_KEYWORDS.some((k) => lower.includes(k))
  );
}

/**
 * Segment group info từ phân tích M3U8
 */
interface SegmentGroup {
  totalDuration: number;
  segmentCount: number;
  hasDiscontinuity: boolean;
  hasDifferentDomain: boolean;
}

/**
 * Phân tích M3U8 thành các segment groups dựa trên DISCONTINUITY
 */
function parseSegmentGroups(
  lines: string[],
  mainDomain: string
): SegmentGroup[] {
  const groups: SegmentGroup[] = [];
  let current: SegmentGroup = {
    totalDuration: 0,
    segmentCount: 0,
    hasDiscontinuity: false,
    hasDifferentDomain: false,
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "#EXT-X-DISCONTINUITY") {
      if (current.segmentCount > 0) {
        groups.push({ ...current });
      }
      current = {
        totalDuration: 0,
        segmentCount: 0,
        hasDiscontinuity: true,
        hasDifferentDomain: false,
      };
      continue;
    }

    if (trimmed.startsWith("#EXTINF:")) {
      const dur = parseFloat(trimmed.split(":")[1]);
      if (!isNaN(dur)) {
        current.totalDuration += dur;
        current.segmentCount++;
      }
    }

    if (trimmed.startsWith("http")) {
      try {
        const segDomain = new URL(trimmed).hostname;
        if (mainDomain && segDomain !== mainDomain) {
          current.hasDifferentDomain = true;
        }
      } catch {
        // ignore
      }
    }
  }

  if (current.segmentCount > 0) {
    groups.push(current);
  }

  return groups;
}

/**
 * Lọc quảng cáo khỏi M3U8 manifest
 *
 * Chiến lược:
 * 1. Xóa segment giữa CUE-OUT / CUE-IN
 * 2. Xóa segment có URL quảng cáo
 * 3. Phát hiện pre-roll: group đầu tiên ≤ 35s kèm DISCONTINUITY
 * 4. Phát hiện mid-roll: group ngắn ≤ 35s giữa phim
 * 5. Domain khác biệt + ngắn → quảng cáo
 */
export function filterAdFromM3U8(
  manifest: string,
  sourceUrl?: string
): { filtered: string; adDuration: number; adsRemoved: number } {
  const lines = manifest.split("\n");

  // Tìm domain chính
  let mainDomain = "";
  if (sourceUrl) {
    try {
      mainDomain = new URL(sourceUrl).hostname;
    } catch {
      // ignore
    }
  }
  // Domain phổ biến nhất trong segments
  const domainCount: Record<string, number> = {};
  for (const line of lines) {
    if (line.trim().startsWith("http")) {
      try {
        const d = new URL(line.trim()).hostname;
        domainCount[d] = (domainCount[d] || 0) + 1;
      } catch {
        // ignore
      }
    }
  }
  const sorted = Object.entries(domainCount).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    mainDomain = sorted[0][0];
  }

  // Bước 1: Xóa CUE-OUT/CUE-IN blocks + ad URL segments
  const step1: string[] = [];
  let inAdBreak = false;
  let removedAdDuration = 0;
  let removedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes("#EXT-X-CUE-OUT") || line.includes("#EXT-X-SCTE35")) {
      inAdBreak = true;
      continue;
    }
    if (line.includes("#EXT-X-CUE-IN")) {
      inAdBreak = false;
      continue;
    }
    if (inAdBreak) {
      if (line.startsWith("#EXTINF:")) {
        const dur = parseFloat(line.split(":")[1]);
        if (!isNaN(dur)) removedAdDuration += dur;
        removedCount++;
      }
      continue;
    }

    // Xóa segment có URL quảng cáo
    if (line.startsWith("http") && isAdUrl(line)) {
      if (
        step1.length > 0 &&
        step1[step1.length - 1].trim().startsWith("#EXTINF")
      ) {
        const dur = parseFloat(
          step1[step1.length - 1].trim().split(":")[1]
        );
        if (!isNaN(dur)) removedAdDuration += dur;
        step1.pop();
      }
      removedCount++;
      continue;
    }

    step1.push(lines[i]);
  }

  // Bước 2: Phân tích groups
  const groups = parseSegmentGroups(step1, mainDomain);

  if (groups.length <= 1) {
    return {
      filtered: step1.join("\n"),
      adDuration: removedAdDuration,
      adsRemoved: removedCount,
    };
  }

  // Tìm group dài nhất (phim chính)
  const maxDur = Math.max(...groups.map((g) => g.totalDuration));

  // Đánh dấu ad groups
  const adGroupIndices = new Set<number>();
  groups.forEach((group, i) => {
    // Pre-roll: group đầu, ngắn ≤ 35s, có discontinuity
    if (i === 0 && group.hasDiscontinuity && group.totalDuration <= 35) {
      adGroupIndices.add(i);
      removedAdDuration += group.totalDuration;
    }
    // Mid-roll: ngắn, < 10% phim chính
    else if (
      group.totalDuration <= 35 &&
      group.hasDiscontinuity &&
      group.totalDuration < maxDur * 0.1
    ) {
      adGroupIndices.add(i);
      removedAdDuration += group.totalDuration;
    }
    // Domain khác + ngắn
    else if (group.hasDifferentDomain && group.totalDuration <= 60) {
      adGroupIndices.add(i);
      removedAdDuration += group.totalDuration;
    }
  });

  if (adGroupIndices.size === 0) {
    return {
      filtered: step1.join("\n"),
      adDuration: removedAdDuration,
      adsRemoved: removedCount,
    };
  }

  removedCount += adGroupIndices.size;

  // Rebuild manifest
  const filtered: string[] = [];
  let currentGroupIdx = 0;

  for (const rawLine of step1) {
    const line = rawLine.trim();

    if (line === "#EXT-X-DISCONTINUITY") {
      currentGroupIdx++;
      if (!adGroupIndices.has(currentGroupIdx)) {
        filtered.push(rawLine);
      }
      continue;
    }

    if (adGroupIndices.has(currentGroupIdx)) {
      continue;
    }

    filtered.push(rawLine);
  }

  return {
    filtered: filtered.join("\n"),
    adDuration: removedAdDuration,
    adsRemoved: removedCount,
  };
}

/**
 * Tạo custom playlist loader cho Hls.js
 * Intercept M3U8 manifest và lọc quảng cáo trước khi Hls.js parse
 */
export function createAdFreeLoader(HlsClass: any) {
  const DefaultLoader = HlsClass.DefaultConfig.loader;

  class AdFreeLoader extends DefaultLoader {
    load(context: any, config: any, callbacks: any) {
      // Chỉ filter playlist M3U8
      if (
        context.type === "manifest" ||
        context.type === "level" ||
        context.type === "audioTrack"
      ) {
        const originalOnSuccess = callbacks.onSuccess;
        callbacks.onSuccess = function (
          response: any,
          stats: any,
          ctx: any,
          networkDetails: any
        ) {
          if (
            typeof response.data === "string" &&
            response.data.includes("#EXTM3U")
          ) {
            const original = response.data;
            const sUrl = ctx?.url || context?.url || "";
            const result = filterAdFromM3U8(original, sUrl);
            response.data = result.filtered;

            if (result.adsRemoved > 0) {
              console.log(
                `🛡️ [AdBlock] Đã lọc ${result.adsRemoved} đoạn QC (${result.adDuration.toFixed(1)}s)`
              );
            }
          }
          originalOnSuccess(response, stats, ctx, networkDetails);
        };
      }
      super.load(context, config, callbacks);
    }
  }

  return AdFreeLoader;
}

/**
 * Chặn popup và iframe quảng cáo trên page
 */
export function blockPageAds() {
  // Chặn popup
  const originalOpen = window.open;
  window.open = function (url?: string | URL, target?: string, features?: string) {
    const urlStr = url?.toString() || "";
    if (isAdUrl(urlStr)) {
      return null;
    }
    return originalOpen.call(this, url, target, features);
  };

  // Chặn iframe + overlay quảng cáo inject vào page
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLIFrameElement) {
          const src = node.src || "";
          if (isAdUrl(src)) {
            node.remove();
          }
        }
        if (node instanceof HTMLElement) {
          try {
            const style = window.getComputedStyle(node);
            if (
              style.position === "fixed" &&
              parseInt(style.zIndex) > 9000 &&
              node.querySelector('a[target="_blank"]')
            ) {
              node.remove();
            }
          } catch {
            // ignore
          }
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
