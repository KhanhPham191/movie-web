import type { Metadata } from "next";
import SearchClientPage from "./search-client";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const raw = params.q?.trim() ?? "";
  const hasQuery = Boolean(raw);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.movpey.xyz";
  const canonicalUrl = `${siteUrl}/tim-kiem`;

  // Luôn khai báo title + description ở đây (không chỉ dựa layout):
  // một số crawler/SEO tool không merge metadata con → báo "Title is missing".
  const safe = raw.length > 70 ? `${raw.slice(0, 70)}…` : raw;
  const titleSegment = hasQuery ? `Tìm kiếm: ${safe}` : "Tìm kiếm phim";

  return {
    title: titleSegment,
    description: hasQuery
      ? `Kết quả tìm phim liên quan “${safe}” trên MovPey — Vietsub, thuyết minh, HD.`
      : "Tìm phim theo tên, diễn viên, thể loại trên MovPey. Phim lẻ, phim bộ, cập nhật liên tục.",
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !hasQuery,
      follow: true,
    },
  };
}

export default function SearchPage() {
  return <SearchClientPage />;
}
