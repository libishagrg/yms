import "./OperationsUi.css";

const kpiCards = [
  { label: "Live Units In Yard", value: "186", delta: "+14 today", tone: "good" },
  { label: "Gate Throughput", value: "62 / hr", delta: "-4 vs plan", tone: "warn" },
  { label: "Avg Turnaround", value: "42m", delta: "-6m improved", tone: "good" },
  { label: "Dock Utilization", value: "81%", delta: "+3% peak hour", tone: "neutral" },
] as const;

const dockLanes = [
  { label: "Inbound Lanes", value: 84 },
  { label: "Outbound Lanes", value: 73 },
  { label: "Inspection Bays", value: 56 },
  { label: "Cross-Dock", value: 91 },
];

const activeAlerts = [
  { title: "Zone B congestion", detail: "14 units queued near Dock B-12", level: "high" },
  { title: "Carrier delay risk", detail: "3 late arrivals expected within 30 mins", level: "medium" },
  { title: "Gate 3 lane clear", detail: "Queue dropped below threshold", level: "low" },
] as const;

const recentActivity = [
  { time: "09:42", event: "Trailer TR-449 assigned to Dock D-08" },
  { time: "09:33", event: "Carrier BlueLine checked in 4 units" },
  { time: "09:21", event: "Zone C sweep completed by Yard Team 2" },
  { time: "09:08", event: "Priority move created for load LD-5521" },
  { time: "08:52", event: "Dock D-04 reopened after inspection" },
];

export default function Dashboard() {
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Dashboard</h1>
          <p className="ops-subtitle">
            Real-time snapshot of yard flow, gate pressure, and dock operations.
          </p>
        </div>
        <span className="ops-badge">Live Refresh UI</span>
      </header>

      <section className="ops-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.label} className="ops-card">
            <p className="ops-kpi-label">{card.label}</p>
            <p className="ops-kpi-value">{card.value}</p>
            <p className={`ops-kpi-delta ${card.tone}`}>{card.delta}</p>
          </article>
        ))}
      </section>

      <section className="ops-panel-grid">
        <article className="ops-card ops-card-wide">
          <div className="ops-card-header">
            <h2>Dock Lane Utilization</h2>
            <span className="ops-muted">Current shift</span>
          </div>
          <div className="ops-progress-list">
            {dockLanes.map((lane) => (
              <div key={lane.label} className="ops-progress-row">
                <div className="ops-progress-meta">
                  <span>{lane.label}</span>
                  <span>{lane.value}%</span>
                </div>
                <div className="ops-progress-track">
                  <span style={{ width: `${lane.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Active Alerts</h2>
            <span className="ops-muted">3 open</span>
          </div>
          <ul className="ops-list">
            {activeAlerts.map((alert) => (
              <li key={alert.title} className="ops-list-item">
                <div>
                  <p className="ops-list-title">{alert.title}</p>
                  <p className="ops-list-sub">{alert.detail}</p>
                </div>
                <span className={`ops-pill ${alert.level}`}>{alert.level}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="ops-panel-grid">
        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Recent Activity</h2>
            <span className="ops-muted">Last 60 mins</span>
          </div>
          <ul className="ops-timeline">
            {recentActivity.map((item) => (
              <li key={`${item.time}-${item.event}`}>
                <span>{item.time}</span>
                <p>{item.event}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="ops-card">
          <div className="ops-card-header">
            <h2>Shift Targets</h2>
            <span className="ops-muted">Visual only</span>
          </div>
          <div className="ops-target-grid">
            <div>
              <p>Planned moves</p>
              <strong>420</strong>
            </div>
            <div>
              <p>Completed</p>
              <strong>278</strong>
            </div>
            <div>
              <p>On-time rate</p>
              <strong>92%</strong>
            </div>
            <div>
              <p>Exceptions</p>
              <strong>11</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
