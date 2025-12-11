import { getFilmDetail, type FilmItem } from "@/lib/api";

// Chuẩn hóa chuỗi: bỏ dấu + lowercase để so khớp mềm
function normalize(str?: string) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Lấy năm hiện tại theo UTC+7
function getCurrentYearUTC7(): number {
  const now = new Date();
  // UTC+7 offset: 7 * 60 * 60 * 1000 milliseconds
  const utc7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7Time.getUTCFullYear();
}

// Lấy năm phát hành từ category detail
// Kiểm tra trong category list, tìm group "Năm phát hành" (mục số 3 theo yêu cầu)
// CHỈ lấy từ category, KHÔNG fallback về created (vì created là năm thêm vào DB, không phải năm phát hành)
function getReleaseYearFromCategory(detail: any): number | null {
  if (!detail || !detail.category) {
    return null;
  }

  const groups = Object.values(detail.category as Record<string, any>);
  
  // Giảm log spam - chỉ log khi cần debug
  // if (groups.length > 0) {
  //   groups.forEach((g: any, idx: number) => {
  //   });
  // }

  // Tìm group "Năm phát hành" - thử nhiều cách:
  // 1. Tìm theo tên group có chứa "năm" và "phát hành"
  let namPhatHanhGroup = groups.find(
    (g: any) => {
      const groupName = normalize(g?.group?.name || "");
      return (groupName.includes("nam") && groupName.includes("phat hanh")) ||
             groupName.includes("nam phat hanh");
    }
  ) as any;

  // 2. Nếu không tìm thấy, thử lấy group thứ 3 (mục số 3 theo yêu cầu)
  if (!namPhatHanhGroup && groups.length >= 3) {
    namPhatHanhGroup = groups[2]; // Index 2 = mục số 3
  }

  // 3. Tìm trong tất cả groups xem có group nào có list chứa năm không
  if (!namPhatHanhGroup) {
    for (const group of groups) {
      if (group?.list && Array.isArray(group.list)) {
        // Kiểm tra xem có item nào là năm không
        const hasYear = group.list.some((item: any) => {
          const slug = item?.slug || "";
          const name = item?.name || "";
          return /^\d{4}$/.test(slug) || /\b(19|20)\d{2}\b/.test(name);
        });
        if (hasYear) {
          namPhatHanhGroup = group;
          break;
        }
      }
    }
  }

  if (namPhatHanhGroup?.list && Array.isArray(namPhatHanhGroup.list)) {
    // Lấy năm từ list
    const years = namPhatHanhGroup.list
      .map((item: any) => {
        // Thử parse từ slug trước (thường chính xác hơn)
        const slug = item?.slug || "";
        const slugYearMatch = slug.match(/^\d{4}$/);
        if (slugYearMatch) {
          const year = parseInt(slugYearMatch[0], 10);
          if (year >= 1900 && year <= 2100) {
            return year;
          }
        }
        
        // Nếu không có trong slug, thử parse từ name
        const name = item?.name || "";
        const nameYearMatch = name.match(/\b(19|20)\d{2}\b/);
        if (nameYearMatch) {
          const year = parseInt(nameYearMatch[0], 10);
          if (year >= 1900 && year <= 2100) {
            return year;
          }
        }
        
        return null;
      })
      .filter((y: number | null): y is number => y !== null && y >= 1900 && y <= 2100);

    if (years.length > 0) {
      // Trả về năm mới nhất từ list
      const maxYear = Math.max(...years);
      return maxYear;
    }
  }

  // KHÔNG fallback về created - chỉ lấy từ category
  // Nếu không tìm thấy năm trong category, return null để bỏ qua phim này
  return null;
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

// Lọc phim lẻ chỉ lấy những phim có năm phát hành = năm hiện tại (UTC+7)
// Kiểm tra năm phát hành từ category detail (mục số 3)
// Tối ưu: gọi API detail song song (parallel) với batch size để tránh quá tải và timeout
export async function filterPhimLeByCurrentYear(
  movies: FilmItem[],
  targetCount: number = 10
): Promise<FilmItem[]> {
  const currentYear = getCurrentYearUTC7();
  
  // Fetch nhiều phim hơn để có đủ sau khi filter (ước tính cần 3-4x số lượng target vì nhiều phim không có năm hoặc không phải năm hiện tại)
  const moviesToProcess = movies.slice(0, Math.min(movies.length, targetCount * 4));
  
  const results: FilmItem[] = [];
  const BATCH_SIZE = 5; // Gọi 5 API detail cùng lúc để tránh quá tải
  
  // Xử lý theo batch để gọi API song song
  for (let i = 0; i < moviesToProcess.length; i += BATCH_SIZE) {
    // Nếu đã đủ số lượng, dừng lại
    if (results.length >= targetCount) {
      break;
    }
    
    const batch = moviesToProcess.slice(i, i + BATCH_SIZE);
    
    // Gọi API detail song song cho batch này với timeout handling
    const batchResults = await Promise.allSettled(
      batch.map(async (movie) => {
        try {
          // Thêm timeout cho mỗi request (15 giây)
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 15000);
          });
          
          const detailPromise = getFilmDetail(movie.slug).then(res => res?.movie || null);
          
          const detail = await Promise.race([detailPromise, timeoutPromise]);
          
          if (!detail) {
            return null;
          }

          const releaseYear = getReleaseYearFromCategory(detail);
          
          if (releaseYear === null) {
            return null;
          }
          
          // Chỉ lấy phim có năm phát hành = năm hiện tại
          if (releaseYear === currentYear) {
            return movie;
          }
          
          return null;
        } catch (error) {
          // Không log từng lỗi để tránh spam, chỉ log tổng hợp
          return null;
        }
      })
    );
    
    // Lọc kết quả từ batch
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
        if (results.length >= targetCount) {
          break;
        }
      }
    }
  }

  return results;
}


