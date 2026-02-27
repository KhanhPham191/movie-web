/**
 * HLS Ad Blocker - Phát hiện và lọc quảng cáo trong HLS streams
 * 
 * Hoạt động ở 3 tầng:
 * 1. Playlist-level filtering: Lọc m3u8 manifest để loại bỏ segment quảng cáo
 * 2. Fragment-level detection: Phát hiện khi video đang phát segment QC và auto-skip
 * 3. Manual skip: Nút "Bỏ qua QC" cho người dùng
 */

import Hls from "hls.js";

// ============================================================
// Known ad URL patterns (domain, path keywords)
// ============================================================
const AD_URL_PATTERNS: RegExp[] = [
  /ads?\./i,
  /adserver/i,
  /doubleclick/i,
  /googlesyndication/i,
  /advertising/i,
  /\badvert\b/i,
  /prebid/i,
  /imasdk/i,
  /vpaid/i,
  /vast\./i,
  /adnxs/i,
  /rubiconproject/i,
  /pubmatic/i,
  /aniview/i,
  /springserve/i,
  /spotx/i,
  /popads/i,
  /adsterra/i,
  /propellerads/i,
  /exoclick/i,
  /juicyads/i,
  /trafficjunky/i,
  /adf\.ly/i,
  /clickadu/i,
  /popcash/i,
  /hilltopads/i,
  /evadav/i,
  /monetag/i,
  /profitablegatecpm/i,
  /streamtape.*ad/i,
  /mixdrop.*ad/i,
  /\bad[-_]?break\b/i,
  /\bad[-_]?roll\b/i,
  /\bpre[-_]?roll\b/i,
  /\bmid[-_]?roll\b/i,
  /\bpost[-_]?roll\b/i,
];

// ============================================================
// Helpers
// ============================================================

