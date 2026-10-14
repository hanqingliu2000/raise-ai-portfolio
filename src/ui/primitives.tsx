import type { ReviewItem } from "../domain/types";
export function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className="icon-button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function ChartTitle({ item }: { item: ReviewItem }) {
  return (
    <div className="chart-title">
      <div>
        <h1>{item.code}</h1>
        <p>{item.name}</p>
      </div>
      <span>{item.unit}</span>
    </div>
  );
}
