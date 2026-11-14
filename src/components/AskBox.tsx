import { useState } from "react";

import { t } from "../i18n";

interface Props {
  busy: boolean;
  /** "not_understood" when the model could not turn the request into a search, "failed" when it did not answer. */
  problem: "not_understood" | "failed" | null;
  showIdeas: boolean;
  onAsk: (text: string) => void;
}

const IDEAS = [
  "Places in South America like Jezero but colder",
  "Where to test a habitat for the Moon's south pole base",
  "Polar places to practice drilling for ice, like Arcadia Planitia",
];

/** The question in plain words (spec FR-AI2). It only fills in the search below it. */
export default function AskBox({ busy, problem, showIdeas, onAsk }: Props) {
  const [text, setText] = useState("");
  const send = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !busy) onAsk(trimmed);
  };
  return (
    <section className="ask">
      <h1 className="ask-title">{t("What place on Earth are you looking for?")}</h1>
      <form
        className="ask-box"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <input
          value={text}
          maxLength={400}
          aria-label={t("Write your question")}
          placeholder={t("Say it in your own words…")}
          onChange={(event) => setText(event.target.value)}
        />
        <button className="button primary" type="submit" disabled={busy || text.trim() === ""}>
          {busy ? t("Thinking…") : t("Search")}
        </button>
      </form>
      {showIdeas && (
        <div className="ask-ideas">
          <span className="field-label">{t("Or start from an idea")}</span>
          {IDEAS.map((idea) => (
            <button
              key={idea}
              className="ask-idea"
              type="button"
              disabled={busy}
              onClick={() => {
                setText(t(idea));
                send(t(idea));
              }}
            >
              {t(idea)}
            </button>
          ))}
        </div>
      )}
      {problem === "not_understood" && (
        <p className="ask-problem" role="status">
          {t(
            "I could not turn that into a search, so nothing changed. Tell me which Moon or Mars site it should resemble and, if you like, where on Earth to look. You can also build the search yourself in the sentence below.",
          )}
        </p>
      )}
      {problem === "failed" && (
        <p className="ask-problem" role="status">
          {t("The language model did not answer, so nothing changed. Try again, or build the search in the sentence below.")}
        </p>
      )}
    </section>
  );
}