function isKnownAdUrl(url: string): boolean {
  return AD_URL_PATTERNS.some((p) => p.test(url));
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

/**
 * Get the most common domain among a list of URLs
 * (the "main content" CDN is usually the most frequent)
 */
function getMainContentDomain(urls: string[]): string | null {
  const counts = new Map<string, number>();
  for (const u of urls) {
    const d = extractDomain(u);
    if (d) counts.set(d, (counts.get(d) || 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [d, c] of counts) {
    if (c > max) {
      max = c;
      best = d;
    }
  }
  return best;
}

// ============================================================
// M3U8 Playlist Filtering
// ============================================================

export interface AdSegmentRange {
  /** Start time (seconds) of the ad block */
  start: number;
  /** End time (seconds) of the ad block */
  end: number;
}

/**
 * Parse an m3u8 playlist string and return:
 * - filteredContent: m3u8 with ad segments removed
 * - adRanges: time ranges that were identified as ads (for skip detection)
 */
export function filterM3u8Playlist(
  content: string,
  sourceUrl: string
): { filteredContent: string; adRanges: AdSegmentRange[] } {
  if (!content || typeof content !== "string") {
    return { filteredContent: content, adRanges: [] };
  }

  const lines = content.split("\n");

  // Collect all segment URLs to find main domain
  const segUrls: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      segUrls.push(t.startsWith("http") ? t : resolveUrl(sourceUrl, t));
    }
  }
  if (segUrls.length === 0) {
    return { filteredContent: content, adRanges: [] };
  }

  const mainDomain = getMainContentDomain(segUrls);
  const filtered: string[] = [];
  const adRanges: AdSegmentRange[] = [];

  let inCueAd = false;
  let cumulativeTime = 0; // running time counter
  let adBlockStart: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    // ---- SCTE-35 / CUE markers ----
    if (t.startsWith("#EXT-X-CUE-OUT") || t.includes("SCTE35") && t.includes("OUT")) {
      inCueAd = true;
      adBlockStart = cumulativeTime;
      continue; // remove this tag
    }
    if (t.startsWith("#EXT-X-CUE-IN") || (t.includes("SCTE35") && t.includes("IN"))) {
      if (adBlockStart !== null) {
        adRanges.push({ start: adBlockStart, end: cumulativeTime });
        adBlockStart = null;
      }
      inCueAd = false;
      continue; // remove this tag
    }

    // Track segment duration
    if (t.startsWith("#EXTINF:")) {
      const match = t.match(/#EXTINF:([\d.]+)/);
      if (match) {
        const segDuration = parseFloat(match[1]);

        if (inCueAd) {
          cumulativeTime += segDuration;
          // skip #EXTINF line and the next URL line
          if (i + 1 < lines.length && !lines[i + 1].trim().startsWith("#")) {
            i++; // skip segment URL too
          }
          continue;
        }

        // Check if the NEXT line (segment URL) is an ad
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith("#")) {
            const fullUrl = nextLine.startsWith("http")
              ? nextLine
              : resolveUrl(sourceUrl, nextLine);

            const urlIsAd = isKnownAdUrl(fullUrl);
            const domainDiffers =
              mainDomain &&
              extractDomain(fullUrl) !== null &&
              extractDomain(fullUrl) !== mainDomain;

            if (urlIsAd || (domainDiffers && urlIsAd)) {
              // Record ad range
              adRanges.push({
                start: cumulativeTime,
                end: cumulativeTime + segDuration,
              });
              cumulativeTime += segDuration;
              i++; // skip URL line
              continue;
            }
          }
        }

        cumulativeTime += segDuration;
      }
    }

    if (inCueAd) continue;

    filtered.push(line);
  }

  // Close unclosed ad block
  if (adBlockStart !== null) {
    adRanges.push({ start: adBlockStart, end: cumulativeTime });
  }

  // Clean up orphaned consecutive DISCONTINUITY tags
  const cleaned = filtered
    .join("\n")
    .replace(/(#EXT-X-DISCONTINUITY\s*\n){2,}/g, "#EXT-X-DISCONTINUITY\n");

  return { filteredContent: cleaned, adRanges };
}

// ============================================================
// Custom HLS.js Loader – intercepts playlist responses
// ============================================================

/** All detected ad time ranges across all loaded playlists */
let globalAdRanges: AdSegmentRange[] = [];
let adRangeListeners: Array<(ranges: AdSegmentRange[]) => void> = [];

export function getAdRanges(): AdSegmentRange[] {
  return globalAdRanges;
}

export function onAdRangesUpdate(cb: (ranges: AdSegmentRange[]) => void): () => void {
  adRangeListeners.push(cb);
  return () => {
    adRangeListeners = adRangeListeners.filter((l) => l !== cb);
  };
}

function notifyAdRanges() {
  for (const cb of adRangeListeners) {
    cb([...globalAdRanges]);
  }
}

/**
 * Creates an HLS.js-compatible Loader class that intercepts playlist
 * responses and filters out ad segments before HLS.js parses them.
 */
export function createAdBlockingLoader(HlsClass: typeof Hls): typeof Hls.DefaultConfig.loader {
  const DefaultLoader = HlsClass.DefaultConfig.loader;

  class AdBlockingLoader extends DefaultLoader {
    load(
      context: any,
      config: any,
      callbacks: any
    ) {
      const origOnSuccess = callbacks.onSuccess;

      callbacks.onSuccess = (
        response: any,
        stats: any,
        ctx: any,
        networkDetails?: any
      ) => {
        // Only filter text-based playlist responses (not binary segment data)
        if (
          typeof response.data === "string" &&
          (context.type === "manifest" || context.type === "level" || context.type === "audioTrack")
        ) {
          const { filteredContent, adRanges } = filterM3u8Playlist(
            response.data,
            context.url
          );
          if (adRanges.length > 0) {
            globalAdRanges = mergeAdRanges([...globalAdRanges, ...adRanges]);
            notifyAdRanges();
            console.log(
              `[AdBlocker] Filtered ${adRanges.length} ad segment(s) from playlist`,
              adRanges
            );
          }
          response.data = filteredContent;
        }
        origOnSuccess(response, stats, ctx, networkDetails);
      };

      super.load(context, config, callbacks);
    }
  }

  return AdBlockingLoader as unknown as typeof Hls.DefaultConfig.loader;
}

/** Merge overlapping/adjacent ad ranges */
function mergeAdRanges(ranges: AdSegmentRange[]): AdSegmentRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: AdSegmentRange[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end + 1) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

// ============================================================
// Runtime ad detection – monitors video playback
// ============================================================

export interface AdDetectionState {
  /** Whether we think an ad is currently playing */
  isAdPlaying: boolean;
  /** How many seconds until the ad block ends (if known) */
  remainingSeconds: number;
  /** The end time to skip to */
  skipToTime: number;
}

/**
 * Check if a given playback time falls within a known ad range
 */
export function checkAdAtTime(time: number, ranges: AdSegmentRange[]): AdDetectionState | null {
  for (const r of ranges) {
    if (time >= r.start && time < r.end) {
      return {
        isAdPlaying: true,
        remainingSeconds: Math.ceil(r.end - time),
        skipToTime: r.end + 0.5, // skip slightly past the ad
      };
    }
  }
  return null;
}

// ============================================================
// HLS.js Fragment-level detection (DISCONTINUITY-based)
// ============================================================

/**
 * Sets up HLS.js event listeners for fragment-level ad detection.
 * 
 * Detects ad segments by monitoring:
 * - Fragment URL domain changes (different CDN = likely ad)
 * - DISCONTINUITY markers in the stream
 * - Known ad URL patterns in fragment URLs
 * 
 * Returns a cleanup function.
 */
export function setupFragmentAdDetection(
  hls: Hls,
  videoElement: HTMLVideoElement,
  callbacks: {
    onAdDetected?: (state: AdDetectionState) => void;
    onAdEnded?: () => void;
  }
): () => void {
  let mainFragDomain: string | null = null;
  let fragDomainCounts = new Map<string, number>();
  let isInAd = false;

  const onFragLoaded = (_event: string, data: { frag: { url: string; start: number; duration: number } }) => {
    const fragUrl = data.frag.url;
    const fragDomain = extractDomain(fragUrl);

    // Track domain frequency
    if (fragDomain) {
      fragDomainCounts.set(fragDomain, (fragDomainCounts.get(fragDomain) || 0) + 1);
      // Recalculate main domain
      let maxCount = 0;
      for (const [d, c] of fragDomainCounts) {
        if (c > maxCount) {
          maxCount = c;
          mainFragDomain = d;
        }
      }
    }

    // Check if this fragment is an ad
    const isAdFrag =
      isKnownAdUrl(fragUrl) ||
      (mainFragDomain && fragDomain && fragDomain !== mainFragDomain);

    if (isAdFrag && !isInAd) {
      isInAd = true;
      callbacks.onAdDetected?.({
        isAdPlaying: true,
        remainingSeconds: Math.ceil(data.frag.duration),
        skipToTime: data.frag.start + data.frag.duration + 0.5,
      });
    } else if (!isAdFrag && isInAd) {
      isInAd = false;
      callbacks.onAdEnded?.();
    }
  };

  hls.on(Hls.Events.FRAG_LOADED, onFragLoaded as any);

  return () => {
    hls.off(Hls.Events.FRAG_LOADED, onFragLoaded as any);
  };
}

// ============================================================
// Reset (call when switching sources)
// ============================================================

export function resetAdBlocker() {
  globalAdRanges = [];
  adRangeListeners = [];
}
