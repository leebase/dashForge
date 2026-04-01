import type { ReactNode } from "react";

type BoxState = "ready" | "loading" | "empty" | "error";

interface DashboardBoxProps {
  title: string;
  subtitle?: string;
  state?: BoxState;
  message?: string;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

const stateCopy: Record<Exclude<BoxState, "ready">, string> = {
  loading: "Loading widget data...",
  empty: "No data is available for this widget yet.",
  error: "This widget could not be rendered.",
};

export function DashboardBox({
  title,
  subtitle,
  state = "ready",
  message,
  children,
  className,
  bodyClassName,
}: DashboardBoxProps) {
  return (
    <section
      aria-label={title}
      className={className ? `dashboard-box ${className}` : "dashboard-box"}
    >
      <header className="dashboard-box__header">
        <div>
          <h2 className="dashboard-box__title">{title}</h2>
          {subtitle ? (
            <p className="dashboard-box__subtitle">{subtitle}</p>
          ) : null}
        </div>
      </header>

      <div
        className={
          bodyClassName
            ? `dashboard-box__body ${bodyClassName}`
            : "dashboard-box__body"
        }
      >
        {state === "ready" ? (
          children
        ) : (
          <div className="dashboard-box__state" role="status">
            {message ?? stateCopy[state]}
          </div>
        )}
      </div>
    </section>
  );
}
