/**
 * Spanish and English (spec FR-W14). The English text is the key, so t("Reset") reads as plain
 * English in the code, and a text with no Spanish entry falls back to English.
 * Labels that come from the API (features, purposes, test tags, areas) go through t() as well.
 * shortcut: per-value notes, source names and country names stay in English,
 * translate them in the API if the team needs them.
 */
export type Lang = "en" | "es";

const STORAGE_KEY = "lunavi-lang";

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "es") return saved;
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

let lang: Lang = initialLang();
document.documentElement.lang = lang;

export const getLang = (): Lang => lang;

/** The caller re-renders the app afterward; App keeps the language in its state for that. */
export function setLang(next: Lang) {
  lang = next;
  localStorage.setItem(STORAGE_KEY, next);
  document.documentElement.lang = next;
}

export const numberLocale = (): string => (lang === "es" ? "es-PE" : "en-US");

/** Translate a text, then fill {name} placeholders. */
export function t(text: string, vars?: Record<string, string | number>): string {
  let out = lang === "es" ? (ES[text] ?? text) : text;
  for (const [key, value] of Object.entries(vars ?? {})) out = out.replaceAll(`{${key}}`, String(value));
  return out;
}

const ES: Record<string, string> = {
  // Shell
  "LUNAVI can't reach its API": "LUNAVI no puede conectarse con su API",
  "Start it from lunavi-back with": "Iníciala desde lunavi-back con",
  ", then reload this page.": ", y luego recarga esta página.",
  "Loading LUNAVI…": "Cargando LUNAVI…",
  "Earth analogs of the Moon and Mars": "Análogos terrestres de la Luna y Marte",
  Views: "Vistas",
  "Find analogs": "Buscar análogos",
  Method: "Método",
  Language: "Idioma",
  "Dummy data, not real results": "Datos de prueba, no son resultados reales",
  "Prototype on open data": "Prototipo con datos abiertos",
  "Could not load results: {error}": "No se pudieron cargar los resultados: {error}",
  "Could not load this cell: {error}": "No se pudo cargar esta celda: {error}",
  "LUNAVI screens and prioritizes candidate regions using open data. It does not replace field geology and does not reproduce lunar or Martian physics such as vacuum or radiation.":
    "LUNAVI criba y prioriza regiones candidatas con datos abiertos. No reemplaza la geología de campo ni reproduce la física lunar o marciana, como el vacío o la radiación.",

  // Bodies, bases, bands, terrain
  Moon: "Luna",
  Mars: "Marte",
  measured: "medido",
  literature: "bibliografía",
  physical: "físico",
  "From an instrument": "De un instrumento",
  "From a published value or model, so it carries lower quality":
    "De un valor publicado o un modelo, por eso tiene menor calidad",
  "Follows directly from the body": "Se deduce directamente del cuerpo",
  High: "alta",
  Medium: "media",
  Low: "baja",
  "{band} confidence": "Confianza {band}",
  "Desert and arid": "Desierto y árido",
  Polar: "Polar",
  Volcanic: "Volcánico",
  Other: "Otros",
  arid: "árido",
  polar: "polar",
  volcanic: "volcánico",
  other: "otros",

  // Features
  Slope: "Pendiente",
  Roughness: "Rugosidad",
  "Annual temperature range": "Rango anual de temperatura",
  "Day-night temperature range": "Rango de temperatura día-noche",
  "Mean temperature": "Temperatura media",
  Precipitation: "Precipitación",
  "Vegetation (max NDVI)": "Vegetación (NDVI máximo)",
  Composition: "Composición",
  Elevation: "Elevación",
  basaltic: "basáltica",
  felsic: "félsica",
  sedimentary: "sedimentaria",
  evaporite: "evaporita",
  "mm/yr": "mm/año",
  "no data yet": "sin datos aún",
  "Regional terrain at a baseline of about 500 m, averaged over the cell. Not a landing or driving safety assessment.":
    "Terreno regional con una línea base de unos 500 m, promediado en la celda. No es una evaluación de seguridad para aterrizar o conducir.",

  // Purposes and their test tags
  "Rover mobility": "Movilidad de rover",
  "Habitat and thermal stress": "Hábitat y estrés térmico",
  "Ice and water": "Hielo y agua",
  "Dust and regolith": "Polvo y regolito",
  "Landing site": "Sitio de aterrizaje",
  "Traction and wheel wear": "Tracción y desgaste de ruedas",
  "Autonomous navigation": "Navegación autónoma",
  "Sampling operations": "Operaciones de muestreo",
  "Thermal control": "Control térmico",
  "Power and insulation cycling": "Ciclos de energía y aislamiento",
  "Long-duration exposure": "Exposición de larga duración",
  "Ground-ice radar": "Radar de hielo subterráneo",
  "Drilling and coring": "Perforación y extracción de núcleos",
  "Volatile handling": "Manejo de volátiles",
  "Dust mitigation": "Mitigación de polvo",
  "Abrasion on seals": "Abrasión en sellos",
  "Regolith handling": "Manejo de regolito",
  "Landing hazard detection": "Detección de peligros al aterrizar",
  "Terrain-relative navigation": "Navegación relativa al terreno",
  "Plume and surface interaction": "Interacción del chorro con la superficie",

  // Earth areas
  "Whole Earth": "Toda la Tierra",
  Africa: "África",
  Antarctica: "Antártida",
  Asia: "Asia",
  "Australia and Oceania": "Australia y Oceanía",
  Europe: "Europa",
  "North America": "Norteamérica",
  "South America": "Sudamérica",

  // Preset sites
  "Shackleton Connecting Ridge": "Cresta de conexión de Shackleton",
  "Jezero crater": "Cráter Jezero",
  "Ridge between Shackleton and de Gerlache craters at the lunar south pole. A representative site for a future Moon base, not a declared base location and not an Artemis III region. No feature here captures the low sun or permanent shadow that define the pole.":
    "Cresta entre los cráteres Shackleton y de Gerlache, en el polo sur lunar. Es un sitio representativo de una futura base lunar, no una ubicación de base declarada ni una región de Artemis III. Ninguna variable capta el sol bajo ni la sombra permanente que definen el polo.",
  "Northern plain with shallow water ice. NASA JPL calls it the most tempting target in the northern hemisphere. The coordinates are a representative point in the plain, not a selected landing site.":
    "Llanura del norte con hielo de agua a poca profundidad. NASA JPL la llama el objetivo más tentador del hemisferio norte. Las coordenadas son un punto representativo de la llanura, no un sitio de aterrizaje elegido.",
  "Crater with an ancient river delta, where Perseverance landed in 2021 at Octavia E. Butler Landing. It is not a future site. It stays as a well-studied reference that anchors the demo.":
    "Cráter con un antiguo delta fluvial, donde Perseverance aterrizó en 2021 en Octavia E. Butler Landing. No es un sitio futuro. Se mantiene como referencia bien estudiada que ancla la demo.",

  // Controls
  "Search settings": "Ajustes de búsqueda",
  "Change site": "Cambiar sitio",
  "Reading temperature from the Mars Climate Database…": "Leyendo la temperatura de la Mars Climate Database…",
  "Temperature could not be read right now, so those values are blank.":
    "No se pudo leer la temperatura por ahora, así que esos valores quedan en blanco.",
  "Values at this site": "Valores de este sitio",
  "Outside the Earth range, so a cell can only be as close as Earth gets":
    "Fuera del rango terrestre, así que una celda solo puede acercarse tanto como lo permita la Tierra",
  "beyond Earth": "más allá de la Tierra",
  "Blank values are left out of the score and lower confidence. Event data can fill them later.":
    "Los valores en blanco quedan fuera del puntaje y bajan la confianza. Los datos del evento pueden completarlos después.",
  "of the active weight rests on values beyond Earth's range.":
    "del peso activo recae en valores fuera del rango terrestre.",
  "Research purpose": "Propósito de investigación",
  "Feature weights": "Pesos por variable",
  Reset: "Restablecer",
  "The vegetation gate stays on at any weight, so forests never rank as analogs.":
    "El filtro de vegetación sigue activo con cualquier peso, así que los bosques nunca aparecen como análogos.",
  "Earth area": "Zona de la Tierra",
  "Drawn area": "Zona dibujada",
  "Drag on map": "Arrastra en el mapa",
  Draw: "Dibujar",
  Terrain: "Terreno",
  "Minimum confidence": "Confianza mínima",

  // Map
  "Map of Earth cells colored by analog score": "Mapa de celdas de la Tierra coloreadas por puntaje de análogo",
  Score: "Puntaje",
  "Score {score}": "Puntaje {score}",
  "Vegetation gate": "Filtro de vegetación",
  "Confidence {percent}%": "Confianza {percent}%",
  "Brighter cells are more similar. Faint cells have lower confidence. Pins are documented analogs.":
    "Las celdas más brillantes son más similares. Las tenues tienen menor confianza. Los pines son análogos documentados.",

  // Ranked list and export
  Results: "Resultados",
  "Top Earth analogs": "Mejores análogos terrestres",
  "from {count} eligible cells": "de {count} celdas elegibles",
  "The best cell in each area, at least 300 km apart, so each row is a different place.":
    "La mejor celda de cada zona, a 300 km o más entre sí, para que cada fila sea un lugar distinto.",
  "No cells match these filters. Try a wider area or lower confidence.":
    "Ninguna celda cumple estos filtros. Prueba una zona más amplia o una confianza menor.",
  "Unnamed area": "Zona sin nombre",
  "Export the shortlist": "Exportar la lista corta",
  "Download this list as a CSV file": "Descargar esta lista como archivo CSV",
  "Print this list, or save it as a PDF": "Imprimir esta lista o guardarla como PDF",
  "Earth analogs of {site}, for {purpose}": "Análogos terrestres de {site}, para {purpose}",

  // Access, portfolio and gaps
  "Map layer": "Capa del mapa",
  Access: "Acceso",
  Remote: "Remoto",
  "Easy to reach": "Fácil de llegar",
  "Brighter cells are closer to a road and an airport. Access never changes the score.":
    "Las celdas más brillantes están más cerca de una carretera y de un aeropuerto. El acceso nunca cambia el puntaje.",
  "Access {percent}%": "Acceso {percent}%",
  "{road} km to a road and {airport} km to an airport, in a straight line.":
    "{road} km a una carretera y {airport} km a un aeropuerto, en línea recta.",
  List: "Lista",
  Portfolio: "Portafolio",
  Gaps: "Vacíos",
  "Loading…": "Cargando…",
  "The fewest cells that together cover this site's weighted conditions. A cell covers a condition at {percent}% similarity or more. Numbered pins show them on the map.":
    "El menor grupo de celdas que, juntas, cubren las condiciones con peso de este sitio. Una celda cubre una condición con {percent}% de similitud o más. Los pines numerados las muestran en el mapa.",
  "No cell covers any condition with these filters.": "Ninguna celda cubre alguna condición con estos filtros.",
  "Covers:": "Cubre:",
  "Not covered by any cell:": "Ninguna celda cubre:",
  "For each condition of this site, whether a documented analog matches it at {percent}% similarity or more. A gap is a condition that no documented analog reproduces.":
    "Para cada condición de este sitio, si algún análogo documentado la iguala con {percent}% de similitud o más. Un vacío es una condición que ningún análogo documentado reproduce.",
  "{count} documented analogs lie in the Earth table.": "{count} análogos documentados están en la tabla de la Tierra.",
  Condition: "Condición",
  Status: "Estado",
  "Closest analog": "Análogo más cercano",
  Covered: "Cubierta",
  Gap: "Vacío",
  "Cannot be judged": "No se puede evaluar",

  // Site sheet
  "← Back to list": "← Volver a la lista",
  "Loading site sheet…": "Cargando la ficha de sitio…",
  "Candidate compared with {name}": "Candidato comparado con {name}",
  "This cell": "Esta celda",
  None: "Ninguna",
  "of 100, compared with {name}": "de 100, comparado con {name}",
  "This cell does not meet any terrain class, so it is outside the ranking.":
    "Esta celda no cumple ninguna clase de terreno, así que queda fuera del ordenamiento.",
  "Score 0: this cell fails the vegetation gate, so it is too green to be an analog.":
    "Puntaje 0: esta celda no pasa el filtro de vegetación; es demasiado verde para ser un análogo.",
  "Closest matches": "Mejores coincidencias",
  "Weakest matches": "Peores coincidencias",
  "No data yet:": "Sin datos aún:",
  "These are left out of the score and lower confidence. Event data can fill them later.":
    "Quedan fuera del puntaje y bajan la confianza. Los datos del evento pueden completarlas después.",
  Breakdown: "Desglose",
  "weight {weight}": "peso {weight}",
  "Cell {value}": "Celda {value}",
  "Site {value}": "Sitio {value}",
  "Beyond Earth: this is only as close as Earth gets.":
    "Más allá de la Tierra: esto es lo más cerca que llega la Tierra.",
  "Other values for this cell": "Otros valores de esta celda",
  "What to test here": "Qué probar aquí",
  "Earth data sources": "Fuentes de datos de la Tierra",
  "Site data sources": "Fuentes de datos del sitio",

  // Site picker
  "Choose a site": "Elegir un sitio",
  Cancel: "Cancelar",
  "Click anywhere on the map or type coordinates. LUNAVI reads about {km} km around that point, then ranks every Earth cell against it.":
    "Haz clic en cualquier punto del mapa o escribe coordenadas. LUNAVI lee unos {km} km alrededor de ese punto y luego ordena cada celda de la Tierra frente a él.",
  Body: "Cuerpo",
  Latitude: "Latitud",
  Longitude: "Longitud",
  "Latitude runs from -90 to 90, and longitude from -180 to 180.":
    "La latitud va de -90 a 90, y la longitud de -180 a 180.",
  "{coord}, east positive": "{coord}, este positivo",
  "Reading this location…": "Leyendo esta ubicación…",
  "Find Earth analogs": "Buscar análogos terrestres",
  "Reading LOLA elevation and Diviner temperature. This can take up to half a minute the first time.":
    "Leyendo la elevación de LOLA y la temperatura de Diviner. La primera vez puede tardar hasta medio minuto.",
  "Reading MOLA elevation. Temperature follows from the Mars Climate Database.":
    "Leyendo la elevación de MOLA. La temperatura llega después desde la Mars Climate Database.",
  "Could not read this location: {error}": "No se pudo leer esta ubicación: {error}",
  "Or start from a preset": "O empieza con un sitio predefinido",
  "Map of the Moon": "Mapa de la Luna",
  "Map of Mars": "Mapa de Marte",

  // Method page
  "How it works": "Cómo funciona",
  "Choose a site.": "Elige un sitio.",
  "Pick a Moon or Mars location. LUNAVI reads about {km} km around it from open data, measuring terrain the same way as on Earth.":
    "Elige una ubicación de la Luna o Marte. LUNAVI lee unos {km} km a su alrededor desde datos abiertos y mide el terreno igual que en la Tierra.",
  "Normalize.": "Normaliza.",
  "Each value becomes a number from 0 to 1 over the Earth range for that feature:":
    "Cada valor se convierte en un número de 0 a 1 sobre el rango terrestre de esa variable:",
  "Compare.": "Compara.",
  "Similarity to the site is": "La similitud con el sitio es",
  "Composition uses a similarity matrix between rock classes.":
    "La composición usa una matriz de similitud entre clases de roca.",
  "Combine.": "Combina.",
  ", with weights from the research purpose. A feature missing on either side leaves both sums.":
    ", con los pesos del propósito de investigación. Una variable que falta en cualquiera de los dos lados sale de ambas sumas.",
  "Veto.": "Veta.",
  "Cells that fail the vegetation gate score 0, whatever the weights.":
    "Las celdas que no pasan el filtro de vegetación obtienen puntaje 0, sin importar los pesos.",
  "Rate confidence.": "Califica la confianza.",
  "q = source × resolution × (1 − gaps) × site quality": "q = fuente × resolución × (1 − vacíos) × calidad del sitio",
  "Confidence is the weighted mean of q times the share of required features available. High is {high}% or above, medium is {medium}% or above.":
    "La confianza es la media ponderada de q por la fracción de variables requeridas disponibles. Alta desde {high}%, media desde {medium}%.",
  "Beyond Earth": "Más allá de la Tierra",
  'Some site values lie outside anything on Earth, such as the Moon\'s temperature. They are clamped to the Earth range, which means "as close as Earth gets". They are flagged wherever they appear, and they are never listed as a closest match.':
    'Algunos valores del sitio están fuera de todo lo que existe en la Tierra, como la temperatura de la Luna. Se recortan al rango terrestre, lo que significa "lo más cerca que llega la Tierra". Se marcan donde aparezcan y nunca figuran como mejor coincidencia.',
  "Which Earth cells are compared": "Qué celdas de la Tierra se comparan",
  "A land cell is ranked if it is arid, polar or near a Holocene volcano. Ice sheets are left out: they are not rock or regolith, and the elevation data records the bedrock under them. A documented ice-free site inside a coarse glacier polygon, such as the Antarctic Dry Valleys, stays in through a named exception.":
    "Una celda de tierra entra al ordenamiento si es árida, polar o está cerca de un volcán del Holoceno. Los mantos de hielo quedan fuera: no son roca ni regolito, y los datos de elevación registran el lecho rocoso bajo ellos. Un sitio documentado libre de hielo dentro de un polígono de glaciar poco detallado, como los Valles Secos de la Antártida, se conserva mediante una excepción con nombre.",
  "Missing values": "Valores faltantes",
  "A value with no source stays blank. It is left out of the score, it lowers confidence, and the app says so. The NASA and other agency data provided at the event can fill these in, one source at a time.":
    "Un valor sin fuente queda en blanco. Queda fuera del puntaje, baja la confianza y la app lo indica. Los datos de la NASA y de otras agencias entregados en el evento pueden completarlos, una fuente a la vez.",
  "Research purposes": "Propósitos de investigación",
  Purpose: "Propósito",
  Weights: "Pesos",
  "What to test": "Qué probar",
  "Earth data": "Datos de la Tierra",
  "{count} land cells at {degrees} degrees.": "{count} celdas de tierra a {degrees} grados.",
  Feature: "Variable",
  "Earth range": "Rango terrestre",
  Source: "Fuente",
  License: "Licencia",
  "{lo} to {hi} {unit}": "{lo} a {hi} {unit}",
  Classes: "Clases",
  "Land mask and countries from Natural Earth (public domain). Holocene volcanoes from the Smithsonian Global Volcanism Program. Earth base map from NASA GIBS. Moon and Mars base maps from NASA Trek.":
    "Máscara de tierra y países de Natural Earth (dominio público). Volcanes del Holoceno del Smithsonian Global Volcanism Program. Mapa base de la Tierra de NASA GIBS. Mapas base de la Luna y Marte de NASA Trek.",
  "Moon and Mars data": "Datos de la Luna y Marte",
  Values: "Valores",
  "Slope, roughness, elevation": "Pendiente, rugosidad, elevación",
  "LOLA global map": "Mapa global de LOLA",
  ", and the": ", y el",
  "LOLA polar map": "mapa polar de LOLA",
  "near the south pole": "cerca del polo sur",
  "MOLA global map": "Mapa global de MOLA",
  "Mean and day-night temperature": "Temperatura media y de día-noche",
  "Diviner global table": "Tabla global de Diviner",
  "(measured)": "(medido)",
  "(a model, so it counts as literature)": "(un modelo, por eso cuenta como bibliografía)",
  "No source yet outside the presets": "Sin fuente aún fuera de los sitios predefinidos",
  "No source yet": "Sin fuente aún",
};
