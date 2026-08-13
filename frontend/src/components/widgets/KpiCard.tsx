import type { KpiInlineData } from "../../core/spec/dashboardSpec";

interface KpiCardProps {
  data: KpiInlineData;
  deltaFormat?: "percent" | "absolute";
  deltaPositive?: "good" | "bad";
}

function formatValue(data: KpiInlineData) {
  return `${data.prefix ?? ""}${data.value}${data.suffix ?? ""}`;
}

export function KpiCard({
  data,
  deltaFormat,
  deltaPositive = "good",
}: KpiCardProps) {
  const delta = data.delta;
  const deltaIsGood =
    typeof delta === "number" &&
    delta !== 0 &&
    ((delta > 0 && deltaPositive === "good") ||
      (delta < 0 && deltaPositive === "bad"));
  const deltaIsBad =
    typeof delta === "number" && delta !== 0 && !deltaIsGood;
  const deltaSign =
    typeof delta === "number" && delta > 0
      ? "+"
      : typeof delta === "number" && delta < 0
        ? "-"
        : "";
  const deltaPrefix = deltaFormat === "absolute" ? (data.prefix ?? "") : "";
  const deltaSuffix =
    deltaFormat === "percent"
      ? "%"
      : deltaFormat === "absolute"
        ? ""
        : (data.suffix ?? "");
  const deltaValue = typeof delta === "number"
    ? `${deltaSign}${deltaPrefix}${Math.abs(delta)}${deltaSuffix}`
    : null;

  return (
    <div className="kpi-card">
      <div className="kpi-card__value">{formatValue(data)}</div>
      {deltaValue ? (
        <div
          className={[
            "kpi-card__delta",
            deltaIsGood ? "kpi-card__delta--good" : "",
            deltaIsBad ? "kpi-card__delta--bad" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-tone={deltaIsGood ? "good" : deltaIsBad ? "bad" : "neutral"}
        >
          {deltaValue}
          {data.deltaLabel ? ` ${data.deltaLabel}` : ""}
        </div>
      ) : null}
      {data.caption ? (
        <div className="kpi-card__caption">{data.caption}</div>
      ) : null}
    </div>
  );
}
