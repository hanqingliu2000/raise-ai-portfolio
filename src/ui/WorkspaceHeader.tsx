import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Code2, ListTree, Minus, Plus, Settings2 } from "lucide-react";
import { datasets } from "../data/synthetic";
import { IconButton } from "./primitives";
const repository = "https://github.com/hanqingliu2000/raise-ai-portfolio";
export function WorkspaceHeader({
  datasetId,
  onDatasetChange,
  decimals,
  setDecimals,
  font,
  setFont,
  groupBy,
  setGroupBy,
  relatedVisible,
  setRelatedVisible,
}: {
  datasetId: string;
  onDatasetChange: (id: string) => void;
  decimals: number;
  setDecimals: Dispatch<SetStateAction<number>>;
  font: number;
  setFont: Dispatch<SetStateAction<number>>;
  groupBy: "validation" | "indicator";
  setGroupBy: Dispatch<SetStateAction<"validation" | "indicator">>;
  relatedVisible: boolean;
  setRelatedVisible: Dispatch<SetStateAction<boolean>>;
}) {
  const [settings, setSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setSettings(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettings(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className="topbar">
      <a className="brand" href={repository} target="_blank" rel="noreferrer">
        <span className="brand-mark">
          <ListTree size={23} />
        </span>
        <span>
          <strong>
            Raise <em>AI</em>
          </strong>
          <small>Human judgment. Better context.</small>
        </span>
      </a>
      <label className="dataset">
        <span>DEMO DATASET</span>
        <select
          value={datasetId}
          onChange={(event) => onDatasetChange(event.target.value)}
          aria-label="Demo dataset"
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <div className="toolbar">
        <span className="demo-badge">Portfolio demo</span>
        <div className="precision">
          <span>DECIMALS</span>
          <div>
            <IconButton
              label="Decrease decimals"
              disabled={decimals === 0}
              onClick={() => setDecimals((d) => d - 1)}
            >
              <Minus size={14} />
            </IconButton>
            <output aria-label="Decimal places">{decimals}</output>
            <IconButton
              label="Increase decimals"
              disabled={decimals === 9}
              onClick={() => setDecimals((d) => d + 1)}
            >
              <Plus size={14} />
            </IconButton>
          </div>
        </div>
        <div className="settings-anchor" ref={menuRef}>
          <IconButton label="Settings" onClick={() => setSettings((s) => !s)}>
            <Settings2 size={19} />
          </IconButton>
          {settings && (
            <div
              className="settings-menu"
              role="dialog"
              aria-label="Workspace settings"
            >
              <h3>Workspace</h3>
              <label>
                Navigation
                <select
                  value={groupBy}
                  onChange={(event) =>
                    setGroupBy(event.target.value as typeof groupBy)
                  }
                >
                  <option value="validation">Validation → indicator</option>
                  <option value="indicator">Indicator → validation</option>
                </select>
              </label>
              <label className="inline">
                Font size
                <div>
                  <IconButton
                    label="Decrease font size"
                    disabled={font === 0}
                    onClick={() => setFont((n) => n - 1)}
                  >
                    <Minus size={15} />
                  </IconButton>
                  <span>{13 + font}</span>
                  <IconButton
                    label="Increase font size"
                    disabled={font === 4}
                    onClick={() => setFont((n) => n + 1)}
                  >
                    <Plus size={15} />
                  </IconButton>
                </div>
              </label>
              <label className="inline">
                <span>Related indicators</span>
                <input
                  type="checkbox"
                  checked={relatedVisible}
                  onChange={(e) => setRelatedVisible(e.target.checked)}
                />
              </label>
              <a href={repository} target="_blank" rel="noreferrer">
                <Code2 size={15} /> Source & project story
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
