import { getSiteUrl, toSitemapIndexXml } from "@/lib/sitemap-data";

export async function GET() {
  const siteUrl = getSiteUrl();

  const xml = toSitemapIndexXml([
    `${siteUrl}/sitemap/static.xml`,
    `${siteUrl}/sitemap/movies.xml`,
    `${siteUrl}/sitemap/watch.xml`,
  ]);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
