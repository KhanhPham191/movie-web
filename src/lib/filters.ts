import { getFilmDetail, type FilmItem } from "@/lib/api";

// Chuẩn hóa chuỗi: bỏ dấu + lowercase để so khớp mềm
function normalize(str?: string) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Kiểm tra 1 movie detail từ /api/film/{slug}:
// - group "Quốc gia" có "Trung Quốc"
// - group "Thể loại" KHÔNG chứa "Hoạt Hình"
function isChinaNonAnimationDetail(detail: any): boolean {
  if (!detail || !detail.category) return false;

  const groups = Object.values(detail.category as Record<string, any>);

  const quocGiaGroup = groups.find(
    (g: any) => g?.group?.name === "Quốc gia"
  ) as any;
  const theLoaiGroup = groups.find(
    (g: any) => g?.group?.name === "Thể loại"
  ) as any;

  const isChina =
    quocGiaGroup?.list?.some(
      (c: any) => normalize(c?.name) === "trung quoc"
    ) ?? false;

  const hasHoatHinh =
    theLoaiGroup?.list?.some((c: any) =>
      normalize(c?.name).includes("hoat hinh")
    ) ?? false;

  return isChina && !hasHoatHinh;
}

// Generic: kiểm tra detail có thuộc 1 trong các quốc gia cho phép & không Hoạt Hình
function isNonAnimationDetailForCountries(
  detail: any,
  allowedCountries: string[]
): boolean {
  if (!detail || !detail.category) return false;

  const groups = Object.values(detail.category as Record<string, any>);

  const quocGiaGroup = groups.find(
    (g: any) => g?.group?.name === "Quốc gia"
  ) as any;
  const theLoaiGroup = groups.find(
    (g: any) => g?.group?.name === "Thể loại"
  ) as any;

  const isAllowedCountry =
    quocGiaGroup?.list?.some((c: any) => {
      const name = normalize(c?.name);
      return allowedCountries.includes(name);
    }) ?? false;

  const hasHoatHinh =
    theLoaiGroup?.list?.some((c: any) =>
      normalize(c?.name).includes("hoat hinh")
    ) ?? false;

  return isAllowedCountry && !hasHoatHinh;
}

// Lọc danh sách FilmItem theo tiêu chí:
// - Trong detail /api/film/{slug} là phim Trung Quốc
// - Không có thể loại "Hoạt Hình"
export async function filterChinaNonAnimation(
  movies: FilmItem[]
): Promise<FilmItem[]> {
  const results = await Promise.all(
    (movies || []).map(async (movie) => {
      try {
        const detailRes = await getFilmDetail(movie.slug);
        const detail = detailRes?.movie;

        if (detail && isChinaNonAnimationDetail(detail)) {
          return movie;
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((m): m is FilmItem => m !== null);
}

// Lọc theo nhiều quốc gia cho phép, bỏ Hoạt Hình (dùng detail)
export async function filterNonAnimationByCountries(
  movies: FilmItem[],
  allowedCountries: string[]
): Promise<FilmItem[]> {
  const results = await Promise.all(
    (movies || []).map(async (movie) => {
      try {
        const detailRes = await getFilmDetail(movie.slug);
        const detail = detailRes?.movie;

        if (detail && isNonAnimationDetailForCountries(detail, allowedCountries)) {
          return movie;
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((m): m is FilmItem => m !== null);
}


