# LUNAVI web app

Map, ranked list, site sheets, findings and validation for LUNAVI, which finds and ranks Earth analogs of Moon and Mars sites. It talks only to the API in [lunavi-back](https://github.com/fm1299/lunavi-back).

## Run it

Start the API first (see the lunavi-back README), then:

```powershell
npm install
npm run dev     # http://localhost:5173
```

To use an API somewhere else, copy `.env.example` to `.env` and set `VITE_API_URL`. The API must allow that origin through `LUNAVI_CORS_ORIGINS`.

```powershell
npm run check   # type-check
npm run build   # type-check and production build in dist/
```

## Layout

| Path | What it holds |
|---|---|
| `src/api.ts` | Every API call, and types that mirror the data contract |
| `src/App.tsx` | App state and layout |
| `src/components/GridMap.tsx` | Leaflet map with the score grid drawn on one canvas |
| `src/components/Controls.tsx` | Target, purpose, weights, area, terrain and confidence controls |
| `src/components/RankedList.tsx` | Top candidates, linked to the map |
| `src/components/SiteSheet.tsx` | The full explanation of one cell |
| `src/components/FindingsView.tsx` | Named findings and candidates awaiting a literature check |
| `src/components/ValidationView.tsx` | Controls, screening funnel and honest gaps |
| `src/components/MethodView.tsx` | Formulas, sources and the limits statement |

## How to read the map

Color is the score, on a colorblind-safe viridis scale stretched over the scores on screen. Opacity is confidence. Gray cells fail the vegetation gate.
