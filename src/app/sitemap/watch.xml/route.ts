import { getWatchSitemapEntries, toSitemapXml } from "@/lib/sitemap-data";

export const revalidate = 86400; // 24h

export async function GET() {
  const entries = await getWatchSitemapEntries(new Date());
  const xml = toSitemapXml(entries);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
