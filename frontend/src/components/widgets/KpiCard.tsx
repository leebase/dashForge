import type { KpiInlineData } from "../../core/spec/dashboardSpec";

interface KpiCardProps {
  data: KpiInlineData;
}

function formatValue(data: KpiInlineData) {
  return `${data.prefix ?? ""}${data.value}${data.suffix ?? ""}`;
}

export function KpiCard({ data }: KpiCardProps) {
  const deltaValue =
    typeof data.delta === "number"
      ? `${data.delta > 0 ? "+" : ""}${data.delta}${data.suffix ?? ""}`
      : null;

  return (
    <div className="kpi-card">
      <div className="kpi-card__value">{formatValue(data)}</div>
      {deltaValue ? (
        <div
          className={`kpi-card__delta ${
            data.delta && data.delta > 0 ? "kpi-card__delta--positive" : ""
          }`}
        >
          {deltaValue}
          {data.deltaLabel ? ` ${data.deltaLabel}` : ""}
        </div>
      ) : null}
      {data.caption ? <div className="kpi-card__caption">{data.caption}</div> : null}
    </div>
  );
}
