import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getNewlyUpdatedFilms, type FilmItem } from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

function normalizeRating(movie: FilmItem): number {
  const raw = movie.imdb ?? movie.tmdb ?? movie.vote_average;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function sortTrending(movies: FilmItem[]): FilmItem[] {
  return [...movies].sort((a, b) => {
    const ratingDelta = normalizeRating(b) - normalizeRating(a);
    if (Math.abs(ratingDelta) > 0.01) return ratingDelta;
    const timeA = a.modified ? new Date(a.modified).getTime() : 0;
    const timeB = b.modified ? new Date(b.modified).getTime() : 0;
    return timeB - timeA;
  });
}

export async function TrendingSection() {
  const res = await getNewlyUpdatedFilms(1).catch(() => ({
    status: "error",
    items: [],
  }));

  if (res.status === "error") return null;

  const candidates = (res.items || []).filter(
    (movie) => !isTrailerEpisode(movie.current_episode)
  );
  if (candidates.length === 0) return null;

  const trending = sortTrending(candidates).slice(0, 12);
  if (trending.length === 0) return null;

  return (
    <MovieSectionWithNav
      title="Đang thịnh hành"
      movies={trending}
      variant="newRelease"
      priorityCount={2}
    />
  );
}
