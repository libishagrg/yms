import "./OperationsUi.css";

const zonePulse = [
  { zone: "Zone A", occupancy: 72, queue: 4, target: "Stable" },
  { zone: "Zone B", occupancy: 91, queue: 12, target: "Over target" },
  { zone: "Zone C", occupancy: 64, queue: 3, target: "Stable" },
  { zone: "Zone D", occupancy: 83, queue: 8, target: "Watch" },
] as const;

const dispatchWindows = [
  { slot: "10:00 - 10:30", lane: "Outbound 2", carrier: "BlueLine", count: 8 },
  { slot: "10:30 - 11:00", lane: "Outbound 1", carrier: "PrimeCargo", count: 6 },
  { slot: "11:00 - 11:30", lane: "Cross Dock", carrier: "NorthHaul", count: 5 },
] as const;

const snapshot = [
  { label: "Units In Yard", value: "186", tone: "neutral" },
  { label: "Moves Completed", value: "278", tone: "good" },
  { label: "Gate In (hour)", value: "38", tone: "good" },
  { label: "Gate Out (hour)", value: "24", tone: "warn" },
  { label: "Avg Dwell", value: "42m", tone: "good" },
  { label: "Exceptions", value: "11", tone: "high" },
] as const;

const bottlenecks = ["Dock D-12 turnover delay", "Zone B queue spillover", "Carrier Atlas late arrivals"];

function pulseTone(occupancy: number) {
  if (occupancy >= 90) return "high";
  if (occupancy >= 80) return "warn";
  return "good";
}

export default function Dashboard() {
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Dashboard</h1>
          <p className="ops-subtitle">
            Command center view for yard pulse, dispatch windows, and pressure points.
          </p>
        </div>
        <span className="ops-badge">Shift A</span>
      </header>

      <section className="ops-card dash-hero">
        <div className="dash-hero-main">
          <p className="dash-overline">Current Focus</p>
          <h2>Balance outbound flow from Zone B before 11:00 cutoff.</h2>
          <p>
            Prioritize Dock D-08 and D-12 for release sequence. Gate 2 queue is rising faster than
            forecast.
          </p>
        </div>
        <div className="dash-hero-stats">
          <div>
            <p>On-time Dispatch</p>
            <strong>92%</strong>
          </div>
          <div>
            <p>Open Tasks</p>
            <strong>17</strong>
          </div>
          <div>
            <p>Blocked Units</p>
            <strong>5</strong>
          </div>
        </div>
      </section>

      <section className="dash-main-grid">
        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Live Yard Pulse</h2>
            <span className="ops-muted">By zone</span>
          </div>
          <div className="ops-progress-list">
            {zonePulse.map((zone) => (
              <div key={zone.zone} className="ops-progress-row">
                <div className="ops-progress-meta">
                  <span>{zone.zone}</span>
                  <span>
                    {zone.occupancy}% | Queue {zone.queue}
                  </span>
                </div>
                <div className="ops-progress-track">
                  <span style={{ width: `${zone.occupancy}%` }} />
                </div>
                <span className={`ops-pill ${pulseTone(zone.occupancy)}`}>{zone.target}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Dispatch Windows</h2>
            <span className="ops-muted">Next 90 mins</span>
          </div>
          <div className="dash-window-list">
            {dispatchWindows.map((window) => (
              <article key={window.slot} className="dash-window-item">
                <p className="dash-window-time">{window.slot}</p>
                <p className="dash-window-main">
                  {window.lane} • {window.carrier}
                </p>
                <span className="ops-pill neutral">{window.count} loads</span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="dash-bottom-grid">
        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Operational Snapshot</h2>
            <span className="ops-muted">Live values</span>
          </div>
          <div className="dash-snapshot-grid">
            {snapshot.map((item) => (
              <div key={item.label} className="dash-snapshot-item">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <span className={`dash-dot ${item.tone}`} />
              </div>
            ))}
          </div>
        </article>

        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Top Bottlenecks</h2>
            <span className="ops-muted">Needs attention</span>
          </div>
          <ul className="dash-bottleneck-list">
            {bottlenecks.map((item) => (
              <li key={item}>
                <span className="dash-alert-dot" />
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
