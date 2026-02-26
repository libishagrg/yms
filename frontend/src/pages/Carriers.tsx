import "./OperationsUi.css";

const carriers = [
  { name: "BlueLine Logistics", activeLoads: 34, onTime: 96, avgDwell: "39m", risk: "Low" },
  { name: "PrimeCargo", activeLoads: 28, onTime: 91, avgDwell: "44m", risk: "Medium" },
  { name: "NorthHaul", activeLoads: 19, onTime: 87, avgDwell: "53m", risk: "Medium" },
  { name: "Atlas Freight", activeLoads: 16, onTime: 81, avgDwell: "61m", risk: "High" },
];

const todaysLoads = [
  {
    loadId: "LD-5521",
    carrier: "BlueLine Logistics",
    route: "Plant A -> Yard N1",
    status: "Arrived",
    eta: "09:18",
  },
  {
    loadId: "LD-5528",
    carrier: "PrimeCargo",
    route: "Port C -> Yard N2",
    status: "In Transit",
    eta: "10:02",
  },
  {
    loadId: "LD-5533",
    carrier: "Atlas Freight",
    route: "Warehouse B -> Yard S1",
    status: "Delayed",
    eta: "10:26",
  },
  {
    loadId: "LD-5539",
    carrier: "NorthHaul",
    route: "Hub D -> Yard N1",
    status: "At Gate",
    eta: "09:52",
  },
];

function riskTone(risk: string) {
  if (risk === "Low") return "good";
  if (risk === "Medium") return "warn";
  return "high";
}

function loadTone(status: string) {
  if (status === "Arrived" || status === "At Gate") return "good";
  if (status === "In Transit") return "neutral";
  return "high";
}

export default function Carriers() {
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Carriers</h1>
          <p className="ops-subtitle">
            Carrier-level analytics view with dummy KPIs and today&apos;s load board.
          </p>
        </div>
      </header>

      <section className="ops-kpi-grid">
        <article className="ops-card">
          <p className="ops-kpi-label">Active Carriers</p>
          <p className="ops-kpi-value">{carriers.length}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Total Active Loads</p>
          <p className="ops-kpi-value">
            {carriers.reduce((acc, carrier) => acc + carrier.activeLoads, 0)}
          </p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Avg On-time</p>
          <p className="ops-kpi-value">
            {Math.round(carriers.reduce((acc, carrier) => acc + carrier.onTime, 0) / carriers.length)}%
          </p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Loads With Risk</p>
          <p className="ops-kpi-value">
            {carriers.filter((carrier) => carrier.risk !== "Low").length}
          </p>
        </article>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Carrier Performance Snapshot</h2>
        </div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Active Loads</th>
                <th>On-time</th>
                <th>Avg Dwell</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((carrier) => (
                <tr key={carrier.name}>
                  <td>{carrier.name}</td>
                  <td>{carrier.activeLoads}</td>
                  <td>{carrier.onTime}%</td>
                  <td>{carrier.avgDwell}</td>
                  <td>
                    <span className={`ops-pill ${riskTone(carrier.risk)}`}>{carrier.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Today&apos;s Loads</h2>
          <span className="ops-muted">Dummy data</span>
        </div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Load ID</th>
                <th>Carrier</th>
                <th>Route</th>
                <th>Status</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {todaysLoads.map((load) => (
                <tr key={load.loadId}>
                  <td>{load.loadId}</td>
                  <td>{load.carrier}</td>
                  <td>{load.route}</td>
                  <td>
                    <span className={`ops-pill ${loadTone(load.status)}`}>{load.status}</span>
                  </td>
                  <td>{load.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
