import "./OperationsUi.css";

const summaryCards = [
  { label: "Total Units", value: "248" },
  { label: "At Dock", value: "91" },
  { label: "In Transit Yard", value: "64" },
  { label: "Hold / Inspection", value: "12" },
];

const unitRows = [
  {
    unitId: "TR-449",
    type: "Trailer",
    carrier: "BlueLine",
    zone: "Zone C",
    dock: "D-08",
    status: "At Dock",
    eta: "Ready 10:15",
  },
  {
    unitId: "TRK-112",
    type: "Truck",
    carrier: "NorthHaul",
    zone: "Zone A",
    dock: "Queued",
    status: "Waiting",
    eta: "ETA 09:58",
  },
  {
    unitId: "TR-337",
    type: "Trailer",
    carrier: "PrimeCargo",
    zone: "Zone B",
    dock: "D-03",
    status: "Loading",
    eta: "Depart 10:40",
  },
  {
    unitId: "TR-590",
    type: "Trailer",
    carrier: "Atlas",
    zone: "Inspection",
    dock: "Bay 2",
    status: "Hold",
    eta: "Await review",
  },
  {
    unitId: "TRK-204",
    type: "Truck",
    carrier: "MetroFleet",
    zone: "Zone D",
    dock: "D-17",
    status: "Unloading",
    eta: "Ready 10:22",
  },
];

function statusTone(status: string) {
  if (status === "At Dock" || status === "Loading" || status === "Unloading") return "good";
  if (status === "Waiting") return "warn";
  return "high";
}

export default function VehiclesTrailers() {
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Vehicles / Trailers</h1>
          <p className="ops-subtitle">
            Dummy fleet board for current yard positioning and dock assignment view.
          </p>
        </div>
      </header>

      <section className="ops-kpi-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="ops-card">
            <p className="ops-kpi-label">{card.label}</p>
            <p className="ops-kpi-value">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Unit Board</h2>
          <div className="ops-chip-row">
            <span className="ops-chip active">All</span>
            <span className="ops-chip">Trucks</span>
            <span className="ops-chip">Trailers</span>
            <span className="ops-chip">On Hold</span>
          </div>
        </div>

        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Type</th>
                <th>Carrier</th>
                <th>Zone</th>
                <th>Dock</th>
                <th>Status</th>
                <th>ETA / Plan</th>
              </tr>
            </thead>
            <tbody>
              {unitRows.map((unit) => (
                <tr key={unit.unitId}>
                  <td>{unit.unitId}</td>
                  <td>{unit.type}</td>
                  <td>{unit.carrier}</td>
                  <td>{unit.zone}</td>
                  <td>{unit.dock}</td>
                  <td>
                    <span className={`ops-pill ${statusTone(unit.status)}`}>{unit.status}</span>
                  </td>
                  <td>{unit.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
