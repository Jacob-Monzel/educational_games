# Educational Games

A multi-game web app built with React + Vite, designed for GitHub Pages deployment.

## Project structure

- `src/SiteApp.jsx` - landing page and route selection shell
- `src/games/` - each game in its own subfolder
  - `src/games/geo-quiz/GeoQuizGame.jsx` - Geo Quiz entry
  - `src/games/relational-reasoning/RelationalReasoningGame.jsx` - SMART relational trainer entry
  - `src/games/street-stories/StreetStoriesManhattan.jsx` - Street Stories atlas entry
  - `src/games/street-stories/manhattanData.js` - curated Manhattan segment dataset + sources
- `src/App.jsx` - current Geo Quiz implementation
- `public/games/relational-reasoning/index.html` - standalone relational trainer page

## Run locally

```bash
npm install
npm run dev
```

Open the app and choose a game from the landing page.

## Routes

- `#/` - game library landing page
- `#/games/geo-quiz` - Geo Quiz
- `#/games/relational-reasoning` - SMART relational reasoning trainer
- `#/games/street-stories-manhattan` - Street Stories Manhattan atlas MVP

Hash routes are used so deep links work on GitHub Pages.

## Extending Street Stories data

The Manhattan MVP ships with a curated seed dataset in `src/games/street-stories/manhattanData.js`.

Each street segment can store:
- current name + corridor
- segment bounds (where that specific naming applies)
- alternate and former names
- origin summary
- timeline bullets
- confidence level + source links
- map geometry as a line (lon/lat coordinates)

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml` to deploy automatically.

1. Push to `main`
2. In GitHub repo settings:
   - Go to **Pages**
   - Set **Source** to **GitHub Actions**
3. The workflow will build and publish the `dist/` output
