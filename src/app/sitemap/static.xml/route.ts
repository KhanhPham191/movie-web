import { getStaticSitemapEntries, toSitemapXml } from "@/lib/sitemap-data";

export async function GET() {
  const xml = toSitemapXml(getStaticSitemapEntries(new Date()));
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
