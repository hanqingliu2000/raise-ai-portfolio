import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Flag,
  ListTree,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { toPng } from "html-to-image";
import { datasets } from "../data/synthetic";
import { changeRange, initialState, togglePeriod } from "../domain/review";
import type { ItemState, ReviewItem } from "../domain/types";
import {
  download,
  loadSession,
  runDemoAnalysis,
  saveSession,
} from "../runtime/session";
import { SeriesTable } from "./SeriesTable";
import { SeriesChart } from "./SeriesChart";
import { IconButton, ChartTitle } from "./primitives";
import { ReviewPanel } from "./ReviewPanel";
import { WorkspaceHeader } from "./WorkspaceHeader";

export function App() {
  const [datasetId, setDatasetId] = useState(datasets[0].id);
  const dataset = datasets.find((d) => d.id === datasetId)!;
  const [itemId, setItemId] = useState(dataset.items[0].id);
  const item = dataset.items.find((i) => i.id === itemId) ?? dataset.items[0];
  const [session, setSession] = useState(loadSession);
  const state = session[item.id] ?? initialState(item);
  const [decimals, setDecimals] = useState(2);
  const [font, setFont] = useState(0);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"validation" | "indicator">(
    "validation",
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [relatedVisible, setRelatedVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(270);
  const [rightWidth, setRightWidth] = useState(320);
  const [mobileNav, setMobileNav] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [evidence, setEvidence] = useState<{
    item: ReviewItem;
    state: ItemState;
    decimals: number;
  } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const storageWarned = useRef(false);

  const update = (patch: Partial<ItemState>) =>
    setSession((previous) => ({
      ...previous,
      [item.id]: { ...(previous[item.id] ?? initialState(item)), ...patch },
    }));
  const select = (next: ReviewItem) => {
    generation.current += 1;
    setBusy(false);
    setItemId(next.id);
    setMobileNav(false);
  };
  const filtered = dataset.items.filter((i) =>
    `${i.code} ${i.name} ${i.validation}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const raised = dataset.items.filter((i) => session[i.id]?.raised).length;
  const visited = dataset.items.filter((i) => session[i.id]?.visited).length;

  useEffect(() => {
    setSession((previous) => ({
      ...previous,
      [item.id]: {
        ...(previous[item.id] ?? initialState(item)),
        visited: true,
      },
    }));
  }, [item.id]);
  useEffect(() => {
    if (!saveSession(session) && !storageWarned.current) {
      storageWarned.current = true;
      setNotice(
        "Browser storage is unavailable. Progress will last until this page closes.",
      );
    }
  }, [session]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const analyze = async () => {
    const token = ++generation.current;
    const id = item.id;
    setBusy(true);
    const analysis = await runDemoAnalysis(item);
    if (generation.current !== token) return;
    setSession((previous) => ({
      ...previous,
      [id]: { ...(previous[id] ?? initialState(item)), analysis },
    }));
    setBusy(false);
  };

  const resize = (
    event: React.PointerEvent<HTMLDivElement>,
    side: "left" | "right",
  ) => {
    const start = event.clientX;
    const width = side === "left" ? leftWidth : rightWidth;
    event.currentTarget.setPointerCapture(event.pointerId);
    const element = event.currentTarget;
    const move = (e: PointerEvent) => {
      const value = Math.max(
        240,
        Math.min(
          side === "left" ? 360 : 420,
          width + (e.clientX - start) * (side === "left" ? 1 : -1),
        ),
      );
      if (side === "left") setLeftWidth(value);
      else setRightWidth(value);
    };
    const stop = () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", stop);
      element.removeEventListener("pointercancel", stop);
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);
  };

  const exportEvidence = async () => {
    if (exporting) return;
    setExporting(true);
    setEvidence({
      item,
      state: {
        ...state,
        highlights: [...state.highlights],
        range: [...state.range],
      },
      decimals,
    });
  };
  useEffect(() => {
    if (!evidence || !evidenceRef.current) return;
    let cancelled = false;
    const render = async () => {
      try {
        await document.fonts.ready;
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (cancelled || !evidenceRef.current) return;
        const url = await toPng(evidenceRef.current, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: false,
        });
        if (cancelled) return;
        const link = document.createElement("a");
        link.download = `demo-evidence-${evidence.item.code}.png`;
        link.href = url;
        link.click();
        setNotice("Synthetic evidence exported.");
      } catch {
        if (!cancelled)
          setNotice(
            "Evidence export failed. Please try again in a current browser.",
          );
      } finally {
        if (!cancelled) {
          setExporting(false);
          setEvidence(null);
        }
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [evidence]);

  const keyboardNavigate = (event: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    if ((event.target as HTMLElement).closest("input,select,textarea")) return;
    event.preventDefault();
    if (event.repeat) return;
    const visibleItems = filtered.filter(
      (entry) =>
        navRef.current?.querySelector<HTMLElement>(`[data-item="${entry.id}"]`)
          ?.offsetParent,
    );
    const visibleIndex = visibleItems.findIndex(
      (entry) => entry.id === item.id,
    );
    const next =
      visibleItems[
        Math.max(
          0,
          Math.min(
            visibleItems.length - 1,
            visibleIndex + (event.key === "ArrowDown" ? 1 : -1),
          ),
        )
      ];
    if (!next) return;
    select(next);
    requestAnimationFrame(() => {
      const target = navRef.current?.querySelector<HTMLButtonElement>(
        `[data-item="${next.id}"]`,
      );
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest" });
    });
  };

  return (
    <div
      className="app"
      onKeyDown={(event) => {
        if (event.key === "Escape") setMobileNav(false);
      }}
      style={
        {
          "--left-width": `${leftWidth}px`,
          "--right-width": `${rightWidth}px`,
          "--workspace-font": `${13 + font}px`,
        } as CSSProperties
      }
    >
      <WorkspaceHeader
        datasetId={datasetId}
        onDatasetChange={(id) => {
          const next = datasets.find((d) => d.id === id)!;
          generation.current += 1;
          setBusy(false);
          setDatasetId(id);
          setItemId(next.items[0].id);
          setQuery("");
        }}
        decimals={decimals}
        setDecimals={setDecimals}
        font={font}
        setFont={setFont}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        relatedVisible={relatedVisible}
        setRelatedVisible={setRelatedVisible}
      />
      <div className="mobile-heading">
        <button onClick={() => setMobileNav((v) => !v)}>
          <ListTree size={16} /> Review items <ChevronDown size={14} />
        </button>
        <span>
          {visited}/{dataset.items.length} viewed
        </span>
      </div>
      <div className="workspace">
        <nav
          className={`navigation ${mobileNav ? "mobile-open" : ""}`}
          aria-label="Review items"
          ref={navRef}
          onKeyDown={keyboardNavigate}
        >
          <div className="nav-heading">
            <div>
              <span className="eyebrow">REVIEW QUEUE</span>
              <h2>Validation checks</h2>
            </div>
            <span className="count">{dataset.items.length}</span>
          </div>
          <div className="search">
            <Search size={16} />
            <input
              aria-label="Search indicators"
              placeholder="Search indicators"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="nav-list">
            {[...new Set(filtered.map((i) => i.sector))].map((sector) => (
              <details className="sector" open key={sector}>
                <summary>
                  {sector}
                  <ChevronDown size={14} />
                </summary>
                {filtered
                  .filter((i) => i.sector === sector)
                  .map((entry) => (
                    <details className="validation" open key={entry.id}>
                      <summary>
                        <span
                          className={`severity ${entry.severity}`}
                          aria-label={`${entry.severity} severity`}
                        />
                        <span>
                          {groupBy === "validation"
                            ? entry.validation
                            : entry.code}
                        </span>
                        <ChevronRight size={12} />
                      </summary>
                      <button
                        className={`nav-item ${entry.id === item.id ? "selected" : ""} ${session[entry.id]?.visited ? "visited" : ""}`}
                        data-item={entry.id}
                        aria-current={entry.id === item.id ? "true" : undefined}
                        onClick={() => select(entry)}
                      >
                        <span>
                          {groupBy === "validation"
                            ? entry.code
                            : entry.validation}
                        </span>
                        {session[entry.id]?.raised && (
                          <Flag
                            size={14}
                            className="raised-flag"
                            aria-label="Flagged for follow-up"
                          />
                        )}
                      </button>
                    </details>
                  ))}
              </details>
            ))}
            {!filtered.length && (
              <p className="empty">No matching indicators.</p>
            )}
          </div>
          <div className="nav-footer">
            <span>
              <b>{visited}</b> viewed
            </span>
            <span>
              <Flag size={13} /> {raised} for follow-up
            </span>
          </div>
        </nav>
        <div
          className="resizer"
          role="separator"
          aria-label="Navigation width"
          aria-orientation="vertical"
          aria-valuemin={240}
          aria-valuemax={360}
          aria-valuenow={leftWidth}
          tabIndex={0}
          onPointerDown={(e) => resize(e, "left")}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              setLeftWidth((v) =>
                Math.max(
                  240,
                  Math.min(360, v + (e.key === "ArrowRight" ? 10 : -10)),
                ),
              );
            }
          }}
        />
        <main className="review-surface">
          <div className="surface-label">
            <span>Submission comparison</span>
            <span>
              {dataset.submission} <span className="muted">vs</span>{" "}
              {dataset.previous}
            </span>
          </div>
          <SeriesTable
            item={item}
            range={state.range}
            highlights={state.highlights}
            decimals={decimals}
            locked={state.raised}
            onToggle={(year) =>
              update({ highlights: togglePeriod(state.highlights, year) })
            }
          />
          <section className="chart-section" aria-label="Indicator chart">
            <ChartTitle item={item} />
            <div className="chart-controls">
              <div className="legend">
                <span className="current">Current</span>
                <span className="previous">Previous</span>
                <span className="published">Published</span>
              </div>
              <IconButton
                label="Restore default highlights"
                disabled={
                  state.raised ||
                  [...state.highlights].sort().join() ===
                    [...item.flagged].sort().join()
                }
                onClick={() => update({ highlights: [...item.flagged] })}
              >
                <RotateCcw size={15} />
              </IconButton>
            </div>
            <SeriesChart
              item={item}
              highlights={state.highlights}
              range={state.range}
              locked={state.raised}
              onSelect={(start, end, remove, click) =>
                update({
                  highlights: click
                    ? remove
                      ? state.highlights.filter((p) => p !== start)
                      : togglePeriod(state.highlights, start)
                    : changeRange(state.highlights, start, end, remove),
                })
              }
            />
            <div className="time-range">
              <label>
                From{" "}
                <input
                  type="range"
                  aria-label="Start year"
                  min={2014}
                  max={state.range[1]}
                  value={state.range[0]}
                  disabled={state.raised}
                  onChange={(e) =>
                    update({ range: [+e.target.value, state.range[1]] })
                  }
                />
                <output>{state.range[0]}</output>
              </label>
              <label>
                To{" "}
                <input
                  type="range"
                  aria-label="End year"
                  min={state.range[0]}
                  max={2030}
                  value={state.range[1]}
                  disabled={state.raised}
                  onChange={(e) =>
                    update({ range: [state.range[0], +e.target.value] })
                  }
                />
                <output>{state.range[1]}</output>
              </label>
            </div>
          </section>
          {relatedVisible && (
            <section className="related-section">
              <div className="section-heading">
                <h2>Related indicators</h2>
                <span>{item.related.length} series</span>
              </div>
              <SeriesTable
                item={item}
                range={state.range}
                highlights={state.highlights}
                decimals={decimals}
                related
                locked={state.raised}
                onToggle={(year) =>
                  update({ highlights: togglePeriod(state.highlights, year) })
                }
              />
            </section>
          )}
        </main>
        <div
          className="resizer"
          role="separator"
          aria-label="Review panel width"
          aria-orientation="vertical"
          aria-valuemin={240}
          aria-valuemax={420}
          aria-valuenow={rightWidth}
          tabIndex={0}
          onPointerDown={(e) => resize(e, "right")}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              setRightWidth((v) =>
                Math.max(
                  240,
                  Math.min(420, v + (e.key === "ArrowLeft" ? 10 : -10)),
                ),
              );
            }
          }}
        />
        <ReviewPanel
          key={item.id}
          item={item}
          state={state}
          busy={busy}
          analyze={analyze}
          update={update}
          setNotice={setNotice}
          exporting={exporting}
          exportEvidence={exportEvidence}
        />
      </div>
      <footer className="statusbar">
        <span>
          <ShieldCheck size={13} /> Synthetic data only · No live AI or company
          services
        </span>
        <button
          onClick={() => {
            const entries = dataset.items
              .filter((i) => session[i.id]?.raised)
              .map((i) => ({
                indicator: i.code,
                validation: i.validation,
                draft: session[i.id].draft,
                highlights: session[i.id].highlights,
              }));
            download(
              JSON.stringify(
                {
                  demo: true,
                  dataset: dataset.name,
                  submission: dataset.submission,
                  items: entries,
                },
                null,
                2,
              ),
              "demo-review-summary.json",
              "application/json",
            );
            setNotice(`Exported ${entries.length} follow-up items.`);
          }}
        >
          <Download size={13} /> Export review summary
        </button>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <IconButton
            label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </IconButton>
        </div>
      )}
      {evidence && (
        <div className="evidence-host" aria-hidden="true">
          <div
            ref={evidenceRef}
            className="evidence-surface"
            style={{
              width: Math.max(
                1060,
                (evidence.state.range[1] - evidence.state.range[0] + 1) *
                  Math.max(80, 61 + evidence.decimals * 8) +
                  400,
              ),
            }}
          >
            <div className="evidence-label">
              RAISE AI · SYNTHETIC DEMO EVIDENCE
            </div>
            <SeriesTable
              item={evidence.item}
              range={evidence.state.range}
              highlights={evidence.state.highlights}
              decimals={evidence.decimals}
              capture
            />
            <ChartTitle item={evidence.item} />
            <div className="legend">
              <span className="current">Current</span>
              <span className="previous">Previous</span>
              <span className="published">Published</span>
            </div>
            <SeriesChart
              item={evidence.item}
              range={evidence.state.range}
              highlights={evidence.state.highlights}
              locked
              capture
            />
            <h2>Related indicators</h2>
            <SeriesTable
              item={evidence.item}
              range={evidence.state.range}
              highlights={evidence.state.highlights}
              decimals={evidence.decimals}
              related
              capture
            />
          </div>
        </div>
      )}
    </div>
  );
}
