"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/contexts/auth-context";

interface FavoriteMovieData {
  movie_slug: string;
  movie_name: string;
  movie_thumb: string;
  movie_poster?: string;
  movie_year?: number;
  movie_quality?: string;
  movie_type?: string;
}

interface FavoritesContextType {
  /** Set of favorited movie slugs */
  favoriteSlugs: Set<string>;
  isFavorited: (slug: string) => boolean;
  toggleFavorite: (data: FavoriteMovieData) => Promise<void>;
  isLoading: boolean;
  /** Trạng thái đang toggle của từng slug */
  pendingSlugs: Set<string>;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteSlugs: new Set(),
  isFavorited: () => false,
  toggleFavorite: async () => {},
  isLoading: false,
  pendingSlugs: new Set(),
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSlugs, setPendingSlugs] = useState<Set<string>>(new Set());
  const fetchedRef = useRef(false);

  // Fetch all favorite slugs when user logs in
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setFavoriteSlugs(new Set());
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);

    fetch("/movpey/favorites?mode=slugs")
      .then((r) => r.json())
      .then((data) => {
        if (data.slugs) {
          setFavoriteSlugs(new Set(data.slugs as string[]));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, authLoading]);

  const isFavorited = useCallback(
    (slug: string) => favoriteSlugs.has(slug),
    [favoriteSlugs]
  );

  const toggleFavorite = useCallback(
    async (data: FavoriteMovieData) => {
      if (!isAuthenticated) return;
      const { movie_slug } = data;
      if (pendingSlugs.has(movie_slug)) return;

      const wasAdded = favoriteSlugs.has(movie_slug);

      // Optimistic update
      setPendingSlugs((prev) => new Set(prev).add(movie_slug));
      setFavoriteSlugs((prev) => {
        const next = new Set(prev);
        if (wasAdded) next.delete(movie_slug);
        else next.add(movie_slug);
        return next;
      });

      try {
        if (wasAdded) {
          await fetch(`/movpey/favorites/${movie_slug}`, { method: "DELETE" });
        } else {
          await fetch("/movpey/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        }
      } catch {
        // Revert on error
        setFavoriteSlugs((prev) => {
          const next = new Set(prev);
          if (wasAdded) next.add(movie_slug);
          else next.delete(movie_slug);
          return next;
        });
      } finally {
        setPendingSlugs((prev) => {
          const next = new Set(prev);
          next.delete(movie_slug);
          return next;
        });
      }
    },
    [isAuthenticated, favoriteSlugs, pendingSlugs]
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteSlugs, isFavorited, toggleFavorite, isLoading, pendingSlugs }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
