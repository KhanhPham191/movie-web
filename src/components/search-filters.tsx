"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getAvailableGenres, getAvailableCountries } from "@/lib/api";

interface SearchFiltersProps {
  onSortChange: (sort: string) => void;
  onGenreChange: (genre: string) => void;
  onCountryChange: (country: string) => void;
  selectedSort: string;
  selectedGenre: string;
  selectedCountry: string;
}

const SORT_OPTIONS = [
  { label: "Mới cập nhật", value: "newest" },
  { label: "Tên (A-Z)", value: "name-asc" },
  { label: "Tên (Z-A)", value: "name-desc" },
];

export function SearchFilters({
  onSortChange,
  onGenreChange,
  onCountryChange,
  selectedSort,
  selectedGenre,
  selectedCountry,
}: SearchFiltersProps) {
  const [genres, setGenres] = useState<{ name: string; slug: string }[]>([]);
  const [countries, setCountries] = useState<{ name: string; slug: string }[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [genresData, countriesData] = await Promise.all([
          getAvailableGenres(),
          getAvailableCountries(),
        ]);
        setGenres(genresData);
        setCountries(countriesData);
      } catch {
        setGenres([]);
        setCountries([]);
      } finally {
        setLoadingGenres(false);
        setLoadingCountries(false);
      }
    };

    fetchFilters();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white/5 p-4 rounded-lg border border-white/10">
      {/* Sort Filter */}
      <div className="flex-1 relative">
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Sắp xếp
        </label>
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm outline-none focus:outline-none focus:border-white/40 transition-colors appearance-none pr-8"
          style={{ backgroundImage: 'none' }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Genre Filter */}
      <div className="flex-1 relative">
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Thể loại
        </label>
        <select
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm outline-none focus:outline-none focus:border-white/40 transition-colors appearance-none pr-8"
          disabled={loadingGenres}
        >
          <option value="">Tất cả thể loại</option>
          {genres.map((genre) => (
            <option key={genre.slug} value={genre.slug}>
              {genre.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Country Filter */}
      <div className="flex-1 relative">
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Quốc gia
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm outline-none focus:outline-none focus:border-white/40 transition-colors appearance-none pr-8"
          disabled={loadingCountries}
        >
          <option value="">Tất cả quốc gia</option>
          {countries.map((country) => (
            <option key={country.slug} value={country.slug}>
              {country.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
