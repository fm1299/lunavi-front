import type { Feature, Meta, Profile } from "../api";

interface Props {
  meta: Meta;
  features: Feature[];
  profiles: Profile[];
}

export default function MethodView({ meta, features, profiles }: Props) {
  const label = (key: string) => features.find((f) => f.key === key)?.label ?? key;
  return (
    <div className="page">
      <h1>Method</h1>
      <p className="lede">{meta.limits_statement}</p>

      <h2>How it works</h2>
      <ol className="method-steps">
        <li>
          <strong>Choose a site.</strong> Pick a Moon or Mars location. LUNAVI reads about {meta.site_window_km} km around it
          from open data, measuring terrain the same way as on Earth.
        </li>
        <li>
          <strong>Normalize.</strong> Each value becomes a number from 0 to 1 over the Earth range for that feature:{" "}
          <code>z = clip((x − lo) / (hi − lo), 0, 1)</code>.
        </li>
        <li>
          <strong>Compare.</strong> Similarity to the site is <code>s = 1 − |z_cell − z_site|</code>. Composition uses a
          similarity matrix between rock classes.
        </li>
        <li>
          <strong>Combine.</strong> <code>Score = 100 × Σ(w × s) / Σw</code>, with weights from the research purpose. A
          feature missing on either side leaves both sums.
        </li>
        <li>
          <strong>Veto.</strong> Cells that fail the vegetation gate score 0, whatever the weights.
        </li>
        <li>
          <strong>Rate confidence.</strong> <code>q = source × resolution × (1 − gaps) × site quality</code>. Confidence is
          the weighted mean of q times the share of required features available. High is {meta.confidence_bands.high * 100}% or
          above, medium is {meta.confidence_bands.medium * 100}% or above.
        </li>
      </ol>

      <h2>Beyond Earth</h2>
      <p>
        Some site values lie outside anything on Earth, such as the Moon's temperature. They are clamped to the Earth range,
        which means "as close as Earth gets". They are flagged wherever they appear, and they are never listed as a closest
        match.
      </p>

      <h2>Which Earth cells are compared</h2>
      <p>
        A land cell is ranked if it is arid, polar or near a Holocene volcano. Ice sheets are left out: they are not rock or
        regolith, and the elevation data records the bedrock under them. A documented ice-free site inside a coarse glacier
        polygon, such as the Antarctic Dry Valleys, stays in through a named exception.
      </p>

      <h2>Missing values</h2>
      <p>
        A value with no source stays blank. It is left out of the score, it lowers confidence, and the app says so. The NASA
        and other agency data provided at the event can fill these in, one source at a time.
      </p>

      <h2>Research purposes</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Purpose</th>
            <th scope="col">Weights</th>
            <th scope="col">What to test</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <th scope="row">{profile.label}</th>
              <td>
                {Object.entries(profile.weights)
                  .map(([key, weight]) => `${label(key)} ${weight}`)
                  .join(", ")}
              </td>
              <td>{profile.test_tags.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Earth data</h2>
      <p className="hint">
        {meta.land_cells.toLocaleString("en-US")} land cells at {meta.grid_resolution_deg} degrees.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">Earth range</th>
            <th scope="col">Source</th>
            <th scope="col">License</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key}>
              <th scope="row">{feature.label}</th>
              <td>{feature.type === "numeric" ? `${feature.lo} to ${feature.hi} ${feature.unit}` : "Classes"}</td>
              <td>
                {feature.source_url ? (
                  <a href={feature.source_url} target="_blank" rel="noreferrer">
                    {feature.source_name}
                  </a>
                ) : (
                  <span className="muted">{feature.source_name}</span>
                )}
              </td>
              <td>{feature.license ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        Land mask and countries from Natural Earth (public domain). Holocene volcanoes from the Smithsonian Global Volcanism
        Program. Earth base map from NASA GIBS. Moon and Mars base maps from NASA Trek.
      </p>

      <h2>Moon and Mars data</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Values</th>
            <th scope="col">Moon</th>
            <th scope="col">Mars</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Slope, roughness, elevation</th>
            <td>
              <a href="https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif" target="_blank" rel="noreferrer">
                LOLA global map
              </a>
              , and the{" "}
              <a href="https://pgda.gsfc.nasa.gov/products/90" target="_blank" rel="noreferrer">
                LOLA polar map
              </a>{" "}
              near the south pole
            </td>
            <td>
              <a href="https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif" target="_blank" rel="noreferrer">
                MOLA global map
              </a>
            </td>
          </tr>
          <tr>
            <th scope="row">Mean and day-night temperature</th>
            <td>
              <a href="https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_gcp" target="_blank" rel="noreferrer">
                Diviner global table
              </a>{" "}
              (measured)
            </td>
            <td>
              <a href="https://www-mars.lmd.jussieu.fr/mcd_python/" target="_blank" rel="noreferrer">
                Mars Climate Database
              </a>{" "}
              (a model, so it counts as literature)
            </td>
          </tr>
          <tr>
            <th scope="row">Annual temperature range</th>
            <td className="muted">No source yet outside the presets</td>
            <td>Mars Climate Database</td>
          </tr>
          <tr>
            <th scope="row">Composition</th>
            <td className="muted">No source yet outside the presets</td>
            <td className="muted">No source yet outside the presets</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
