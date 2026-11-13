# LUNAVI web app

Choose any location on the Moon or Mars, and see which places on Earth match it best. The app talks only to the API in [lunavi-back](https://github.com/fm1299/lunavi-back).

This branch is the base. The Findings and Validation views are on the `full-prototype` branch, ready to bring back.

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
| `src/components/SitePicker.tsx` | Moon and Mars maps for choosing a site |
| `src/components/GridMap.tsx` | Earth map with the score grid drawn on a canvas |
| `src/components/Controls.tsx` | Site values, purpose, weights, area, terrain and confidence controls |
| `src/components/RankedList.tsx` | Top analogs, spaced apart and linked to the map |
| `src/components/SiteSheet.tsx` | The full explanation of one Earth cell |
| `src/components/MethodView.tsx` | Formulas, sources and the limits statement |

## How to read the map

Color is the score, on a colorblind-safe viridis scale stretched over the scores on screen. Opacity is confidence. Gray cells fail the vegetation gate. Pins are documented analogs.
