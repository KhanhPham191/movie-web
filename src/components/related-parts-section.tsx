import { searchFilmsMerged, type FilmItem } from "@/lib/api";
import { RelatedPartLink } from "./related-part-link";

interface RelatedPartsSectionProps {
  movieSlug: string;
  movieName: string;
  baseMovieName: string;
}

async function getRelatedParts(baseMovieName: string, movieSlug: string): Promise<FilmItem[]> {
  // Only search if base name is meaningful
  if (!baseMovieName || baseMovieName.length < 3) {
    return [];
  }

  try {
    const searchResults = await searchFilmsMerged(baseMovieName);

    // Helper to extract base name from film name
    const getBaseName = (name: string): string => {
      let baseName = name
        .replace(/\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*-\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*:\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*\d+\s*$/, "")
        .replace(/\s*-\s*\d+\s*$/, "")
        .replace(/\s*:\s*\d+\s*$/, "")
        .replace(/\s*(II|III|IV|V|VI|VII|VIII|IX|X|2|3|4|5|6|7|8|9|10)+$/, "")
        .replace(/\s*-\s*(II|III|IV|V|VI|VII|VIII|IX|X|2|3|4|5|6|7|8|9|10)+$/, "")
        .trim();

      baseName = baseName.replace(/[:\-–—]\s*$/, "").trim();
      return baseName;
    };

    const relatedParts = searchResults
      .filter((m) => {
        const mBaseName = getBaseName(m.name);
        const normalizedBase = baseMovieName.toLowerCase().trim();
        const normalizedMBase = mBaseName.toLowerCase().trim();
        return normalizedMBase === normalizedBase && m.slug !== movieSlug;
      })
      .slice(0, 10);

    // Sort by name
    relatedParts.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    return relatedParts;
  } catch (error) {
    console.error("Error fetching related parts:", error);
    return [];
  }
}

export async function RelatedPartsSection({
  movieSlug,
  movieName,
  baseMovieName,
}: RelatedPartsSectionProps) {
  const relatedParts = await getRelatedParts(baseMovieName, movieSlug);

  if (relatedParts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4 animate-slide-up">
      {/* Premium Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-6 sm:h-7 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
          Các phần khác
        </h2>
        <span className="px-2 py-0.5 bg-[#F6C453]/10 border border-[#F6C453]/20 rounded-full text-[10px] text-[#F6C453] font-semibold">
          {relatedParts.length}
        </span>
      </div>

      {/* Grid responsive cho mobile, tablet và desktop */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {relatedParts.map((part) => (
          <RelatedPartLink
            key={part.slug}
            part={part}
            movieName={movieName}
            movieSlug={movieSlug}
          />
        ))}
      </div>
    </div>
  );
}
