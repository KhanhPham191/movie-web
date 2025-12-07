# Script to add, commit and push changes
cd c:\Users\Admin\movie-web

# Add all changes including unstaged files
git add -A

# Commit with message
git commit -m "fix: correct backdropUrl fallback and request cache deletion timing

- Fix backdropUrl to use thumb_url as primary (landscape/backdrop)
- Fix posterUrl to use poster_url as primary (portrait/poster)  
- Fix request cache deletion to only occur after promise completion
- Move cache cleanup outside promise using .finally() to prevent race conditions
- Add support for Lồng tiếng server in episode selectors
- Optimize home page API calls with request caching and deduplication
- Remove ad block feature from iframe-player component"

# Push to remote
git push origin main

Write-Host "Done! Changes have been pushed to origin/main"
