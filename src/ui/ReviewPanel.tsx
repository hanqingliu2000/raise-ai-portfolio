import { useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Flag,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { contextFor } from "../domain/review";
import type { ItemState, ReviewItem } from "../domain/types";
import { IconButton } from "./primitives";
const labels = {
  raise: "Follow up",
  borderline: "Expert judgment",
  not_raise: "No follow-up suggested",
};

export function ReviewPanel({
  item,
  state,
  busy,
  analyze,
  update,
  setNotice,
  exporting,
  exportEvidence,
}: {
  item: ReviewItem;
  state: ItemState;
  busy: boolean;
  analyze: () => Promise<void>;
  update: (patch: Partial<ItemState>) => void;
  setNotice: (message: string) => void;
  exporting: boolean;
  exportEvidence: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"analysis" | "context">("analysis");
  return (
    <aside className="review-panel" aria-label="Human review">
      <section className="desk-section">
        <div className="section-heading">
          <h2>Desk explanation</h2>
          <span className="tiny-label">SYNTHETIC</span>
        </div>
        <p>
          {item.deskExplanation || "No explanation supplied in this example."}
        </p>
      </section>
      <section className="analysis-section">
        <div className="panel-tabs" role="tablist" aria-label="Review context">
          <button
            role="tab"
            aria-selected={tab === "analysis"}
            onClick={() => setTab("analysis")}
          >
            <Sparkles size={15} /> AI assessment
          </button>
          <button
            role="tab"
            aria-selected={tab === "context"}
            onClick={() => setTab("context")}
          >
            Context
          </button>
        </div>
        <div className="analysis-content" role="tabpanel">
          {tab === "context" ? (
            <>
              <div className="context-caption">Synthetic input bundle</div>
              <pre>{JSON.stringify(contextFor(item), null, 2)}</pre>
            </>
          ) : state.analysis ? (
            <>
              <span className={`decision ${state.analysis.decision}`}>
                {labels[state.analysis.decision]}
              </span>
              <p className="analysis-reason">{state.analysis.reason}</p>
              <div className="route">
                <span>DECISION PATH</span>
                <div>
                  <Check size={13} /> Structured data & context
                </div>
                <div>
                  <ChevronDown size={13} /> {state.analysis.rule}
                </div>
                <div>
                  <ShieldCheck size={13} /> Human decision required
                </div>
              </div>
            </>
          ) : (
            <div className="analysis-empty">
              <Sparkles size={25} />
              <h3>Context before conclusions.</h3>
              <p>Demo assessment not run.</p>
            </div>
          )}
        </div>
        <div className="analysis-bottom">
          <button
            className="analyze-button"
            onClick={() => void analyze()}
            disabled={busy}
          >
            <Sparkles size={15} />
            {busy
              ? "Running demo assessment…"
              : state.analysis
                ? "Rerun demo assessment"
                : "Run demo assessment"}
          </button>
          <p className="risk-note">
            Simulated AI output. Human review required.
          </p>
        </div>
      </section>
      <section className="draft-section">
        <div className="section-heading">
          <h2>Reviewer draft</h2>
          <IconButton
            label="Restore draft"
            disabled={state.raised || state.draft === item.defaultDraft}
            onClick={() => update({ draft: item.defaultDraft })}
          >
            <RotateCcw size={14} />
          </IconButton>
        </div>
        <textarea
          aria-label="Reviewer draft"
          value={state.draft}
          readOnly={state.raised}
          onChange={(e) => update({ draft: e.target.value })}
        />
        <div className="draft-actions">
          <button
            className={`raise-button ${state.raised ? "is-raised" : ""}`}
            onClick={() => {
              update({ raised: !state.raised });
              setNotice(
                state.raised
                  ? "Follow-up removed. Evidence selection is editable."
                  : "Marked for follow-up. Evidence selection is locked.",
              );
            }}
          >
            <Flag size={15} />
            {state.raised ? "Unflag" : "Flag for follow-up"}
          </button>
          <IconButton
            label={exporting ? "Exporting evidence" : "Export evidence PNG"}
            disabled={exporting}
            onClick={() => void exportEvidence()}
          >
            <Download size={17} />
          </IconButton>
        </div>
      </section>
    </aside>
  );
}
