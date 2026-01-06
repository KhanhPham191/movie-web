import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimeCarousel } from "@/components/home-sections/anime-carousel";
import { getFilmsByCategory, type FilmItem } from "@/lib/api";

export async function AnimeSection() {
  try {
    // DÙNG DUY NHẤT API:
    // https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1&sort_field=_id&sort_type=desc&category=hanh-dong&year=2025&limit=10
    const res = await getFilmsByCategory("hoat-hinh", 1, {
      sort_field: "_id",
      sort_type: "desc",
      category: "hanh-dong",
      year: 2025,
      limit: 10,
    }).catch(() => ({
      status: "error",
      items: [] as FilmItem[],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 0,
      },
    }));

    const animeMovies = res.items || [];

    if (animeMovies.length === 0) return <></>;

    return (
      <section className="space-y-3 sm:space-y-4">
        {/* Title outside block with bordered style */}
        <div className="px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <Link href="/danh-sach/hoat-hinh" className="group/title block">
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <div className="h-[2px] w-8 sm:w-10 rounded-full bg-gradient-to-r from-[#F6C453] via-[#F3B13C] to-[#D3A13A] shadow-[0_0_12px_rgba(243,177,60,0.45)]" />
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-tight">
                  Phim Anime
                </h2>
                <span className="hidden sm:flex items-center gap-1.5 text-[#F6C453] text-xs sm:text-sm font-medium opacity-0 max-w-0 group-hover/title:opacity-100 group-hover/title:max-w-[120px] transition-all duration-300 overflow-hidden whitespace-nowrap">
                  Xem tất cả
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/title:translate-x-1" />
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-[#F6C453]/60 via-[#D3A13A]/40 to-transparent" />
            </div>
          </Link>
        </div>

        <AnimeCarousel movies={animeMovies} />
      </section>
    );
  } catch (error) {
    return <></>;
  }
}

// Optional default + alias để code cũ vẫn chạy nếu còn import `AuMySection`
export default AnimeSection;
export { AnimeSection as AuMySection };
