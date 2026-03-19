export interface CurrentlyWatching {
  id: string;
  movie_slug: string;
  movie_name: string;
  movie_poster?: string;
  movie_thumb?: string;
  episode_slug?: string;
  episode_name?: string;
  watch_time: number;
  total_duration: number;
  updated_at: string;
}

export async function getCurrentlyWatching() {
  try {
    const res = await fetch("/movpey/watch-history?limit=10&completed=false");
    if (!res.ok) {
      return { data: [], error: null };
    }
    const { items } = await res.json();
    const mapped: CurrentlyWatching[] = (items || []).map((item: any) => ({
      id: item.id,
      movie_slug: item.movie_slug,
      movie_name: item.movie_name,
      movie_poster: item.movie_poster,
      movie_thumb: item.movie_thumb,
      episode_slug: item.episode_slug,
      episode_name: item.episode_name,
      watch_time: item.watch_time,
      total_duration: item.total_duration,
      updated_at: item.watched_at,
    }));
    return { data: mapped, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}
