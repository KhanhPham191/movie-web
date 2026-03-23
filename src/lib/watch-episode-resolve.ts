export type WatchEpisodeItem = {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
};

export type WatchServerItem = {
  server_name: string;
  items: WatchEpisodeItem[];
};

export function serverMatchesServerParam(
  server: WatchServerItem,
  param?: string
): boolean {
  if (!param) return false;
  const serverName = (server?.server_name || "").toLowerCase();
  const normalizedParam = param.toLowerCase().replace(/\s+/g, "-");
  return (
    (serverName.includes("vietsub") && normalizedParam.includes("vietsub")) ||
    ((serverName.includes("lồng") || serverName.includes("long")) &&
      (normalizedParam.includes("long") || normalizedParam.includes("lồng"))) ||
    ((serverName.includes("thuyết") || serverName.includes("thuyet")) &&
      (normalizedParam.includes("thuyet") ||
        normalizedParam.includes("thuyết")))
  );
}

export function getDefaultWatchServer(
  filteredEpisodes: WatchServerItem[]
): WatchServerItem | undefined {
  return (
    filteredEpisodes.find((s) => /vietsub/i.test(s.server_name)) ||
    filteredEpisodes.find((s) => /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)) ||
    filteredEpisodes.find((s) => /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)) ||
    filteredEpisodes[0]
  );
}

/**
 * Khớp logic trang xem phim: ưu tiên server người dùng đang chọn (client),
 * sau đó ?server= trên URL, rồi tìm slug trên mọi server, cuối cùng fallback.
 */
export function resolveWatchEpisode(
  filteredEpisodes: WatchServerItem[],
  episodeSlug: string,
  options?: { serverParam?: string; preferredServerName?: string | null }
): {
  currentEpisode: WatchEpisodeItem | null;
  currentServer: WatchServerItem | null;
  episodeIndex: number;
  allEpisodes: WatchEpisodeItem[];
} {
  let allEpisodes: WatchEpisodeItem[] = [];

  if (filteredEpisodes.length === 0) {
    return {
      currentEpisode: null,
      currentServer: null,
      episodeIndex: -1,
      allEpisodes: [],
    };
  }

  const serverParam = options?.serverParam;
  const preferred = options?.preferredServerName;

  if (preferred) {
    const server = filteredEpisodes.find((s) => s.server_name === preferred);
    if (server) {
      const items = Array.isArray(server.items) ? server.items : [];
      allEpisodes = items;
      const idx = items.findIndex((ep) => ep.slug === episodeSlug);
      if (idx !== -1) {
        return {
          currentEpisode: items[idx],
          currentServer: server,
          episodeIndex: idx,
          allEpisodes: items,
        };
      }
      if (items[0]) {
        return {
          currentEpisode: items[0],
          currentServer: server,
          episodeIndex: 0,
          allEpisodes: items,
        };
      }
    }
  }

  if (serverParam) {
    for (const server of filteredEpisodes) {
      if (!serverMatchesServerParam(server, serverParam)) continue;
      const items = Array.isArray(server.items) ? server.items : [];
      const idx = items.findIndex((ep) => ep.slug === episodeSlug);
      if (idx !== -1) {
        return {
          currentEpisode: items[idx],
          currentServer: server,
          episodeIndex: idx,
          allEpisodes: items,
        };
      }
    }

    for (const server of filteredEpisodes) {
      const items = Array.isArray(server.items) ? server.items : [];
      const idx = items.findIndex((ep) => ep.slug === episodeSlug);
      if (idx !== -1) {
        return {
          currentEpisode: items[idx],
          currentServer: server,
          episodeIndex: idx,
          allEpisodes: items,
        };
      }
    }
  } else {
    for (const server of filteredEpisodes) {
      const items = Array.isArray(server.items) ? server.items : [];
      const idx = items.findIndex((ep) => ep.slug === episodeSlug);
      if (idx !== -1) {
        return {
          currentEpisode: items[idx],
          currentServer: server,
          episodeIndex: idx,
          allEpisodes: items,
        };
      }
    }
  }

  const defaultServer = getDefaultWatchServer(filteredEpisodes);
  if (defaultServer?.items?.[0]) {
    const items = defaultServer.items;
    return {
      currentEpisode: items[0],
      currentServer: defaultServer,
      episodeIndex: 0,
      allEpisodes: items,
    };
  }

  return {
    currentEpisode: null,
    currentServer: null,
    episodeIndex: -1,
    allEpisodes: [],
  };
}
