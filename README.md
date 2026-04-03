# GeoQuiz

An interactive geography quiz game built with React, TypeScript, and D3.js.

## How to Play

You are shown either a **country's flag** or a **capital city name**, and you have to click on the correct country on the world map.

### Game Modes

- **Mixed** — randomly alternates between flag and capital questions
- **Flag** — identify countries by their flags
- **Capital** — locate countries by their capital cities

### Controls

- **Click** a country on the map to answer
- **Skip** to reveal the answer and move on
- **Zoom** in/out with the controls or scroll wheel
- **Pan** by clicking and dragging the map

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [D3.js](https://d3js.org/) for map projection and rendering
- [Vite](https://vite.dev/) for build tooling
- [Natural Earth](https://www.naturalearthdata.com/) world topology via [world-atlas](https://github.com/topojson/world-atlas)
- [flagcdn.com](https://flagcdn.com/) for flag images
