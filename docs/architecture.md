# Architecture

This is an independent public example, not a mirror of the private system.

```text
src/data/synthetic.ts       Deterministic fictional datasets and scenarios
        |
        v
src/ui/App.tsx -----------> src/runtime/session.ts
        |                         |
        |                         v
        +----------------> src/domain/review.ts
        |                  Pure rules, formatting, selection and validation
        v
SeriesTable / SeriesChart  Shared live and evidence presentation
```

## Boundaries

- `domain/` receives explicit values. It has no browser storage, network access, framework dependency, or environment configuration.
- `runtime/` owns browser persistence, the simulated call delay, and downloads. The mock adapter calls the pure illustrative assessment function; there is no real model call.
- `ui/` owns selection, rendering, controls, and the export lifecycle. A generation token rejects a delayed assessment after the user switches items or datasets.
- `data/` generates fictional observations from arithmetic functions and hand-authored scenarios. It never imports or transforms private data.

## Decision flow

1. Load the selected item's generated observations and fictional context.
2. Evaluate the illustrative hard rule: flagged required forecasts that are null imply follow-up.
3. Otherwise return a predetermined, explicitly simulated assessment for the scenario.
4. Display the recommendation. Do not change the human follow-up state.
5. A reviewer may edit the draft and flag the item. This locks highlight and time-range edits.

This is not the private decision tree or a production-ready policy engine. The public assessment has no economic validity.

## Evidence and state

The export operation freezes the item, draft-independent highlight selection, selected years, and decimal setting. It renders shared presentation components outside the visible workspace. The chart is 1000 x 480 CSS pixels; table width expands to show complete values for every selected year. Related indicators are included independently of their on-screen visibility. The resulting composite PNG has a synthetic-data label and no interactive slider.

Review state is keyed by dataset plus item ID and saved under a versioned browser-storage key. Parsing validates the stored values; illustrative analysis is recomputed rather than trusting saved prose. Storage failure produces an explicit in-memory-only notice.

## Tests

Unit tests cover rule routing, absence versus zero, year-set operations, formatting, and stored-state validation. Browser tests cover the actual review workflow, delayed-response isolation, evidence locking, export downloads, and responsive container bounds. Public CI uses only generated fixtures and has no secrets.
