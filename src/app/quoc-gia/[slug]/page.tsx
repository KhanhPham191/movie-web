import { Suspense } from "react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getFilmsByCategoryMultiple,
  CATEGORIES,
  type FilmItem,
  COUNTRIES,
} from "@/lib/api";

// ISR: Revalidate every 5 minutes for country pages
export const revalidate = 300;

interface CountryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

async function CountryContent({ slug, page }: { slug: string; page: number }) {
  try {
    const ITEMS_PER_PAGE = 10;
    // Tất cả quốc gia: dùng nguồn phim-bo + phim-le có country filter (giống danh-sach) và bỏ Hoạt Hình
    const [phimBo, phimLe] = await Promise.allSettled([
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 3, {
        sort_field: "modified",
        sort_type: "desc",
        country: slug,
        limit: 50,
      }).catch(() => []),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3, {
        sort_field: "modified",
        sort_type: "desc",
        country: slug,
        limit: 50,
      }).catch(() => []),
    ]);

    const phimBoList = phimBo.status === "fulfilled" ? phimBo.value : [];
    const phimLeList = phimLe.status === "fulfilled" ? phimLe.value : [];

    const allMovies = [...phimBoList, ...phimLeList];
    const uniqueMovies = Array.from(
      new Map(allMovies.map((m) => [m.slug, m])).values()
    );

    const filteredMovies = uniqueMovies.filter((movie) => {
      if (!movie.category || !Array.isArray(movie.category)) return true;
      return !movie.category.some((cat: any) => {
        const slugVal = (cat?.slug || "").toString().toLowerCase();
        const nameVal = (cat?.name || "").toString().toLowerCase();
        return (
          slugVal === "hoat-hinh" ||
          nameVal.includes("hoạt hình") ||
          nameVal.includes("hoat hinh")
        );
      });
    });

    if (!filteredMovies || filteredMovies.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Không có phim nào từ quốc gia này
          </p>
        </div>
      );
    }

    const sortedMovies = sortByModifiedDesc(filteredMovies);
    const totalPages = Math.ceil(sortedMovies.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const movies = sortedMovies.slice(startIndex, endIndex);

    if (movies.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Không có phim nào từ quốc gia này
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {movies.map((movie, index) => (
            <MovieCard
              key={`${movie.slug}-${index}`}
              movie={movie}
              index={index}
              variant="portrait"
            />
          ))}
        </div>

        {totalPages > 1 && (
          <>
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={`/quoc-gia/${slug}?page=${page - 1}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trang trước
                  </Button>
                </Link>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    page <= 3
                      ? i + 1
                      : Math.max(1, Math.min(page - 2 + i, totalPages));
                  if (pageNum > totalPages || pageNum < 1) return null;
                  return (
                    <Link
                      key={pageNum}
                      href={`/quoc-gia/${slug}?page=${pageNum}`}
                    >
                      <Button
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className={pageNum === page ? "bg-primary" : ""}
                      >
                        {pageNum}
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {page < totalPages && (
                <Link href={`/quoc-gia/${slug}?page=${page + 1}`}>
                  <Button variant="outline" size="sm">
                    Trang sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Trang {page} / {totalPages} ({sortedMovies.length} phim)
            </p>
          </>
        )}
      </>
    );
  } catch {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}

export default async function CountryPage({
  params,
  searchParams,
}: CountryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const country = COUNTRIES.find((c) => c.slug === slug);
  const countryName = country?.name || slug;

  return (
    <main className="min-h-screen">
      <div className="pt-20 md:pt-24">
        <GenreSection />
      </div>

      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Phim <span className="gradient-text">{countryName}</span>
          </h1>

          <Suspense fallback={<MovieSectionSkeleton />}>
            <CountryContent slug={slug} page={page} />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: CountryPageProps) {
  const { slug } = await params;
  const country = COUNTRIES.find((c) => c.slug === slug);
  const countryName = country?.name || slug;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://movpey.example.com");
  const countryUrl = `${siteUrl}/quoc-gia/${slug}`;

  return {
    title: `Phim ${countryName} - Xem phim ${countryName} Vietsub | MovPey`,
    description: `Kho phim ${countryName} full HD Vietsub, thuyết minh, cập nhật liên tục trên MovPey. Hàng nghìn bộ phim ${countryName} chất lượng cao.`,
    keywords: [
      `phim ${countryName}`,
      countryName,
      "xem phim online",
      "phim vietsub",
      "phim thuyết minh",
      "phim hd",
      "phim miễn phí",
    ],
    alternates: {
      canonical: countryUrl,
      languages: {
        "vi": countryUrl,
        "vi-VN": countryUrl,
        "x-default": countryUrl,
      },
    },
    openGraph: {
      title: `Phim ${countryName} - Xem phim ${countryName} Vietsub | MovPey`,
      description: `Kho phim ${countryName} full HD Vietsub, thuyết minh, cập nhật liên tục trên MovPey.`,
      url: countryUrl,
      siteName: "MovPey",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: `${siteUrl}/logo.svg`,
          width: 1200,
          height: 630,
          alt: `Phim ${countryName} - MovPey`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Phim ${countryName} - Xem phim ${countryName} Vietsub | MovPey`,
      description: `Kho phim ${countryName} full HD Vietsub, thuyết minh, cập nhật liên tục trên MovPey.`,
      images: [`${siteUrl}/logo.svg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

 