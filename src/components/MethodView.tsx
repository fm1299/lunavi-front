import type { Feature, Meta, Profile } from "../api";
import { numberLocale, t } from "../i18n";

interface Props {
  meta: Meta;
  features: Feature[];
  profiles: Profile[];
}

export default function MethodView({ meta, features, profiles }: Props) {
  const label = (key: string) => t(features.find((f) => f.key === key)?.label ?? key);
  return (
    <div className="page">
      <h1>{t("Method")}</h1>
      <p className="lede">{t(meta.limits_statement)}</p>

      <h2>{t("How it works")}</h2>
      <ol className="method-steps">
        <li>
          <strong>{t("Choose a site.")}</strong>{" "}
          {t(
            "Pick a Moon or Mars location. LUNAVI reads about {km} km around it from open data, measuring terrain the same way as on Earth.",
            { km: meta.site_window_km },
          )}
        </li>
        <li>
          <strong>{t("Normalize.")}</strong>{" "}
          {t("Each value becomes a number from 0 to 1 over the Earth range for that feature:")}{" "}
          <code>z = clip((x − lo) / (hi − lo), 0, 1)</code>.
        </li>
        <li>
          <strong>{t("Compare.")}</strong> {t("Similarity to the site is")} <code>s = 1 − |z_cell − z_site|</code>.{" "}
          {t("Composition uses a similarity matrix between rock classes.")}
        </li>
        <li>
          <strong>{t("Combine.")}</strong> <code>Score = 100 × Σ(w × s) / Σw</code>
          {t(", with weights from the research purpose. A feature missing on either side leaves both sums.")}
        </li>
        <li>
          <strong>{t("Veto.")}</strong> {t("Cells that fail the vegetation gate score 0, whatever the weights.")}
        </li>
        <li>
          <strong>{t("Rate confidence.")}</strong> <code>{t("q = source × resolution × (1 − gaps) × site quality")}</code>.{" "}
          {t(
            "Confidence is the weighted mean of q times the share of required features available. High is {high}% or above, medium is {medium}% or above.",
            { high: meta.confidence_bands.high * 100, medium: meta.confidence_bands.medium * 100 },
          )}
        </li>
      </ol>

      <h2>{t("Beyond Earth")}</h2>
      <p>
        {t(
          'Some site values lie outside anything on Earth, such as the Moon\'s temperature. They are clamped to the Earth range, which means "as close as Earth gets". They are flagged wherever they appear, and they are never listed as a closest match.',
        )}
      </p>

      <h2>{t("Which Earth cells are compared")}</h2>
      <p>
        {t(
          "A land cell is ranked if it is arid, polar or near a Holocene volcano. Ice sheets are left out: they are not rock or regolith, and the elevation data records the bedrock under them. A documented ice-free site inside a coarse glacier polygon, such as the Antarctic Dry Valleys, stays in through a named exception.",
        )}
      </p>

      <h2>{t("Missing values")}</h2>
      <p>
        {t(
          "A value with no source stays blank. It is left out of the score, it lowers confidence, and the app says so. The NASA and other agency data provided at the event can fill these in, one source at a time.",
        )}
      </p>

      <h2>{t("Search in plain words")}</h2>
      <p>
        {t(
          "You can describe what you are looking for in your own words. A free language model turns the request into the same settings the controls hold: a site, a purpose, one feature to give more importance to, an area and terrain. Anything it returns that is not a known site, purpose, feature or area is dropped and reported. A comparison such as \"colder\" gives that feature more importance; it is not a hard filter. The model also writes the short answer above the list from the numbers of the best results, and an answer that quotes any other number is discarded. The model never sees or changes a score: the ranking is always the same calculation.",
        )}{" "}
        {meta.ai?.available
          ? t("Model in use: {model}.", { model: `${meta.ai.provider} ${meta.ai.model}` })
          : t("No language model is set up right now, so the search is built by hand and the answer is written automatically.")}
      </p>

      <h2>{t("Research purposes")}</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{t("Purpose")}</th>
            <th scope="col">{t("Weights")}</th>
            <th scope="col">{t("What to test")}</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <th scope="row">{t(profile.label)}</th>
              <td>
                {Object.entries(profile.weights)
                  .map(([key, weight]) => `${label(key)} ${weight}`)
                  .join(", ")}
              </td>
              <td>{profile.test_tags.map((tag) => t(tag)).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t("Earth data")}</h2>
      <p className="hint">
        {t("{count} land cells at {degrees} degrees.", {
          count: meta.land_cells.toLocaleString(numberLocale()),
          degrees: meta.grid_resolution_deg,
        })}
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{t("Feature")}</th>
            <th scope="col">{t("Earth range")}</th>
            <th scope="col">{t("Source")}</th>
            <th scope="col">{t("License")}</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key}>
              <th scope="row">{t(feature.label)}</th>
              <td>{feature.type === "numeric"
                  ? t("{lo} to {hi} {unit}", { lo: feature.lo ?? "", hi: feature.hi ?? "", unit: t(feature.unit) })
                  : t("Classes")}</td>
              <td>
                {feature.source_url ? (
                  <a href={feature.source_url} target="_blank" rel="noreferrer">
                    {feature.source_name}
                  </a>
                ) : (
                  <span className="muted">{t(feature.source_name)}</span>
                )}
              </td>
              <td>{feature.license ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        {t(
          "Land mask and countries from Natural Earth (public domain). Holocene volcanoes from the Smithsonian Global Volcanism Program. Earth base map from NASA GIBS. Moon and Mars base maps from NASA Trek.",
        )}
      </p>

      <h2>{t("Moon and Mars data")}</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{t("Values")}</th>
            <th scope="col">{t("Moon")}</th>
            <th scope="col">{t("Mars")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t("Slope, roughness, elevation")}</th>
            <td>
              <a href="https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif" target="_blank" rel="noreferrer">
                {t("LOLA global map")}
              </a>
              {t(", and the")}{" "}
              <a href="https://pgda.gsfc.nasa.gov/products/90" target="_blank" rel="noreferrer">
                {t("LOLA polar map")}
              </a>{" "}
              {t("near the south pole")}
            </td>
            <td>
              <a href="https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif" target="_blank" rel="noreferrer">
                {t("MOLA global map")}
              </a>
            </td>
          </tr>
          <tr>
            <th scope="row">{t("Mean and day-night temperature")}</th>
            <td>
              <a href="https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_gcp" target="_blank" rel="noreferrer">
                {t("Diviner global table")}
              </a>{" "}
              {t("(measured)")}
            </td>
            <td>
              <a href="https://www-mars.lmd.jussieu.fr/mcd_python/" target="_blank" rel="noreferrer">
                Mars Climate Database
              </a>{" "}
              {t("(a model, so it counts as literature)")}
            </td>
          </tr>
          <tr>
            <th scope="row">{t("Annual temperature range")}</th>
            <td className="muted">{t("No source yet outside the presets")}</td>
            <td>Mars Climate Database</td>
          </tr>
          <tr>
            <th scope="row">{t("Composition")}</th>
            <td className="muted">{t("No source yet outside the presets")}</td>
            <td className="muted">{t("No source yet outside the presets")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
