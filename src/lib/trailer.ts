/**
 * Trailer/sắp chiếu detector.
 * Mục tiêu: loại bỏ phim ở trạng thái "Trailer" hoặc "Sắp chiếu" khỏi các danh mục.
 */
export function isTrailerEpisode(episode?: string | null): boolean {
  if (!episode) return false;

  const raw = String(episode).trim();
  if (!raw) return false;

  // Normalize Vietnamese diacritics so we can match "sắp chiếu" even if input loses accents.
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return (
    normalized.includes("trailer") ||
    normalized.includes("sap chieu") ||
    normalized.includes("sap-chieu")
  );
}

