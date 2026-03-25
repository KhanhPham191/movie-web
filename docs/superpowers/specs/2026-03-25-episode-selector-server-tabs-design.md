# EpisodeSelector Server Tabs UI Refactor (Design Spec)

## Context
The movie detail page at `src/app/phim/[slug]/page.tsx` renders `EpisodeSelector` from `src/components/episode-selector.tsx`.

`EpisodeSelector` shows two server-related UI regions on the same card surface:
1) Server selection tabs (e.g., Vietsub / Thuyet minh / Long tieng)
2) Episode grid for the selected server

Users report a visual issue: "UI is tangled / overlapping" when switching the server selection UI.

## Problem Statement
The current `EpisodeSelector` implementation:
- keeps animation styling and keyframe definition inside the render path (a `<style jsx global>` block)
- conditionally renders the episode region based on `currentServer`
- relies on internal state `selectedServerIndex` derived from `defaultServer`

When the component re-renders (e.g., after changing server selection or route params), the combination of conditional rendering + injected styles can cause visual overlap/tangling.

## Goals
1. Make the server selection UI stable (no overlapping pills/grid).
2. Separate responsibilities into smaller components to reduce render-time side effects:
   - `ServerTabs` renders only the server pills/tabs.
   - `EpisodeGrid` renders only the episode links grid for the selected server.
3. Remove `style jsx global` keyframe injection from render path and rely on a single global animation definition.
4. Ensure server switching remounts the episode grid to reset animation/layout cleanly.

## Non-Goals
1. No changes to the server/episode selection logic semantics (filtering and mapping remain equivalent).
2. No changes to `EpisodeSelector` URL generation for `?server=` (that is already functional).
3. No redesign of the `/xem-phim/...` watch page UI (only the `/phim/[slug]` selector card).

## UX Requirements
### Server Tabs
- Render server pills horizontally (`flex`, `overflow-x-auto`, `whitespace-nowrap`) with consistent height and spacing.
- Highlight the active server visually.
- Prevent layout shift / overlap by keeping tab items non-wrapping and container overflow constrained.

### Episode Grid
- Render episode links for the active server only.
- Use a stable wrapper and remount the grid when `currentServer.server_name` changes.
- Keep episode link styles consistent and avoid injecting keyframes per render.

## Component Breakdown (Proposed)
In `src/components/episode-selector.tsx`, split into:

1. `ServerTabs`
   - Props:
     - `servers: Server[]` (already filtered)
     - `selectedIndex: number`
     - `onSelect: (index: number) => void`
     - `movieName?: string` (for analytics only)
     - `movieSlug: string`
   - Responsibilities:
     - Render the pill tabs only.
     - On click: update local selection index and track analytics.

2. `EpisodeGrid`
   - Props:
     - `currentServer: Server`
     - `movieSlug: string`
     - `movieName?: string`
     - `getServerParam: (serverName: string) => string`
   - Responsibilities:
     - Render episode links only.
     - For each episode, build href:
       - `/xem-phim/${movieSlug}/${episode.slug}?server=${serverParam}` when `serverParam` exists
       - otherwise `/xem-phim/${movieSlug}/${episode.slug}`

## State and Synchronization
Current behavior:
- `selectedServerIndex` is initialized from `defaultServer` and never re-synced.

Change:
- Keep local state for `selectedServerIndex`.
- Add a `useEffect` to re-sync `selectedServerIndex` whenever `defaultServer` (prop) changes:
  - If `defaultServer` matches a known filtered server: select that index
  - Else keep the existing fallback priority (Vietsub first, then Long tieng, then Thuyet minh)

Rationale: avoids stale state leading to mismatched tab highlighting vs episode grid.

## Animation and Overlap Fix
Current issue candidate:
- `EpisodeGrid` defines keyframes via `<style jsx global>` inside a conditional render block.

Change:
- Remove the `<style jsx global>` block from the episode grid render.
- Ensure the `fadeInUp` keyframes referenced by episode link animations are defined once globally (already present in `src/app/globals.css`).
- Keep animations using the global `fadeInUp` definition and existing classnames (`animate-slide-up`, etc.).

Remount behavior:
- Wrap the episode grid in a keyed element:
  - `key={currentServer.server_name}`
- This forces React to reset the grid sub-tree when changing server tabs.

## Accessibility
- Tabs should be semantic:
  - `role="tablist"` for the tabs container
  - each pill as a `button` with `aria-selected={isActive}`
- Episode links remain `next/link` elements as currently.

## Error Handling
No new error handling; preserve the existing `filteredServers.length === 0` early return.

## Testing / Verification Plan
Manual checks (must pass):
1. On `/phim/[slug]` with multiple servers:
   - switch Vietsub <-> Thuyet minh tabs repeatedly
   - confirm episode grid updates cleanly and no overlap/tangling occurs
2. On both mobile and desktop breakpoints:
   - pill tabs must remain a single row (scrollable if needed)
   - episode grid must not overlap tabs
3. When `defaultServer` prop changes (via navigation):
   - active tab highlight matches the episode grid content

Regression checks:
1. Single-server movies: ensure the “FULL” card path is unchanged.
2. URL query generation: ensure links keep `?server=` behavior intact.

## Implementation Notes
Files likely to be touched:
- `src/components/episode-selector.tsx` (refactor into child components + remove injected `<style jsx global>`)
- Potentially `src/app/globals.css` (only if keyframes are missing; otherwise rely on existing `fadeInUp`)

