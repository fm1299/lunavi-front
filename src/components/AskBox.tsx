import { SearchIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <section className="flex flex-col gap-3 print:hidden">
      <h1 className="text-xl font-semibold tracking-tight">{t("What place on Earth are you looking for?")}</h1>
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          className="h-11 pr-24 pl-9 text-[15px]"
          value={text}
          maxLength={400}
          aria-label={t("Write your question")}
          placeholder={t("Say it in your own words…")}
          onChange={(event) => setText(event.target.value)}
        />
        <Button className="absolute top-1.5 right-1.5" size="sm" type="submit" disabled={busy || text.trim() === ""}>
          {busy ? t("Thinking…") : t("Search")}
        </Button>
      </form>
      {showIdeas && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("Or start from an idea")}</p>
          {IDEAS.map((idea) => (
            <Button
              key={idea}
              variant="outline"
              className="h-auto justify-start py-2 text-left font-normal whitespace-normal"
              disabled={busy}
              onClick={() => {
                setText(t(idea));
                send(t(idea));
              }}
            >
              {t(idea)}
            </Button>
          ))}
        </div>
      )}
      {problem !== null && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[13px]" role="status">
          {problem === "not_understood"
            ? t(
                "I could not turn that into a search, so nothing changed. Tell me which Moon or Mars site it should resemble and, if you like, where on Earth to look. You can also build the search yourself in the sentence below.",
              )
            : t("The language model did not answer, so nothing changed. Try again, or build the search in the sentence below.")}
        </p>
      )}
    </section>
  );
}
