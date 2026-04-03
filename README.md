# Educational Games

A multi-game web app built with React + Vite, designed for GitHub Pages deployment.

## Project structure

- `src/SiteApp.jsx` - landing page and route selection shell
- `src/games/` - each game in its own subfolder
  - `src/games/geo-quiz/GeoQuizGame.jsx` - Geo Quiz entry
- `src/App.jsx` - current Geo Quiz implementation

## Run locally

```bash
npm install
npm run dev
```

Open the app and choose a game from the landing page.

## Routes

- `#/` - game library landing page
- `#/games/geo-quiz` - Geo Quiz

Hash routes are used so deep links work on GitHub Pages.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml` to deploy automatically.

1. Push to `main`
2. In GitHub repo settings:
   - Go to **Pages**
   - Set **Source** to **GitHub Actions**
3. The workflow will build and publish the `dist/` output
