import { useEffect, useState, type ReactNode } from "react";

import type { BeyondMode, FunnelStage, ProcessReport, Weights } from "../api";
import { api } from "../api";
import { BAND_LABEL, formatCoord, formatValue, TERRAIN_CHIPS } from "../format";
import { numberLocale, t } from "../i18n";

interface Props {
  target: string;
  profile: string;
  weights: Weights | null;
  beyond: BeyondMode;
  /** Open a cell on the map and its site sheet. */
  onOpenCell: (cellId: string) => void;
}

const FUNNEL_LABEL: Record<FunnelStage, string> = {
  land_cells: "Land cells",
  after_masks: "Alien-like terrain",
  after_gates: "Pass the vegetation veto",
  medium_confidence_or_better: "Medium confidence or better",
  new: "New (far from the catalog)",
  candidates: "Candidates (top scores)",
  findings: "Named findings",
};

const LITERATURE_LABEL: Record<string, string> = {
  no_analog_literature_found: "No analog literature found",
  studied_in_other_context: "Studied in another context",
  used_as_analog: "Already used as an analog",
};

const int = (value: number | null | undefined) =>
  value === null || value === undefined ? "–" : value.toLocaleString(numberLocale());
const dec = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "–"
    : value.toLocaleString(numberLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "–" : `${(value * 100).toFixed(digits)}%`;

export default function ProcessView({ target, profile, weights, beyond, onOpenCell }: Props) {
  const [report, setReport] = useState<ProcessReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    api
      .process({ target, profile, weights, beyond }, controller.signal)
      .then(setReport)
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [target, profile, weights, beyond]);

  if (error) return <div className="page"><p className="error-banner">{t("Could not load the process: {error}", { error })}</p></div>;
  if (!report) return <div className="page"><p className="muted">{t("Working out every step…")}</p></div>;

  const r = report;
  const label = (key: string) => t(r.features.find((f) => f.key === key)?.label ?? key);
  const gateText = Object.entries(r.gates)
    .map(([key, value]) => `${label(key)} s < ${value}`)
    .join(", ");

  return (
    <div className="page process">
      <h1>{t("How LUNAVI finds Earth analogs")}</h1>
      <p className="lede">
        {t(
          "Every step from the whole Earth to a short list of named places, with the numbers of the current search. They are computed live from the same table and formulas as the ranking.",
        )}
      </p>
      <p className="process-current">
        <span className={`body-tag body-${r.target.body}`}>{t(r.target.body === "moon" ? "Moon" : "Mars")}</span>{" "}
        <strong>{t(r.target.name)}</strong> · {t(r.profile.label)}
        {weights && <span className="muted"> · {t("custom weights")}</span>}
        {r.dummy && <span className="flag"> {t("Dummy data, not real results")}</span>}
      </p>

      <Funnel report={r} />

      <ol className="process-steps">
        <Step
          n={1}
          title={t("Split the Earth into cells")}
          what={t("The Earth is cut into squares of {deg}° (about 55 km) and only dry land is kept.", { deg: r.grid.resolution_deg })}
          rule={t("A cell stays if at least {share}% of it is land.", { share: r.grid.min_land_fraction * 100 })}
          source="Natural Earth"
        >
          <Stats
            items={[
              [t("Land cells"), int(r.grid.land_cells)],
              [t("Countries"), int(r.grid.countries)],
              [t("Cell size"), `${r.grid.resolution_deg}°`],
            ]}
          />
        </Step>

        <Step
          n={2}
          title={t("Measure every cell")}
          what={t("Each Earth cell gets its relief, climate, vegetation and rock class from open data.")}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("Feature")}</th>
                <th scope="col">{t("Source")}</th>
                <th scope="col">{t("Cells with data")}</th>
                <th scope="col">{t("Earth range (1st to 99th percentile)")}</th>
              </tr>
            </thead>
            <tbody>
              {r.features.map((f) => (
                <tr key={f.key}>
                  <th scope="row">{t(f.label)}</th>
                  <td>
                    {f.source_url ? (
                      <a href={f.source_url} target="_blank" rel="noreferrer">
                        {f.source_name}
                      </a>
                    ) : (
                      <span className="muted">{t(f.source_name)}</span>
                    )}
                  </td>
                  <td>
                    {f.has_source ? `${int(f.cells_with_data)} (${pct(f.share_with_data)})` : <span className="muted">{t("no source yet")}</span>}
                  </td>
                  <td>
                    {f.type === "numeric" && f.earth_p1 !== null
                      ? `${formatValue(f.earth_p1, f.unit)} – ${formatValue(f.earth_p99, f.unit)}`
                      : f.type === "categorical"
                        ? t("Classes")
                        : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Step>

        <Step
          n={3}
          title={t("Read the Moon or Mars site")}
          what={t("The same values are read for {site}, over a window of about {km} km.", { site: t(r.target.name), km: r.site_window_km })}
          rule={t("Each value carries its basis. A literature value counts {lit} in confidence; measured and physical values count {meas}.", {
            lit: r.target_quality.literature,
            meas: r.target_quality.measured,
          })}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("Feature")}</th>
                <th scope="col">{t("Site value")}</th>
                <th scope="col">{t("Basis")}</th>
                <th scope="col">{t("Beyond Earth")}</th>
              </tr>
            </thead>
            <tbody>
              {r.features.map((f) => (
                <tr key={f.key}>
                  <th scope="row">{t(f.label)}</th>
                  <td className={f.site_value === null ? "muted" : ""}>
                    {f.site_source_url && f.site_value !== null ? (
                      <a href={f.site_source_url} target="_blank" rel="noreferrer">
                        {formatValue(f.site_value, f.unit)}
                      </a>
                    ) : (
                      formatValue(f.site_value, f.unit)
                    )}
                  </td>
                  <td>{f.site_basis ? <span className={`basis basis-${f.site_basis}`}>{t(f.site_basis)}</span> : "–"}</td>
                  <td>{f.beyond_earth ? <span className="flag">{t("yes, clamped")}</span> : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Step>

        <Step
          n={4}
          title={t("Put everything on the same scale")}
          what={t("Each value becomes a number from 0 to 1 inside the Earth range. A site value outside it is clamped and flagged beyond Earth.")}
          rule="z = clip((x − lo) / (hi − lo), 0, 1)"
        >
          <p className="hint">{t("The table after step 5 shows lo, hi and the site's z for each feature.")}</p>
        </Step>

        <Step
          n={5}
          title={t("Compare feature by feature")}
          what={t("How close each Earth cell is to the site on each feature. Rock classes use a similarity matrix.")}
          rule="s = 1 − |z_cell − z_site|"
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("Feature")}</th>
                <th scope="col">lo – hi</th>
                <th scope="col">{t("Site z")}</th>
                <th scope="col">{t("Weight")}</th>
                <th scope="col">{t("Median s (eligible cells)")}</th>
                <th scope="col">{t("Cells with s ≥ 0.8")}</th>
              </tr>
            </thead>
            <tbody>
              {r.features.map((f) => (
                <tr key={f.key} className={f.weight > 0 || f.gate !== null ? "" : "muted"}>
                  <th scope="row">{t(f.label)}</th>
                  <td>{f.type === "numeric" ? `${dec(f.lo)} – ${dec(f.hi)} ${f.unit === "deg" ? "°" : t(f.unit)}` : t("matrix")}</td>
                  <td>
                    {dec(f.site_z)}
                    {f.beyond_earth && <span className="flag"> ⚑</span>}
                  </td>
                  <td>{f.gate !== null ? t("veto if s < {gate}", { gate: f.gate }) : f.weight || "0"}</td>
                  <td>
                    <Meter value={f.s_median} />
                  </td>
                  <td>{pct(f.s_close_share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Step>

        <Step
          n={6}
          title={t("Compute the score")}
          what={t("The similarities are averaged with the weights of the purpose. A cell that fails the vegetation veto scores 0.")}
          rule={`Score = 100 × Σ(w × s) / Σw${gateText ? ` · ${t("veto")}: ${gateText}` : ""}`}
        >
          <p className="hint">
            {t("Weights")}:{" "}
            {Object.entries(r.weights)
              .filter(([, w]) => w > 0)
              .map(([key, w]) => `${label(key)} ${w}`)
              .join(", ")}
          </p>
          <Stats
            items={[
              [t("Vetoed (too green)"), int(r.score.vetoed)],
              [t("Scored above 0"), int(r.score.above_zero)],
              [t("Median score"), dec(r.score.p50, 1)],
              [t("Top 10% from"), dec(r.score.p90, 1)],
              [t("Top 1% from"), dec(r.score.p99, 1)],
              [t("Best score"), dec(r.score.max, 1)],
            ]}
          />
        </Step>

        <Step
          n={7}
          title={t("Keep terrain that looks like another world")}
          what={t("Only arid, polar or volcanic cells are compared, plus cited exceptions and cells with documented caves.")}
          rule={t("Arid: under {mm} mm/year · Polar: latitude {lat}° or more · Volcanic: basalt or within {km} km of a Holocene volcano · Ice sheets out (over {ice}% ice)", {
            mm: r.terrain.arid_precip_mm,
            lat: r.terrain.polar_lat_deg,
            km: r.terrain.volcano_distance_km,
            ice: r.terrain.max_glaciated_fraction * 100,
          })}
          source="Natural Earth, Smithsonian Global Volcanism Program"
        >
          <Stats
            items={[
              [t("Eligible cells"), int(r.terrain.eligible)],
              ...TERRAIN_CHIPS.map(({ id, label: name }) => [t(name), int(r.terrain.by_class[id])] as [string, string]),
            ]}
          />
          {r.terrain.exceptions.length > 0 && (
            <p className="hint">
              {t("Exceptions with a citation")}: {r.terrain.exceptions.join(", ")}
            </p>
          )}
        </Step>

        <Step
          n={8}
          title={t("Rate confidence")}
          what={t("How much to trust a score, from the quality of the data of the cell and of the site.")}
          rule={`q = source × resolution × (1 − gaps) × site quality · ${t("Confidence")} = Σ(w × q) / Σw × ${t("share of features available")}`}
        >
          <Stats
            items={[
              [t("High (≥ {v})", { v: r.confidence.bands.high }), int(r.confidence.high)],
              [t("Medium (≥ {v})", { v: r.confidence.bands.medium }), int(r.confidence.medium)],
              [t("Low"), int(r.confidence.low)],
            ]}
          />
        </Step>

        <Step
          n={9}
          title={t("Decide whether it is new")}
          what={t("The distance from each cell to the nearest site of our catalog of {n} documented analogs.", { n: r.novelty.catalog_size })}
          rule={t("Known under {a} km · near a known one from {a} to {b} km · new beyond {b} km", { a: r.novelty.known_km, b: r.novelty.new_km })}
        >
          <Stats
            items={[
              [t("Known"), int(r.novelty.known)],
              [t("Near a known one"), int(r.novelty.near_known)],
              [t("New"), int(r.novelty.new)],
            ]}
          />
          <p className="hint">{t('"New" means not in our catalog, not "never studied". Counted among cells with medium confidence or better.')}</p>
        </Step>

        <Step
          n={10}
          title={t("Propose candidates")}
          what={t("New cells with medium confidence or better and a score in the top {share}% are kept, and touching cells are joined into regions.", {
            share: r.candidates.top_share * 100,
          })}
          rule={t("Score of {cut} or more", { cut: dec(r.candidates.score_cut, 1) })}
        >
          <Stats
            items={[
              [t("Candidate cells"), int(r.candidates.cells)],
              [t("Regions"), int(r.candidates.regions)],
            ]}
          />
          {r.candidates.top_regions.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t("Best cell of the region")}</th>
                  <th scope="col">{t("Cells")}</th>
                  <th scope="col">{t("Score")}</th>
                  <th scope="col">{t("Confidence")}</th>
                  <th scope="col">{t("Nearest known analog")}</th>
                </tr>
              </thead>
              <tbody>
                {r.candidates.top_regions.map((region) => (
                  <tr key={region.cell_id}>
                    <th scope="row">
                      <button className="link-button" onClick={() => onOpenCell(region.cell_id)}>
                        {region.country ?? t("an unnamed area")} · {formatCoord(region.lat, region.lon)}
                      </button>
                    </th>
                    <td>{region.cells}</td>
                    <td>{dec(region.score, 1)}</td>
                    <td>{dec(region.confidence)}</td>
                    <td>{int(region.nearest_known_km)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Step>

        <Step
          n={11}
          title={t("Check the literature and name them")}
          what={t("Each candidate region is searched in the literature. If it is already documented as an analog it joins the catalog; if not, it becomes a named finding.")}
        >
          {r.findings ? (
            <>
              <Stats
                items={[
                  [t("Named findings"), int(r.findings.count)],
                  ...Object.entries(r.findings.by_result).map(([key, count]) => [t(LITERATURE_LABEL[key] ?? key), int(count)] as [string, string]),
                ]}
              />
              {r.findings.profile !== r.profile.id && (
                <p className="hint">{t("Findings were reviewed with this site's default purpose; scores below use it.")}</p>
              )}
              <ul className="process-findings">
                {r.findings.items.map((item) => (
                  <li key={item.id}>
                    <button className="link-button" onClick={() => onOpenCell(item.cell_id)}>
                      {item.name}
                    </button>{" "}
                    <span className="muted">
                      {formatCoord(item.lat, item.lon)} · {t("Score {score}", { score: dec(item.score, 1) })}
                      {item.band && ` · ${t(BAND_LABEL[item.band])}`}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">{t("Only the preset sites have reviewed findings. Pick a preset to see them.")}</p>
          )}
        </Step>

        <Step
          n={12}
          title={t("Validate the method")}
          what={t("Documented analogs should rank near the top and unlikely places (rainforest, farmland) in the lower half.")}
          rule={r.validation ? t("Positive controls in the top {a}% · negative controls in the lower half", { a: r.validation.accept_top_share * 100 }) : undefined}
        >
          {r.validation ? (
            <>
              <Stats
                items={[
                  [t("Positive controls passed"), `${r.validation.positives_passed} / ${r.validation.positives_compared}`],
                  [t("Negative controls low"), `${r.validation.negatives_low} / ${r.validation.negatives_compared}`],
                  [t("Top 50 kept with weights ±20%"), pct(r.validation.lowest_top_overlap)],
                ]}
              />
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{t("Control")}</th>
                    <th scope="col">{t("Score")}</th>
                    <th scope="col">{t("Ranks in the top")}</th>
                    <th scope="col">{t("Result")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...r.validation.positive_controls, ...r.validation.negative_controls].map((row) => {
                    const ok = row.passes ?? row.in_lower_half;
                    return (
                      <tr key={row.id}>
                        <th scope="row">{row.name}</th>
                        <td>{dec(row.score, 1)}</td>
                        <td>{row.comparable ? pct(row.top_share, 1) : t("not comparable")}</td>
                        <td className={ok ? "pass" : "fail"}>
                          {!row.comparable ? "–" : row.passes !== undefined ? (ok ? t("passes") : t("below target")) : ok ? t("lower half") : t("ranks too high")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {r.validation.profile !== r.profile.id && <p className="hint">{t("Validation uses this site's default purpose.")}</p>}
            </>
          ) : (
            <p className="muted">{t("Controls are assigned to the preset sites. Pick a preset to see the validation.")}</p>
          )}
        </Step>
      </ol>

      {r.example && (
        <>
          <h2>{t("Worked example: the best cell")}</h2>
          <p className="lede">
            <button className="link-button" onClick={() => onOpenCell(r.example!.cell_id)}>
              {r.example.country ?? t("an unnamed area")} · {formatCoord(r.example.lat, r.example.lon)}
            </button>{" "}
            {t("compared with {site}, term by term.", { site: t(r.target.name) })}
          </p>
          <table className="data-table process-example">
            <thead>
              <tr>
                <th scope="col">{t("Feature")}</th>
                <th scope="col">{t("Site")}</th>
                <th scope="col">{t("Cell")}</th>
                <th scope="col">z {t("site")}</th>
                <th scope="col">z {t("cell")}</th>
                <th scope="col">s</th>
                <th scope="col">w</th>
                <th scope="col">w × s</th>
                <th scope="col">q</th>
              </tr>
            </thead>
            <tbody>
              {r.example.rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">
                    {t(row.label)}
                    {row.beyond_earth && <span className="flag"> ⚑</span>}
                  </th>
                  <td>{formatValue(row.site_value, row.unit)}</td>
                  <td>{formatValue(row.cell_value, row.unit)}</td>
                  <td>{dec(row.site_z)}</td>
                  <td>{dec(row.cell_z)}</td>
                  <td>{dec(row.s)}</td>
                  <td>{row.gate !== null ? t("veto < {gate}", { gate: row.gate }) : row.weight}</td>
                  <td>{row.gate !== null ? (row.passes_gate ? t("passes") : t("vetoed")) : dec(row.weighted)}</td>
                  <td>{dec(row.q)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={6}>
                  Σ
                </th>
                <td>{dec(r.example.weight_sum, 1)}</td>
                <td>{dec(r.example.weighted_sum)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          <div className="process-formulas">
            <code>
              {t("Score")} = 100 × {dec(r.example.weighted_sum)} / {dec(r.example.weight_sum, 1)} = <strong>{dec(r.example.score, 1)}</strong>
            </code>
            <code>
              {t("Confidence")} = {dec(r.example.mean_quality)} × {dec(r.example.available_share)} = <strong>{dec(r.example.confidence)}</strong> (
              {t(BAND_LABEL[r.example.band])})
            </code>
          </div>
          {r.example.closest_matches.length > 0 && (
            <p className="hint">
              {t("Matches on {closest} · differs on {weakest}", {
                closest: r.example.closest_matches.map(label).join(", "),
                weakest: r.example.weakest_matches.map(label).join(", ") || "–",
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Step({ n, title, what, rule, source, children }: { n: number; title: string; what: string; rule?: string; source?: string; children?: ReactNode }) {
  return (
    <li className="process-step">
      <div className="process-step-number" aria-hidden="true">
        {n}
      </div>
      <div className="process-step-body">
        <h2>
          <span className="sr-only">{n}. </span>
          {title}
        </h2>
        <p>{what}</p>
        {rule && <code className="process-rule">{rule}</code>}
        {source && <p className="hint">{t("Source")}: {source}</p>}
        {children}
      </div>
    </li>
  );
}

function Stats({ items }: { items: [string, string][] }) {
  return (
    <dl className="process-stats">
      {items.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Meter({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">–</span>;
  return (
    <span className="process-meter">
      <span className="process-meter-bar">
        <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </span>
      {dec(value)}
    </span>
  );
}

/** Cells left after each step. The bar length is on a log scale, so small steps stay visible. */
function Funnel({ report }: { report: ProcessReport }) {
  const rows = report.funnel;
  const top = Math.log10(Math.max(10, rows[0]?.count ?? 10));
  return (
    <section className="process-funnel" aria-label={t("Screening funnel")}>
      <h2>{t("Screening funnel")}</h2>
      <p className="hint">{t("Cells left after each step (bars on a log scale).")}</p>
      <ol>
        {rows.map((row) => (
          <li key={row.stage}>
            <span className="process-funnel-label">{t(FUNNEL_LABEL[row.stage])}</span>
            <span className="process-funnel-track">
              <span
                className="process-funnel-bar"
                style={{ width: row.count ? `${Math.max(2, (Math.log10(row.count + 1) / top) * 100)}%` : "0%" }}
              />
            </span>
            <span className="process-funnel-count">{row.count === null ? "–" : int(row.count)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
