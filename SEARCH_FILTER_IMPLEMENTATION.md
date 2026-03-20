# Search Filter Feature Implementation Summary

## Changes Made

### 1. **API Functions** ([src/lib/api.ts](src/lib/api.ts))
Added a new function to dynamically fetch available countries from the OPhim API:
- `getAvailableCountries()` - Fetches list of countries/regions from `/v1/api/quoc-gia` endpoint
- Falls back to hardcoded list if API fails
- Mirrors the existing `getAvailableGenres()` function

### 2. **Search Filters Component** ([src/components/search-filters.tsx](src/components/search-filters.tsx))
Created a new reusable filter component with three filter options:
- **Sort**: Mới cập nhật (newest), Tên A-Z, Tên Z-A
- **Thể loại (Genre)**: Dynamically loaded from API with "Tất cả thể loại" (All genres) option
- **Quốc gia (Country)**: Dynamically loaded from API with "Tất cả quốc gia" (All countries) option

**Features:**
- Responsive design (stacks on mobile, horizontal on desktop)
- Loading states for async data
- Styled with glass morphism design matching your theme
- Uses ChevronDown icons for select elements

### 3. **Updated Search Page** ([src/app/tim-kiem/page.tsx](src/app/tim-kiem/page.tsx))
Enhanced the search page with filter functionality:

**Added:**
- Three state variables: `sort`, `genre`, `country`
- `getSortParams()` function to convert sort values to API parameters
- SearchFilters component integrated above search results
- Filter parameters passed to API calls (both initial and paginated requests)
- Updated useEffect dependency array to re-fetch when filters change

**API Parameters Used:**
```typescript
searchFilms(query, page, {
  sort_field: sortParams.sort_field,      // "modified.time" | "name"
  sort_type: sortParams.sort_type,        // "asc" | "desc"
  category: genre || undefined,           // Category slug
  country: country || undefined,          // Country slug
  limit: 20
})
```

## How It Works

1. User enters search query in the header search
2. On search page, filters appear below the heading
3. Selecting a filter instantly updates the results:
   - Filters are applied to both initial page and additional pages
   - Results re-rank based on relevance to the search query
4. All filters work together (e.g., can search for "phim" filtered by both country and category)

## API Endpoints Used

- `/v1/api/tim-kiem/{keyword}` - Search with filter parameters
- `/v1/api/the-loai` - Get all available categories
- `/v1/api/quoc-gia` - Get all available countries

## Styling
- Consistent with your existing theme
- Glass morphism background with white/5 opacity
- White text with proper contrast
- Responsive padding and spacing
- Disabled state for loading filters

## No Breaking Changes
- All existing search functionality preserved
- Filters are optional (empty string = no filter)
- Graceful fallback to hardcoded lists if API fails
- Backward compatible with current search logic
