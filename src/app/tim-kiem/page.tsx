"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Search } from "lucide-react";
import type { FilmItem } from "@/lib/api";

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
            setMovies(firstData.items || []);
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
            setMovies(combined);
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


