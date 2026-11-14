# LUNAVI web app

Choose any location on the Moon or Mars, and see which places on Earth match it best. The app talks only to the API in [lunavi-back](https://github.com/fm1299/lunavi-back).

This branch is the base. The Findings and Validation views are on the `full-prototype` branch, ready to bring back.

## Run it

Start the API first (see the lunavi-back README), then:

```powershell
npm install
npm run dev     # http://localhost:5173
```

To use an API somewhere else, copy `.env.example` to `.env` and set `VITE_API_URL`. The API must allow that origin through `LUNAVI_CORS_ORIGINS`. Production builds use `.env.production`, which points at `/api` on the same server; deployment is described in lunavi-back's `deploy/README.md`.

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
| `src/components/AskBox.tsx` | The question in plain words, shown when the API has a language model |
| `src/components/SearchSentence.tsx` | The search as one sentence whose words are the controls |
| `src/components/Answer.tsx` | The short answer above the list, and one-touch ways to refine the search |
| `src/components/SearchSettings.tsx` | Three folded sections: the site's values and sources, feature weights, and the area, terrain and confidence filters |
| `src/components/ui/` | shadcn/ui components (button, input, select, tabs, accordion, slider, badge, card) on Radix and Tailwind |
| `src/index.css` | Tailwind and the design tokens. It also loads `styles.css`, which still styles the map, site picker, site sheet and method page |
| `src/components/RankedList.tsx` | Top analogs, spaced apart and linked to the map |
| `src/components/SiteSheet.tsx` | The full explanation of one Earth cell |
| `src/components/Coverage.tsx` | The analog portfolio and the gap map |
| `src/components/MethodView.tsx` | Formulas, sources and the limits statement |
| `src/i18n.ts` | Spanish and English texts. The English text is the key, so add a line to `ES` for each new text |

## Search in plain words

The left column reads top to bottom: a question, the search as a sentence, a short answer, and the list.

- **Question.** Type what you are looking for, or pick an idea. The API's language model turns it into search settings (spec FR-AI2). The box only appears when the API reports a model in `/meta`; see the lunavi-back README for the key it needs.
- **Sentence.** "I'm looking for places in *South America* similar to *Jezero crater* for *rover mobility*, giving more weight to *mean temperature*, on *any* terrain." Each word is a control, and the words a question filled in are highlighted. It works with no model at all. "Back to the previous search" undoes the last change.
- **Answer.** Written from the numbers of the best results, and written again whenever the search changes. With no model, the app writes it from the same facts. The buttons under it refine the search with one touch.
- **Folded sections.** Under the list: "Values at this site" (each value, its source and whether it is measured, from literature or physical), "Feature weights" (the sliders) and "Area, terrain and confidence" (preset or drawn area, terrain classes, minimum confidence). They stay in step with the sentence, and a badge on each title says when something in it stands out.

Giving a feature more weight sets its slider to 4. The language model never sees or changes a score.

## Components

New parts of the interface use [shadcn/ui](https://ui.shadcn.com/) components, kept as source in `src/components/ui`, with Tailwind CSS v4 and Radix. `components.json` is in place, so `npx shadcn@latest add <component>` adds more. Colors come from the `@theme` block in `src/index.css`. Tailwind's reset layer is left out on purpose, because `styles.css` expects the browser defaults.

## How to read the map

Color is the score, on a colorblind-safe viridis scale stretched over the scores on screen. Opacity is confidence. Gray cells fail the vegetation gate. Numbered pins are the first ten places of the list, and plain pins are documented analogs.

## Language and export

The ES and EN buttons in the top bar switch the language, and the choice is remembered. Above the ranked list, CSV downloads the list from the API's `/export`, and PDF opens the print dialog with only the list on the page, so choose "Save as PDF" there.

## Access, portfolio and gaps

The Score and Access buttons in the map legend switch what the color shows. Access is how close a cell is to a road and an airport, and it never changes the score. Above the results, Portfolio lists the fewest cells that together cover the site's conditions, with numbered pins on the map, and Gaps shows which conditions no documented analog covers.
