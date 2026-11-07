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

      <h2>How a cell is scored</h2>
      <ol className="method-steps">
        <li>
          <strong>Normalize.</strong> Each value becomes a number from 0 to 1 over the Earth range for that feature:{" "}
          <code>z = clip((x − lo) / (hi − lo), 0, 1)</code>.
        </li>
        <li>
          <strong>Compare.</strong> Similarity to the target is <code>s = 1 − |z_cell − z_target|</code>. Composition uses a
          similarity matrix between rock classes.
        </li>
        <li>
          <strong>Combine.</strong> <code>Score = 100 × Σ(w × s) / Σw</code>, with weights from the research purpose. A
          feature missing for a cell leaves both sums.
        </li>
        <li>
          <strong>Veto.</strong> Cells that fail the vegetation gate score 0, whatever the weights.
        </li>
        <li>
          <strong>Rate confidence.</strong> <code>q = source × resolution × (1 − gaps) × target quality</code>. Confidence
          is the weighted mean of q times the share of required features available. High is {meta.confidence_bands.high * 100}% or
          above, medium is {meta.confidence_bands.medium * 100}% or above.
        </li>
        <li>
          <strong>Label novelty.</strong> Known is within {meta.novelty_km.known} km of a catalog site, near known is within{" "}
          {meta.novelty_km.near_known} km, and new is beyond that. New means not in our catalog, not never studied.
        </li>
      </ol>

      <h2>Beyond Earth</h2>
      <p>
        Some target values lie outside anything on Earth, such as the Moon's temperature. They are clamped to the Earth range,
        which means "as close as Earth gets". They are flagged wherever they appear, and they are never listed as a closest
        match.
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

      <h2>Data sources</h2>
      <p className="hint">
        Open public data for now. The NASA and other agency data provided at the event replaces these, one adapter at a time.
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
                <a href={feature.source_url} target="_blank" rel="noreferrer">
                  {feature.source_name}
                </a>
              </td>
              <td>{feature.license}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        Land mask from Natural Earth (public domain). Holocene volcanoes from the Smithsonian Global Volcanism Program. Base map
        from NASA Global Imagery Browse Services (GIBS).
      </p>
    </div>
  );
}
