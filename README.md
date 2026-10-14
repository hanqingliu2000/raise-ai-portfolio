# Raise AI · Portfolio Demo

### Human-in-the-loop AI analysis, with expert judgment at the center.

**Designed and developed by [Hanqing Liu](https://github.com/hanqingliu2000).** This repository is an independent, runnable example of an AI-assisted data-review workbench. It uses **entirely synthetic data and simulated AI responses**. The real project repository is **private**; its code, data, internal prompts, correspondence, and evaluation benchmark are not published here.

[Explore the code](src) · [Architecture](docs/architecture.md) · [Demo walkthrough](docs/demo-walkthrough.md) · [Privacy & scope](docs/privacy-and-scope.md)

## The project behind the demo

**Human-in-the-loop AI analysis.** I proposed and designed Raise AI for World Economic Outlook (WEO) data review, embedding LLM recommendations within a decision-tree-based workflow that combines programmatic rules and expert judgment. I integrated submissions, correspondence, submission histories, and prior issues into LLM API inputs, and refined prompts and decision logic using few-shot examples and borderline cases. During internal piloting, review time decreased from approximately **30 to 5 minutes**.

**Systematic AI evaluation.** I evaluated AI outputs against an **800–900-item consensus benchmark established by four senior reviewers**, covering approximately **20 countries and 100 case types**. I investigated context-related disagreements and refined model inputs, achieving **over 90% agreement with expert judgments**. I prioritized minimizing missed issues, aiming for near-zero false negatives while iteratively reducing false positives, and retained human review of every item and final approval authority.

These are author-reported results and responsibilities from the private project, not results measured on this public demo. The internal benchmark and supporting records are not included, so these figures cannot be independently reproduced from this repository. Agreement is not equivalent to recall; near-zero false negatives is an optimization objective, not a guaranteed measured result. This is a personal portfolio example, not an official organizational release or endorsement. The public demo does not claim that every research direction above is deployed in production.

## What this demonstrates

The interesting challenge is not simply calling an LLM. It is building a review workflow in which people can inspect the evidence, understand a recommendation, correct it, and remain accountable for the result.

- **Context-rich review:** compare current, previous, and published time series alongside an explanation and a transparent synthetic context bundle.
- **Rules before model judgment:** an illustrative missing-forecast rule routes directly to follow-up; other cases use explicitly labeled, deterministic simulated assessments.
- **Human approval, always:** a recommendation never flags an item automatically. The reviewer edits the draft and decides whether to follow up.
- **Evidence consistency:** synchronized chart/table highlights, restored defaults, per-item state, and selection locking after a follow-up decision.
- **Layout-independent evidence:** export a frozen, separately rendered PNG using the same chart and table components; a hidden related table can still appear in evidence.
- **Practical analytical UI:** searchable hierarchical navigation, keyboard traversal, resizable side panels, precision controls, responsive layouts, and automatic chart rescaling.
- **Explicit engineering boundaries:** pure decision functions are separated from browser persistence and orchestration; automated tests cover business rules and review interactions.

## Run it

Requirements: **Node.js 22.12+**, with Node 24 recommended, and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. No backend, account, API key, employer network, or external AI service is required. Once loaded, review interactions run in the browser. Progress is stored locally in this browser; clearing site data resets it.

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## A two-minute walkthrough

1. Open **Northstar**, a fictional dataset. Inspect the highlighted historical revision in `OUTPUT_IDX`.
2. Run the demo assessment and inspect the **Context** tab. Compare the recommendation with the data yourself.
3. Click a table value or click/drag across the plot to change highlighted years. Right-drag removes years. The two tables and chart stay synchronized.
4. Edit the reviewer draft and **Flag for follow-up**. The evidence selection and year range become read-only until unflagged.
5. Export evidence as PNG or export a JSON review summary. Switch to another item and return: local progress is preserved.
6. Inspect `INVEST_IDX` for a hard-rule example, or `PRICE_IDX` for a borderline case.

## Implementation at a glance

| Layer                     | Public implementation                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| UI                        | React, TypeScript, CSS, Lucide icons                                        |
| Time-series visualization | Recharts; straight-line interpolation and visible-range y-axis scaling      |
| Decision logic            | Small, testable rule functions plus a deterministic mock assessment adapter |
| Context                   | Programmatically generated series and hand-authored fictional notes         |
| State                     | Per-item browser storage, with versioning and validation                    |
| Evidence                  | Reused presentation components, frozen export state, `html-to-image`        |
| Quality                   | Type checking, Vitest, Playwright, dependency audit, CI                     |
| Hosting                   | Static build; optional GitHub Pages deployment                              |

## Deliberate differences from the private system

This example has no real LLM integration, ingestion service, authentication, historical-submission store, email delivery, shared user state, full policy catalog, or internal evaluation data. "Previous" and "Published" are generated comparison series, not live submissions or publication records. The Context tab illustrates the shape of an input bundle; it does not send anything to an API.

Evidence export includes all years within the selected slider range, even when a table is horizontally scrolled. It is not a copy of the private system's viewport-based evidence policy. Data and decisions are illustrative and must not be used for economic analysis.

## What I would discuss in an interview

- Turning reviewer reasoning into explicit rules, AI judgment stages, and human approval gates.
- Designing evaluation around expert consensus and investigating disagreements, not only chasing headline accuracy.
- Managing false-negative risk without hiding uncertainty or automating away accountability.
- Promoting experimental features into maintainable systems with clear runtime/service boundaries.
- Shipping iterative UI improvements through scoped issues, branches, tests, and real-user feedback.

## License & attribution

The independently written code in **this example repository** is available under the [MIT License](LICENSE). This license does not apply to the private project or any employer-owned material. Third-party dependencies retain their own licenses. The visual identity here uses a new, generic icon treatment rather than assets copied from the private repository.
