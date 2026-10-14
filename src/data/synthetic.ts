import type { Dataset, Decision, ReviewItem } from "../domain/types";

export const YEARS = Array.from({ length: 17 }, (_, i) => 2014 + i);

type Scenario = Pick<
  ReviewItem,
  "code" | "name" | "sector" | "unit" | "severity" | "kind"
> & {
  validation: string;
  flagged: number[];
  decision: Decision;
  reason: string;
  explanation: string;
};

const scenarios: Scenario[] = [
  {
    code: "OUTPUT_IDX",
    name: "Economic activity index",
    sector: "Activity",
    unit: "Index, 2020 = 100",
    severity: "high",
    kind: "revision",
    validation: "HISTORICAL_REVISION",
    flagged: [2020, 2021, 2022],
    decision: "raise",
    reason:
      "The revision affects a bounded historical interval while adjacent years are unchanged. The supplied note does not explain the boundary. Ask for the source and continuity treatment before accepting the series.",
    explanation:
      "A new source has been incorporated. The note does not identify which periods were revised.",
  },
  {
    code: "INVEST_IDX",
    name: "Investment volume index",
    sector: "Activity",
    unit: "Index, 2020 = 100",
    severity: "critical",
    kind: "missing_forecast",
    validation: "MISSING_FORECAST",
    flagged: [2029, 2030],
    decision: "raise",
    reason:
      "Required forecast observations are missing. This illustrative hard rule requires human follow-up without an AI decision call.",
    explanation: "Forecasts are being prepared for the next submission.",
  },
  {
    code: "EMPLOY_IDX",
    name: "Employment index",
    sector: "Activity",
    unit: "Index, 2020 = 100",
    severity: "low",
    kind: "revision",
    validation: "RECENT_REVISION",
    flagged: [2025, 2026],
    decision: "not_raise",
    reason:
      "The recent update is consistent with the explicitly supplied survey note and the surrounding path. This simulated recommendation suggests no follow-up; the reviewer still makes the final decision.",
    explanation:
      "The latest survey replaces provisional estimates for 2025 and 2026. Earlier observations are unchanged.",
  },
  {
    code: "PRICE_IDX",
    name: "Consumer price index",
    sector: "Prices",
    unit: "Index, 2020 = 100",
    severity: "high",
    kind: "revision",
    validation: "FORECAST_REVISION",
    flagged: [2027, 2028],
    decision: "borderline",
    reason:
      "Forecast levels have shifted, but the general trajectory is coherent. The note is plausible but does not fully reconcile the size of the change. Retain for expert judgment rather than asserting a data error.",
    explanation:
      "The forecast incorporates an updated illustrative cost assumption.",
  },
  {
    code: "EXPORT_IDX",
    name: "Export price index",
    sector: "Prices",
    unit: "Index, 2020 = 100",
    severity: "low",
    kind: "consistency",
    validation: "PATH_CHECK",
    flagged: [2026],
    decision: "not_raise",
    reason:
      "The one-period movement is supported by the supplied one-off adjustment note. The related input path is directionally consistent. No additional issue is suggested in this synthetic case.",
    explanation:
      "A documented, one-period adjustment is included in 2026 and unwinds in 2027.",
  },
  {
    code: "BALANCE_IDX",
    name: "Public balance measure",
    sector: "Public accounts",
    unit: "Illustrative units",
    severity: "high",
    kind: "consistency",
    validation: "COMPONENT_CHECK",
    flagged: [2024, 2025, 2026],
    decision: "raise",
    reason:
      "The reported aggregate changes while the supplied components do not reconcile to it. The discrepancy is not explained by the note. Ask for the updated component or a reconciliation.",
    explanation:
      "The aggregate was updated. Component-level reconciliation has not yet been supplied.",
  },
  {
    code: "REVENUE_IDX",
    name: "Revenue measure",
    sector: "Public accounts",
    unit: "Illustrative units",
    severity: "low",
    kind: "revision",
    validation: "RECENT_REVISION",
    flagged: [2026],
    decision: "borderline",
    reason:
      "The small current-period revision may reflect a normal source update. The supplied correspondence is incomplete, so a human reviewer should decide whether clarification is useful.",
    explanation: "",
  },
];

function createItem(
  scenario: Scenario,
  index: number,
  dataset: string,
  scale: number,
): ReviewItem {
  const observations = YEARS.map((year, i) => {
    const baseline =
      scale * (72 + index * 8 + i * 3.1 + Math.sin(i * 0.62 + index) * 4);
    const changed = scenario.flagged.includes(year);
    const current =
      scenario.kind === "missing_forecast" && changed
        ? null
        : baseline * (changed ? 1.12 : 1.01);
    return { year, current, previous: baseline, published: baseline * 0.97 };
  });
  return {
    id: `${dataset}-${scenario.code}-${scenario.validation}`,
    ...scenario,
    flagged: [...scenario.flagged],
    observations,
    related: [
      {
        code: `SOURCE_${index + 1}`,
        descriptor: "Synthetic source component",
        values: YEARS.map((_, i) => scale * (40 + i * 1.8 + index * 3)),
      },
      {
        code: `TOTAL_${index + 1}`,
        descriptor: "Synthetic comparison aggregate",
        values: YEARS.map((_, i) => scale * (110 + i * 4.2 + index * 4)),
      },
    ],
    deskExplanation: scenario.explanation,
    correspondence:
      "Synthetic correspondence: the desk supplied a revised dataset and requested a consistency check. No real email content is included.",
    priorIssue:
      "Synthetic prior issue: confirm that source changes are documented and comparable periods remain interpretable.",
    defaultDraft: `Could you please clarify ${scenario.name.toLowerCase()} for ${scenario.flagged.join(", ")}? Please explain the change or provide an updated series, as appropriate.`,
    demoDecision: scenario.decision,
    demoReason: scenario.reason,
  };
}

export const datasets: Dataset[] = [
  {
    id: "northstar",
    name: "Northstar (fictional)",
    submission: "DEMO-2026-02",
    previous: "DEMO-2026-01",
    items: scenarios.map((s, i) => createItem(s, i, "northstar", 1)),
  },
  {
    id: "harbor",
    name: "Harbor (fictional)",
    submission: "DEMO-2026-04",
    previous: "DEMO-2026-03",
    items: scenarios.map((s, i) => createItem(s, i, "harbor", 0.78)),
  },
];
