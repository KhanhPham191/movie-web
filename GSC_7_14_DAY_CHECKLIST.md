# Google Search Console - 7 to 14 Day Monitoring Checklist

This checklist is for post-deploy SEO validation after sitemap split and canonical updates.

## Day 0 (immediately after deploy)

- Submit sitemap index in GSC:
  - `https://www.movpey.xyz/sitemap.xml`
- Verify child sitemaps are discovered:
  - `https://www.movpey.xyz/sitemap/static.xml`
  - `https://www.movpey.xyz/sitemap/movies.xml`
  - `https://www.movpey.xyz/sitemap/watch.xml`
- Run URL Inspection:
  - One movie detail URL (`/phim/...`)
  - One watch episode URL (`/xem-phim/...`)
  - One search URL with query (`/tim-kiem?q=...`) and confirm `noindex`.

## Day 1-3

- In GSC -> Sitemaps:
  - Check sitemap status is `Success` (no fetch/parsing errors).
  - Track submitted vs discovered URL counts for each child sitemap.
- In GSC -> Pages:
  - Confirm no sudden spike in `Duplicate, Google chose different canonical`.
  - Confirm no major increase in `Crawled - currently not indexed`.

## Day 4-7

- In GSC -> Crawl stats:
  - Check `By response` has no unusual growth of 4xx/5xx.
  - Check `By file type` XML crawl remains healthy.
- In GSC -> Search results (filter by page contains `/xem-phim/`):
  - Watch for growth in impressions and indexed episode pages.
- Validate canonical behavior manually:
  - `/the-loai/<slug>?page=2` has canonical to page 2.
  - `/quoc-gia/<slug>?page=2` has canonical to page 2.
  - `/danh-sach/<slug>?page=2` has canonical to page 2.

## Day 8-14

- Compare with baseline (before deploy):
  - Indexed pages count
  - `/xem-phim/` impressions and clicks
  - Crawl requests to sitemap and watch URLs
- Investigate if any of these warning signs appear:
  - New `Alternate page with proper canonical` surge on key listing pages
  - Flat or declining crawl on `/xem-phim/` despite sitemap submission
  - Persistent `Discovered - currently not indexed` on high-value watch URLs

## Suggested weekly KPI snapshot

- Total indexed pages
- Indexed `/xem-phim/` pages
- `/xem-phim/` impressions, clicks, CTR, average position
- Sitemaps submitted/discovered deltas
- Crawl errors (4xx/5xx) count
