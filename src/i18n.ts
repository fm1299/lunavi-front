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
  "Lava tube or cave": "Tubo de lava o cueva",
  arid: "árido",
  polar: "polar",
  volcanic: "volcánico",
  other: "otros",
  cave: "cueva",

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
  "Construction and anchoring on regolith": "Construcción y anclaje sobre regolito",
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
  "Brighter cells are more similar. Faint cells have lower confidence. Numbered pins are the places in the list; plain pins are documented analogs.":
    "Las celdas más brillantes son más parecidas. Las celdas tenues tienen menor confianza. Los marcadores con número son los lugares de la lista; los simples son análogos documentados.",

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

  // Search in plain words (spec FR-AI2)
  "What place on Earth are you looking for?": "¿Qué lugar de la Tierra buscas?",
  "Write your question": "Escribe tu pregunta",
  "Say it in your own words…": "Dilo con tus palabras…",
  "Thinking…": "Pensando…",
  Search: "Buscar",
  "Or start from an idea": "O empieza con una idea",
  "Places in South America like Jezero but colder": "Lugares en Sudamérica parecidos a Jezero pero más fríos",
  "Where to test a habitat for the Moon's south pole base": "Dónde probar un hábitat para la base del polo sur de la Luna",
  "Polar places to practice drilling for ice, like Arcadia Planitia":
    "Lugares polares para practicar perforación de hielo, como Arcadia Planitia",
  "I could not turn that into a search, so nothing changed. Tell me which Moon or Mars site it should resemble and, if you like, where on Earth to look. You can also build the search yourself in the sentence below.":
    "No pude convertir eso en una búsqueda, así que no cambió nada. Dime a qué sitio de la Luna o Marte debe parecerse y, si quieres, en qué parte de la Tierra buscar. También puedes armar la búsqueda tú mismo en la frase de abajo.",
  "The language model did not answer, so nothing changed. Try again, or build the search in the sentence below.":
    "El modelo de lenguaje no respondió, así que no cambió nada. Intenta de nuevo o arma la búsqueda en la frase de abajo.",
  "I'm looking for places in {area} similar to {site} for {purpose}, giving more weight to {focus}, on {terrain} terrain.":
    "Busco lugares en {area} parecidos a {site} para {purpose}, con más peso en {focus}, en terreno {terrain}.",
  "the whole world": "todo el mundo",
  "the drawn area": "la zona dibujada",
  "what I set by hand": "lo que ajusté a mano",
  "nothing in particular": "nada en especial",
  any: "de cualquier tipo",
  "several kinds of": "de varios tipos",
  "another point on the map…": "otro punto del mapa…",
  "Moon or Mars site": "Sitio de la Luna o Marte",
  "Feature that matters most": "Variable con más peso",
  "This is what I understood. Touch a word to change it": "Esto entendí. Toca una palabra para cambiarla",
  "Your search. Touch a word to change it": "Tu búsqueda. Toca una palabra para cambiarla",
  "I could not use: {parts}. The rest was applied.": "No pude usar: {parts}. El resto sí se aplicó.",
  "Undo last change": "Deshacer último cambio",
  "Start over": "Empezar de nuevo",
  "No place passes these filters. Try a wider area or lower confidence.":
    "Ningún lugar pasa estos filtros. Prueba una zona más amplia o menos confianza.",
  "an unnamed area": "una zona sin nombre",
  "The closest match to {site} for {purpose} is in {country}, with {score} of 100 and {band} confidence.":
    "Lo más parecido a {site} para {purpose} está en {country}, con {score} de 100 y confianza {band}.",
  "Next comes {country}, with {score}.": "Le sigue {country}, con {score}.",
  "The best place matches most on {closest} and least on {weakest}.":
    "El mejor lugar se parece más en {closest} y menos en {weakest}.",
  "More importance went to {feature}, but Earth only comes as close as these places.":
    "Se dio más peso a {feature}, pero la Tierra solo se acerca hasta estos lugares.",
  "Writing the answer…": "Escribiendo la respuesta…",
  "Refine the search": "Afinar la búsqueda",
  "Written by AI ({model}) from the numbers in the list. It never changes a score.":
    "Escrito por IA ({model}) a partir de los números de la lista. Nunca cambia un puntaje.",
  "Written automatically from the numbers in the list.": "Escrito automáticamente a partir de los números de la lista.",
  "Only deserts": "Solo desiertos",
  "Search the whole Earth": "Buscar en toda la Tierra",
  "Make it drier": "Que sea más seco",
  "What about a landing site?": "¿Y para un sitio de aterrizaje?",
  "Matches on {closest} · differs on {weakest}": "Se parece en {closest} · difiere en {weakest}",
  "Matches on {closest}": "Se parece en {closest}",
  "Search and results": "Búsqueda y resultados",
  "Search in plain words": "Búsqueda con tus palabras",
  "You can describe what you are looking for in your own words. A free language model turns the request into the same settings the controls hold: a site, a purpose, one feature to give more importance to, an area and terrain. Anything it returns that is not a known site, purpose, feature or area is dropped and reported. A comparison such as \"colder\" gives that feature more importance; it is not a hard filter. The model also writes the short answer above the list from the numbers of the best results, and an answer that quotes any other number is discarded. The model never sees or changes a score: the ranking is always the same calculation.":
    "Puedes describir lo que buscas con tus palabras. Un modelo de lenguaje gratuito convierte el pedido en los mismos ajustes que tienen los controles: un sitio, un propósito, una variable con más peso, una zona y un terreno. Todo lo que devuelva y no sea un sitio, propósito, variable o zona conocidos se descarta y se informa. Una comparación como «más frío» le da más peso a esa variable; no es un filtro estricto. El modelo también escribe la respuesta corta sobre la lista a partir de los números de los mejores resultados, y una respuesta que cite cualquier otro número se descarta. El modelo nunca ve ni cambia un puntaje: el orden sale siempre del mismo cálculo.",
  "Model in use: {model}.": "Modelo en uso: {model}.",
  "No language model is set up right now, so the search is built by hand and the answer is written automatically.":
    "Ahora no hay un modelo de lenguaje configurado, así que la búsqueda se arma a mano y la respuesta se escribe automáticamente.",
  "{count} beyond Earth": "{count} más allá de la Tierra",
  "{count} with no data": "{count} sin datos",
  changed: "cambiados",
  "Area, terrain and confidence": "Zona, terreno y confianza",
  "confidence {percent}% or more": "confianza de {percent}% o más",

  // Process view
  Process: "Proceso",
  "Could not load the process: {error}": "No se pudo cargar el proceso: {error}",
  "Working out every step…": "Calculando cada paso…",
  "How LUNAVI finds Earth analogs": "Cómo LUNAVI encuentra análogos terrestres",
  "Every step from the whole Earth to a short list of named places, with the numbers of the current search. They are computed live from the same table and formulas as the ranking.":
    "Cada paso desde toda la Tierra hasta una lista corta de lugares con nombre, con los números de la búsqueda actual. Se calculan en vivo con la misma tabla y las mismas fórmulas del ordenamiento.",
  "custom weights": "pesos personalizados",
  "Screening funnel": "Embudo de cribado",
  "Cells left after each step (bars on a log scale).": "Celdas que quedan después de cada paso (barras en escala logarítmica).",
  "Land cells": "Celdas de tierra",
  "Alien-like terrain": "Terreno parecido a otro mundo",
  "Pass the vegetation veto": "Pasan el veto de vegetación",
  "Medium confidence or better": "Confianza media o mayor",
  "New (far from the catalog)": "Nuevas (lejos del catálogo)",
  "Candidates (top scores)": "Candidatas (mejores puntajes)",
  "Named findings": "Hallazgos con nombre",
  "Split the Earth into cells": "Dividir la Tierra en celdas",
  "The Earth is cut into squares of {deg}° (about 55 km) and only dry land is kept.":
    "La Tierra se parte en cuadros de {deg}° (unos 55 km) y se queda solo con tierra firme.",
  "A cell stays if at least {share}% of it is land.": "Una celda se queda si al menos el {share}% es tierra.",
  Countries: "Países",
  "Cell size": "Tamaño de celda",
  "Measure every cell": "Medir cada celda",
  "Each Earth cell gets its relief, climate, vegetation and rock class from open data.":
    "Cada celda de la Tierra obtiene su relieve, clima, vegetación y clase de roca a partir de datos abiertos.",
  "Cells with data": "Celdas con dato",
  "Earth range (1st to 99th percentile)": "Rango en la Tierra (percentil 1 a 99)",
  "no source yet": "sin fuente todavía",
  "Read the Moon or Mars site": "Leer el sitio de la Luna o Marte",
  "The same values are read for {site}, over a window of about {km} km.":
    "Se leen los mismos valores para {site}, en una ventana de unos {km} km.",
  "Each value carries its basis. A literature value counts {lit} in confidence; measured and physical values count {meas}.":
    "Cada valor lleva su base. Un valor de bibliografía vale {lit} en la confianza; los medidos y físicos valen {meas}.",
  "Site value": "Valor del sitio",
  Basis: "Base",
  "yes, clamped": "sí, recortado",
  "Put everything on the same scale": "Llevar todo a la misma escala",
  "Each value becomes a number from 0 to 1 inside the Earth range. A site value outside it is clamped and flagged beyond Earth.":
    "Cada valor se convierte en un número de 0 a 1 dentro del rango de la Tierra. Un valor del sitio fuera de ese rango se recorta y se marca como más allá de la Tierra.",
  "The table after step 5 shows lo, hi and the site's z for each feature.":
    "La tabla del paso 5 muestra lo, hi y la z del sitio para cada variable.",
  "Compare feature by feature": "Comparar variable por variable",
  "How close each Earth cell is to the site on each feature. Rock classes use a similarity matrix.":
    "Cuánto se parece cada celda de la Tierra al sitio en cada variable. Las clases de roca usan una matriz de similitud.",
  "Site z": "z del sitio",
  Weight: "Peso",
  "Median s (eligible cells)": "s mediana (celdas elegibles)",
  "Cells with s ≥ 0.8": "Celdas con s ≥ 0.8",
  matrix: "matriz",
  "veto if s < {gate}": "veto si s < {gate}",
  "veto < {gate}": "veto < {gate}",
  "Compute the score": "Calcular el puntaje",
  "The similarities are averaged with the weights of the purpose. A cell that fails the vegetation veto scores 0.":
    "Las similitudes se promedian con los pesos del propósito. Una celda que no pasa el veto de vegetación obtiene 0.",
  veto: "veto",
  "Vetoed (too green)": "Vetadas (demasiado verdes)",
  "Scored above 0": "Con puntaje mayor que 0",
  "Median score": "Puntaje mediano",
  "Top 10% from": "10% superior desde",
  "Top 1% from": "1% superior desde",
  "Best score": "Mejor puntaje",
  "Keep terrain that looks like another world": "Quedarse con terrenos parecidos a otro mundo",
  "Only arid, polar or volcanic cells are compared, plus cited exceptions and cells with documented caves.":
    "Solo se comparan celdas áridas, polares o volcánicas, más excepciones con cita y celdas con cuevas documentadas.",
  "Arid: under {mm} mm/year · Polar: latitude {lat}° or more · Volcanic: basalt or within {km} km of a Holocene volcano · Ice sheets out (over {ice}% ice)":
    "Árido: menos de {mm} mm/año · Polar: latitud de {lat}° o más · Volcánico: basalto o a menos de {km} km de un volcán del Holoceno · Mantos de hielo fuera (más de {ice}% de hielo)",
  "Eligible cells": "Celdas elegibles",
  "Exceptions with a citation": "Excepciones con cita",
  "Rate confidence": "Calcular la confianza",
  "How much to trust a score, from the quality of the data of the cell and of the site.":
    "Cuánto creerle a un puntaje, según la calidad de los datos de la celda y del sitio.",
  "share of features available": "fracción de variables disponibles",
  "High (≥ {v})": "Alta (≥ {v})",
  "Medium (≥ {v})": "Media (≥ {v})",
  "Decide whether it is new": "Decidir si es nueva",
  "The distance from each cell to the nearest site of our catalog of {n} documented analogs.":
    "La distancia de cada celda al sitio más cercano de nuestro catálogo de {n} análogos documentados.",
  "Known under {a} km · near a known one from {a} to {b} km · new beyond {b} km":
    "Conocida a menos de {a} km · cercana a una conocida entre {a} y {b} km · nueva a más de {b} km",
  Known: "Conocida",
  "Near a known one": "Cercana a una conocida",
  New: "Nueva",
  "\"New\" means not in our catalog, not \"never studied\". Counted among cells with medium confidence or better.":
    "«Nueva» significa que no está en nuestro catálogo, no que «nunca fue estudiada». Se cuenta entre celdas con confianza media o mayor.",
  "Propose candidates": "Proponer candidatas",
  "New cells with medium confidence or better and a score in the top {share}% are kept, and touching cells are joined into regions.":
    "Se conservan las celdas nuevas con confianza media o mayor y un puntaje en el {share}% superior, y las celdas vecinas se unen en regiones.",
  "Score of {cut} or more": "Puntaje de {cut} o más",
  "Candidate cells": "Celdas candidatas",
  Regions: "Regiones",
  "Best cell of the region": "Mejor celda de la región",
  Cells: "Celdas",
  "Nearest known analog": "Análogo conocido más cercano",
  "Check the literature and name them": "Revisar la bibliografía y nombrarlas",
  "Each candidate region is searched in the literature. If it is already documented as an analog it joins the catalog; if not, it becomes a named finding.":
    "Cada región candidata se busca en la bibliografía. Si ya está documentada como análogo, entra al catálogo; si no, se convierte en un hallazgo con nombre.",
  "No analog literature found": "Sin bibliografía como análogo",
  "Studied in another context": "Estudiada en otro contexto",
  "Already used as an analog": "Ya usada como análogo",
  "Findings were reviewed with this site's default purpose; scores below use it.":
    "Los hallazgos se revisaron con el propósito por defecto de este sitio; los puntajes de abajo lo usan.",
  "Only the preset sites have reviewed findings. Pick a preset to see them.":
    "Solo los sitios predefinidos tienen hallazgos revisados. Elige uno para verlos.",
  "Validate the method": "Validar el método",
  "Documented analogs should rank near the top and unlikely places (rainforest, farmland) in the lower half.":
    "Los análogos documentados deben quedar arriba y los lugares improbables (selva, cultivos) en la mitad inferior.",
  "Positive controls in the top {a}% · negative controls in the lower half":
    "Controles positivos en el {a}% superior · controles negativos en la mitad inferior",
  "Positive controls passed": "Controles positivos que pasan",
  "Negative controls low": "Controles negativos abajo",
  "Top 50 kept with weights ±20%": "Top 50 que se mantiene con pesos ±20%",
  Control: "Control",
  "Ranks in the top": "Queda en el top",
  Result: "Resultado",
  "not comparable": "no comparable",
  passes: "pasa",
  "below target": "bajo la meta",
  "lower half": "mitad inferior",
  "ranks too high": "queda muy arriba",
  vetoed: "vetada",
  "Validation uses this site's default purpose.": "La validación usa el propósito por defecto de este sitio.",
  "Controls are assigned to the preset sites. Pick a preset to see the validation.":
    "Los controles están asignados a los sitios predefinidos. Elige uno para ver la validación.",
  "Worked example: the best cell": "Ejemplo resuelto: la mejor celda",
  "compared with {site}, term by term.": "comparada con {site}, término por término.",
  Site: "Sitio",
  Cell: "Celda",
  site: "sitio",
  cell: "celda",
  Confidence: "Confianza",

  // Beyond-Earth mode, findings and fieldwork restrictions
  "Values beyond Earth's range": "Valores fuera del rango terrestre",
  "Leave them out": "Dejarlos fuera",
  "Count them at Earth's edge": "Contarlos en el borde terrestre",
  "Left out of the score: {features}. No place on Earth reaches these values, so test them in a thermal vacuum chamber, not in the field.": "Fuera del puntaje: {features}. Ningún lugar de la Tierra alcanza estos valores: pruébalos en una cámara de vacío térmico, no en campo.",
  "Beyond Earth, left out of the score": "Más allá de la Tierra, fuera del puntaje",
  "No place on Earth reaches these values: test them in a thermal vacuum chamber.": "Ningún lugar de la Tierra alcanza estos valores: pruébalos en una cámara de vacío térmico.",
  "Conflict or Do Not Travel": "Conflicto o No viajar",
  "Legally restricted": "Restringido por ley",
  "Permit required": "Requiere permiso",
  "A planning label: it never changes the analog score.": "Etiqueta de planificación: nunca cambia el puntaje del análogo.",
  "Leave out places where fieldwork is": "Excluir lugares con trabajo de campo en",
  "A planning filter: it never changes a score.": "Filtro de planificación: nunca cambia un puntaje.",
  "Which places to show": "Qué lugares mostrar",
  "All places": "Todos los lugares",
  "Only new places": "Solo lugares nuevos",
  "New places lie more than {km} km from every documented analog. They are candidates for this search, not yet checked in the literature.":
    "Los lugares nuevos están a más de {km} km de todo análogo documentado. Son candidatos para esta búsqueda, aún sin revisar en la literatura.",
  "New place": "Lugar nuevo",
  "Far from every documented analog: a candidate, not yet checked in the literature.":
    "Lejos de todo análogo documentado: un candidato, aún sin revisar en la literatura.",
  "These findings were reviewed by the team for the preset sites, so they do not change with your search. For your own site, choose “Only new places” in the search settings.":
    "Estos hallazgos los revisó el equipo para los sitios preset, así que no cambian con tu búsqueda. Para tu propio sitio, elige “Solo lugares nuevos” en la configuración de búsqueda.",
  "official source": "fuente oficial",
  "news report": "nota de prensa",
  "secondary source": "fuente secundaria",
  "Fieldwork and legal notes": "Trabajo de campo y notas legales",
  "Reviewed {date}. Informational only, not legal advice: rules change and depend on your nationality.": "Revisado el {date}. Solo informativo, no es asesoría legal: las reglas cambian y dependen de tu nacionalidad.",
  "Travel advisory": "Aviso de viaje",
  "List used here": "Lista usada aquí",
  "Passport restriction": "Restricción de pasaporte",
  "Sanctions": "Sanciones",
  "Research cooperation": "Cooperación científica",
  "Border zones": "Zonas fronterizas",
  "Armed conflict": "Conflicto armado",
  "Surveying and Mapping Law (2017)": "Ley de Topografía y Cartografía (2017)",
  "Counter-espionage law (2023)": "Ley de contraespionaje (2023)",
  "Travel permit": "Permiso de viaje",
  "Border permit": "Permiso fronterizo",
  "GBAO permit": "Permiso GBAO",
  "Protected Area Permit": "Permiso de Área Protegida",
  "Protected areas": "Áreas protegidas",
  "Environmental Protocol": "Protocolo Ambiental",
  "McMurdo Dry Valleys": "Valles Secos de McMurdo",
  "Research licence": "Licencia de investigación",
  "National parks": "Parques nacionales",
  "Expedition permit": "Permiso de expedición",
  "Not legal advice": "No es asesoría legal",
  "Biological samples (Nagoya Protocol)": "Muestras biológicas (Protocolo de Nagoya)",
  "Rock and soil samples": "Muestras de roca y suelo",
  "Sanctions travel with the people": "Las sanciones viajan con las personas",
  "New findings": "Hallazgos nuevos",
  "{count} Earth regions that rank in the top 1% for a preset site but are not documented analogs. Each one was checked in the literature in two rounds, and the app recomputes its score from the current table.": "{count} regiones de la Tierra en el 1 % superior para un sitio predefinido que no son análogos documentados. Cada una se revisó en la literatura en dos rondas, y la app recalcula su puntaje con la tabla actual.",
  "{count} with no known restriction": "{count} sin restricción conocida",
  "Which findings to show": "Qué hallazgos mostrar",
  "All ({count})": "Todos ({count})",
  "Fieldwork possible now ({count})": "Trabajo de campo posible hoy ({count})",
  "No finding here can be visited now.": "Ningún hallazgo de aquí se puede visitar hoy.",
  "Legal notes for every site": "Notas legales para todo sitio",
  "{count} cells": "{count} celdas",
  "{km} km from the nearest known analog": "a {km} km del análogo conocido más cercano",
  "Matches on": "Coincide en",
  "differs on": "difiere en",
  "Test first": "Probar primero",
  "Honest limit": "Límite honesto",
  "Literature review: {count} searches on {date}": "Revisión bibliográfica: {count} búsquedas el {date}",
  "Sources read": "Fuentes leídas",
  "Open on the map": "Abrir en el mapa",
  "Could not load the findings: {error}": "No se pudieron cargar los hallazgos: {error}",
  "Loading the findings…": "Cargando los hallazgos…",
  "No source was found for this region": "No se encontró ninguna fuente para esta región",
  "Low confidence: few features with good data": "Confianza baja: pocas variables con buenos datos",
  "Some cells lie outside the region's box": "Algunas celdas quedan fuera del recuadro de la región",
  "Some cells are missing from the loaded table": "Faltan algunas celdas en la tabla cargada",
};
