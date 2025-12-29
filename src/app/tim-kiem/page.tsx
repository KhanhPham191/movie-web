"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/footer";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Search, SearchX, ArrowRight, AlertCircle } from "lucide-react";
import { searchFilms, type FilmItem } from "@/lib/api";

// Hàm chuẩn hóa chuỗi để so sánh (bỏ dấu, lowercase)
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Hàm tính điểm relevance cho kết quả tìm kiếm
const calculateRelevanceScore = (movieName: string, query: string): number => {
  const normalizedName = normalizeString(movieName);
  const normalizedQuery = normalizeString(query);

  // Exact match - điểm cao nhất
  if (normalizedName === normalizedQuery) {
    return 1000;
  }

  // Starts with query - điểm cao
  if (normalizedName.startsWith(normalizedQuery)) {
    return 500 + (normalizedQuery.length / normalizedName.length) * 100;
  }

  // Contains query - điểm trung bình
  if (normalizedName.includes(normalizedQuery)) {
    const position = normalizedName.indexOf(normalizedQuery);
    const positionScore = (normalizedName.length - position) / normalizedName.length * 50;
    return 200 + positionScore;
  }

  // Tất cả từ trong query đều có trong tên - điểm thấp hơn
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  const allWordsMatch = queryWords.every(word => normalizedName.includes(word));
  if (allWordsMatch) {
    return 100;
  }

  // Một số từ khớp
  const matchedWords = queryWords.filter(word => normalizedName.includes(word)).length;
  if (matchedWords > 0) {
    return (matchedWords / queryWords.length) * 50;
  }

  return 0;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  const [movies, setMovies] = useState<FilmItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setMovies(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchSearch() {
      try {
        // Gọi trang 1 để lấy tổng số trang
        const firstRes = await searchFilms(query, 1, {
          sort_field: "modified.time",
          sort_type: "desc",
          limit: 20,
        });

        // Nếu API trả về lỗi hoặc không có items, xem như không có kết quả (không phải lỗi)
        if (firstRes.status === "error" || !Array.isArray(firstRes.items)) {
          if (!cancelled) {
            setMovies([]);
            setError(null);
          }
          return;
        }

        const items = firstRes.items || [];
        
        // Nếu không có items, hiển thị không có kết quả
        if (items.length === 0) {
          if (!cancelled) {
            setMovies([]);
            setError(null);
          }
          return;
        }

        const totalPages: number =
          typeof firstRes?.paginate?.total_page === "number"
            ? firstRes.paginate.total_page
            : 1;

        // Giới hạn tối đa 5 trang để tránh quá nặng
        const pagesToFetch = Math.min(totalPages, 5);

        // Nếu chỉ có 1 trang thì dùng luôn
        if (pagesToFetch === 1) {
          if (!cancelled) {
            // Sắp xếp theo relevance score
            type FilmWithScore = FilmItem & { score: number };
            const sorted = items
              .map((movie: FilmItem): FilmWithScore => ({
                ...movie,
                score: calculateRelevanceScore(movie.name || "", query),
              }))
              .sort((a: FilmWithScore, b: FilmWithScore) => b.score - a.score)
              .map(({ score, ...rest }: FilmWithScore) => rest as FilmItem); // Bỏ score khỏi kết quả cuối
            setMovies(sorted);
            setError(null);
          }
        } else {
          // Gọi song song các trang còn lại
          const promises: Promise<Awaited<ReturnType<typeof searchFilms>>>[] = [];
          for (let page = 2; page <= pagesToFetch; page++) {
            promises.push(
              searchFilms(query, page, {
                sort_field: "modified.time",
                sort_type: "desc",
                limit: 20,
              })
            );
          }

          const results = await Promise.allSettled(promises);

          const otherItems: FilmItem[] = [];
          for (const r of results) {
            if (
              r.status === "fulfilled" &&
              r.value.status !== "error" &&
              Array.isArray(r.value.items)
            ) {
              otherItems.push(...r.value.items);
            }
          }

          if (!cancelled) {
            const combined = [
              ...items,
              ...otherItems,
            ];
            
            // Sắp xếp theo relevance score
            type FilmWithScore = FilmItem & { score: number };
            const sorted = combined
              .map((movie: FilmItem): FilmWithScore => ({
                ...movie,
                score: calculateRelevanceScore(movie.name || "", query),
              }))
              .sort((a: FilmWithScore, b: FilmWithScore) => b.score - a.score)
              .map(({ score, ...rest }: FilmWithScore) => rest as FilmItem); // Bỏ score khỏi kết quả cuối
            
            setMovies(sorted);
            setError(null);
          }
        }
      } catch (err) {
        // Chỉ hiển thị lỗi khi thực sự có lỗi network hoặc exception
        if (!cancelled) {
          setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
          setMovies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSearch();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <main className="min-h-screen">

      <div className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            {query ? (
              <>
                Kết quả tìm kiếm: <span className="gradient-text">{query}</span>
              </>
            ) : (
              "Tìm kiếm phim"
            )}
          </h1>

          {/* Chưa nhập query */}
          {!query && (
            <div className="text-center py-20">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tìm kiếm phim</h2>
              <p className="text-muted-foreground">
                Nhập từ khóa để tìm kiếm phim bạn muốn xem
              </p>
            </div>
          )}

          {/* Đang loading */}
          {query && loading && <MovieSectionSkeleton />}

          {/* Lỗi */}
          {query && !loading && error && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4">
              {/* Icon với animation */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full p-6 border border-red-500/20">
                  <AlertCircle className="w-20 h-20 md:w-24 md:h-24 text-red-500" />
                </div>
              </div>

              {/* Thông điệp lỗi */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center max-w-2xl">
                Đã xảy ra lỗi
              </h2>
              
              <p className="text-red-400 text-base md:text-lg mb-6 text-center max-w-xl">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg bg-[#F6C453] hover:bg-[#D3A13A] text-black font-semibold transition-all duration-300 flex items-center gap-2"
              >
                Thử lại
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Không có kết quả */}
          {query && !loading && !error && movies && movies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 px-4">
              {/* Icon với animation */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/20 to-[#D3A13A]/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-[#F6C453]/10 to-[#D3A13A]/10 rounded-full p-6 border border-[#F6C453]/20">
                  <SearchX className="w-20 h-20 md:w-24 md:h-24 text-[#F6C453]" />
                </div>
              </div>

              {/* Thông điệp chính */}
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
                Không có phim nào bạn tìm thấy
              </h2>
            </div>
          )}

          {/* Có kết quả */}
          {query && !loading && !error && movies && movies.length > 0 && (
            <>
              <p className="text-muted-foreground mb-6">
                Tìm thấy {movies.length} kết quả cho &ldquo;{query}&rdquo;
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
                {movies.map((movie, index) => (
                  <MovieCard
                    key={movie.id || movie.slug}
                    movie={movie}
                    index={index}
                    variant="portrait"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}


