"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Search } from "lucide-react";
import type { FilmItem } from "@/lib/api";

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
        const firstRes = await fetch(
          `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(
            query
          )}&page=1`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!firstRes.ok) {
          throw new Error(`HTTP ${firstRes.status}`);
        }

        const firstData = await firstRes.json();
        const totalPages: number =
          typeof firstData?.paginate?.total_page === "number"
            ? firstData.paginate.total_page
            : 1;

        // Giới hạn tối đa 5 trang để tránh quá nặng
        const pagesToFetch = Math.min(totalPages, 5);

        // Nếu chỉ có 1 trang thì dùng luôn
        if (pagesToFetch === 1) {
          if (!cancelled) {
            const items = firstData.items || [];
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
          }
        } else {
          // Gọi song song các trang còn lại
          const promises: Promise<Response>[] = [];
          for (let page = 2; page <= pagesToFetch; page++) {
            promises.push(
              fetch(
                `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(
                  query
                )}&page=${page}`,
                {
                  headers: {
                    Accept: "application/json",
                  },
                }
              )
            );
          }

          const results = await Promise.allSettled(promises);

          const otherItems: FilmItem[] = [];
          for (const r of results) {
            if (r.status === "fulfilled" && r.value.ok) {
              const data = await r.value.json();
              if (Array.isArray(data?.items)) {
                otherItems.push(...data.items);
              }
            }
          }

          if (!cancelled) {
            const combined = [
              ...(Array.isArray(firstData?.items) ? firstData.items : []),
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
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[Search] error:", err);
          setError("Có lỗi khi gọi API tìm kiếm. Vui lòng thử lại sau.");
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
      <Header />

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
            <div className="text-center py-20">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Không có kết quả */}
          {query && !loading && !error && movies && movies.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
              </h2>
              <p className="text-muted-foreground">
                Hãy thử tìm kiếm với từ khóa khác
              </p>
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


