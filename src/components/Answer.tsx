import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { SummaryFacts, SummaryReply } from "../api";
import { BAND_LABEL, lowerFirst } from "../format";
import { t } from "../i18n";

export interface NextStep {
  label: string;
  run: () => void;
}

interface Props {
  summary: SummaryReply | null;
  loading: boolean;
  nextSteps: NextStep[];
}

const list = (labels: string[]) => labels.map((label) => lowerFirst(t(label))).join(", ");

/** The app's own answer, written from the same facts a model gets. Used when no model wrote one. */
export function plainAnswer(facts: SummaryFacts): string {
  const [best, second] = facts.top;
  if (!best) return t("No place passes these filters. Try a wider area or lower confidence.");
  const place = (country: string | null) => (country ? t(country) : t("an unnamed area"));
  const sentences = [
    t("The closest match to {site} for {purpose} is in {country}, with {score} of 100 and {band} confidence.", {
      site: t(facts.site),
      purpose: lowerFirst(t(facts.purpose)),
      country: place(best.country),
      score: best.score.toFixed(1),
      band: lowerFirst(t(BAND_LABEL[best.confidence])),
    }),
  ];
  if (second) {
    sentences.push(t("Next comes {country}, with {score}.", { country: place(second.country), score: second.score.toFixed(1) }));
  }
  if (best.closest_matches.length && best.weakest_matches.length) {
    sentences.push(
      t("The best place matches most on {closest} and least on {weakest}.", {
        closest: list(best.closest_matches),
        weakest: list(best.weakest_matches),
      }),
    );
  }
  const stressed = facts.emphasis;
  if (stressed && (stressed.beyond_earth_range || best.weakest_matches.includes(stressed.feature))) {
    sentences.push(
      t("More importance went to {feature}, but Earth only comes as close as these places.", {
        feature: lowerFirst(t(stressed.feature)),
      }),
    );
  }
  return sentences.join(" ");
}

/** A short answer above the list (spec FR-AI2), with one-touch ways to refine the search. */
export default function Answer({ summary, loading, nextSteps }: Props) {
  if (!summary && !loading) return null;
  return (
    <Card className="border-primary/30 bg-primary/10 print:hidden" aria-live="polite">
      <p className={cn("text-[15px] leading-relaxed", loading && "text-muted-foreground")}>
        {summary ? (summary.text ?? plainAnswer(summary.facts)) : t("Writing the answer…")}
      </p>
      {nextSteps.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("Refine the search")}>
          {nextSteps.map((step) => (
            <Button key={step.label} variant="outline" size="sm" className="h-7 rounded-full bg-background/60" onClick={step.run}>
              {t(step.label)}
            </Button>
          ))}
        </div>
      )}
      {summary && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          {summary.source === "ai" && <SparklesIcon className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden="true" />}
          {summary.source === "ai"
            ? t("Written by AI ({model}) from the numbers in the list. It never changes a score.", { model: summary.model ?? "" })
            : t("Written automatically from the numbers in the list.")}
        </p>
      )}
    </Card>
  );
}
