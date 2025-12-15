import { MovieSection } from "@/components/movie-section";
import { getFilmsByCountryMultiple, type FilmItem } from "@/lib/api";
import { filterChinaNonAnimation } from "@/lib/filters";

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

export async function TrungQuocSection() {
  try {
    // Giảm từ 2 pages xuống 1 page để tối ưu
    const trungQuoc = await getFilmsByCountryMultiple("trung-quoc", 1);
    const trungQuocFiltered = await filterChinaNonAnimation(trungQuoc);
    const desiredChinaCount = 10;
    const trungQuocSeen = new Set((trungQuocFiltered || []).map((m) => m.slug));
    const trungQuocDisplay: FilmItem[] = sortByModifiedDesc(trungQuocFiltered || []).slice(0, desiredChinaCount);

    if (trungQuocDisplay.length < desiredChinaCount) {
      for (const movie of sortByModifiedDesc(trungQuoc || [])) {
        if (!movie?.slug) continue;
        if (trungQuocSeen.has(movie.slug)) continue;
        trungQuocDisplay.push(movie);
        trungQuocSeen.add(movie.slug);
        if (trungQuocDisplay.length >= desiredChinaCount) break;
      }
    }

    if (trungQuocDisplay.length === 0) return <></>;

    return (
      <MovieSection
        title="Phim Trung Quốc"
        movies={trungQuocDisplay}
        href="/quoc-gia/trung-quoc"
        variant="portrait"
      />
    );
  } catch (error) {
    return <></>;
  }
}








