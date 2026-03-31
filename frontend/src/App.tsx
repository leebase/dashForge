import { DashboardRenderer } from "./components/DashboardRenderer";
import { StaticDataAdapter } from "./core/data/StaticDataAdapter";
import { sampleDashboard } from "./sample/sampleDashboard";

const adapter = new StaticDataAdapter();

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Sprint 1 Foundation</p>
        <h1>{sampleDashboard.meta.title}</h1>
        <p className="lede">
          First vertical slice of the canonical DashForge architecture: a
          validated DashboardSpec rendered through a runtime shell and adapter
          contract.
        </p>
      </header>

      <DashboardRenderer adapter={adapter} spec={sampleDashboard} />
    </main>
  );
}
