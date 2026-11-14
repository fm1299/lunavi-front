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
| `src/components/Coverage.tsx` | The analog portfolio and the gap map |
| `src/components/MethodView.tsx` | Formulas, sources and the limits statement |
| `src/i18n.ts` | Spanish and English texts. The English text is the key, so add a line to `ES` for each new text |

## How to read the map

Color is the score, on a colorblind-safe viridis scale stretched over the scores on screen. Opacity is confidence. Gray cells fail the vegetation gate. Pins are documented analogs.

## Language and export

The ES and EN buttons in the top bar switch the language, and the choice is remembered. Above the ranked list, CSV downloads the list from the API's `/export`, and PDF opens the print dialog with only the list on the page, so choose "Save as PDF" there.

## Access, portfolio and gaps

The Score and Access buttons in the map legend switch what the color shows. Access is how close a cell is to a road and an airport, and it never changes the score. Above the results, Portfolio lists the fewest cells that together cover the site's conditions, with numbered pins on the map, and Gaps shows which conditions no documented analog covers.
