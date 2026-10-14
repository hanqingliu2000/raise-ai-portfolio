export type Decision = "raise" | "borderline" | "not_raise";
export type Severity = "critical" | "high" | "low";
export type Observation = {
  year: number;
  current: number | null;
  previous: number | null;
  published: number | null;
};
export type RelatedSeries = {
  code: string;
  descriptor: string;
  values: number[];
};
export type ReviewItem = {
  id: string;
  sector: string;
  code: string;
  name: string;
  unit: string;
  validation: string;
  severity: Severity;
  kind: "missing_forecast" | "revision" | "consistency";
  flagged: number[];
  observations: Observation[];
  related: RelatedSeries[];
  deskExplanation: string;
  correspondence: string;
  priorIssue: string;
  defaultDraft: string;
  demoDecision: Decision;
  demoReason: string;
};
export type Dataset = {
  id: string;
  name: string;
  submission: string;
  previous: string;
  items: ReviewItem[];
};
export type Analysis = {
  decision: Decision;
  reason: string;
  source: "programmatic rule" | "simulated AI";
  rule: string;
};
export type ItemState = {
  visited: boolean;
  raised: boolean;
  draft: string;
  highlights: number[];
  range: [number, number];
  analysis: Analysis | null;
};
export type Session = Record<string, ItemState>;
