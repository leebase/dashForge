import type { TableInlineData } from "../../core/spec/dashboardSpec";

interface TableChartProps {
  data: TableInlineData;
}

function formatCellValue(value: unknown, format?: string): string {
  if (typeof value === "number") {
    if (format === "percent") {
      return `${Math.round(value * 100)}%`;
    }
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (format === "decimal-1") {
      return value.toFixed(1);
    }
    if (format === "decimal-2") {
      return value.toFixed(2);
    }
  }

  if (value === null || value === undefined) {
    return "—";
  }

  return String(value);
}

export function TableChart({ data }: TableChartProps) {
  return (
    <div className="table-chart">
      <div className="table-chart__scroll">
        <table className="table-chart__table">
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th
                  className={`table-chart__cell table-chart__cell--${column.align ?? "left"}`}
                  key={column.key}
                  scope="col"
                >
                  {column.label ?? column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {data.columns.map((column) => (
                  <td
                    className={`table-chart__cell table-chart__cell--${column.align ?? "left"}`}
                    key={`${rowIndex}-${column.key}`}
                  >
                    {formatCellValue(row[column.key], column.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.caption ? <div className="chart-card__caption">{data.caption}</div> : null}
    </div>
  );
}
