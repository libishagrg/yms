import "./OperationsUi.css";

const gateEvents = [
  {
    time: "09:46",
    movement: "Gate In",
    unit: "TRK-112",
    carrier: "NorthHaul",
    dock: "Queue A",
    status: "Cleared",
  },
  {
    time: "09:39",
    movement: "Gate Out",
    unit: "TR-337",
    carrier: "PrimeCargo",
    dock: "D-03",
    status: "Released",
  },
  {
    time: "09:31",
    movement: "Gate In",
    unit: "TR-590",
    carrier: "Atlas",
    dock: "Inspection",
    status: "Hold",
  },
  {
    time: "09:22",
    movement: "Gate Out",
    unit: "TRK-204",
    carrier: "MetroFleet",
    dock: "D-17",
    status: "Released",
  },
];

function eventTone(status: string) {
  if (status === "Cleared" || status === "Released") return "good";
  return "high";
}

export default function GateActivity() {
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Gate Activity</h1>
          <p className="ops-subtitle">
            UI-only forms for gate check-in and gate check-out workflows.
          </p>
        </div>
      </header>

      <section className="gate-layout">
        <article className="ops-card gate-form-card">
          <div className="ops-card-header">
            <h2>Gate In Form</h2>
            <span className="ops-pill neutral">Inbound</span>
          </div>
          <div className="gate-form-grid">
            <label className="gate-field">
              Unit ID
              <input className="gate-input" placeholder="TRK-112" />
            </label>
            <label className="gate-field">
              Carrier
              <input className="gate-input" placeholder="NorthHaul" />
            </label>
            <label className="gate-field">
              Driver Name
              <input className="gate-input" placeholder="Alex Carter" />
            </label>
            <label className="gate-field">
              License Plate
              <input className="gate-input" placeholder="TN-09-8821" />
            </label>
            <label className="gate-field">
              Area
              <select className="gate-select" defaultValue="">
                <option value="" disabled>
                  Select Area
                </option>
                <option>North Area</option>
                <option>South Area</option>
              </select>
            </label>
            <label className="gate-field">
              Yard
              <select className="gate-select" defaultValue="">
                <option value="" disabled>
                  Select Yard
                </option>
                <option>Yard N1</option>
                <option>Yard N2</option>
              </select>
            </label>
            <label className="gate-field">
              Zone
              <select className="gate-select" defaultValue="">
                <option value="" disabled>
                  Select Zone
                </option>
                <option>Zone A</option>
                <option>Zone B</option>
                <option>Zone C</option>
              </select>
            </label>
            <label className="gate-field">
              Dock
              <select className="gate-select" defaultValue="">
                <option value="" disabled>
                  Select Dock
                </option>
                <option>D-03</option>
                <option>D-08</option>
                <option>D-17</option>
              </select>
            </label>
            <label className="gate-field gate-field-wide">
              Notes
              <textarea className="gate-textarea" placeholder="Any inspection or gate notes..." />
            </label>
          </div>
          <div className="gate-actions">
            <button type="button" className="gate-btn gate-btn-primary">
              Save Gate In
            </button>
            <button type="button" className="gate-btn">
              Clear
            </button>
          </div>
        </article>

        <article className="ops-card gate-form-card">
          <div className="ops-card-header">
            <h2>Gate Out Form</h2>
            <span className="ops-pill good">Outbound</span>
          </div>
          <div className="gate-form-grid">
            <label className="gate-field">
              Unit ID
              <input className="gate-input" placeholder="TR-337" />
            </label>
            <label className="gate-field">
              Carrier
              <input className="gate-input" placeholder="PrimeCargo" />
            </label>
            <label className="gate-field">
              Driver Name
              <input className="gate-input" placeholder="Mina R" />
            </label>
            <label className="gate-field">
              Destination
              <input className="gate-input" placeholder="Warehouse B" />
            </label>
            <label className="gate-field">
              Loaded/Empty
              <select className="gate-select" defaultValue="">
                <option value="" disabled>
                  Select Type
                </option>
                <option>Loaded</option>
                <option>Empty</option>
              </select>
            </label>
            <label className="gate-field">
              Seal Number
              <input className="gate-input" placeholder="SEAL-98222" />
            </label>
            <label className="gate-field">
              Exit Gate
              <select className="gate-select" defaultValue="">
                <option value="" disabled>
                  Select Exit Gate
                </option>
                <option>Gate 1</option>
                <option>Gate 2</option>
                <option>Gate 3</option>
              </select>
            </label>
            <label className="gate-field">
              Departure Slot
              <input className="gate-input" placeholder="10:45" />
            </label>
            <label className="gate-field gate-field-wide">
              Notes
              <textarea className="gate-textarea" placeholder="Outbound checks and release remarks..." />
            </label>
          </div>
          <div className="gate-actions">
            <button type="button" className="gate-btn gate-btn-primary">
              Save Gate Out
            </button>
            <button type="button" className="gate-btn">
              Clear
            </button>
          </div>
        </article>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Recent Gate Events</h2>
          <span className="ops-muted">Dummy timeline</span>
        </div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Movement</th>
                <th>Unit</th>
                <th>Carrier</th>
                <th>Dock / Lane</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {gateEvents.map((event) => (
                <tr key={`${event.time}-${event.unit}`}>
                  <td>{event.time}</td>
                  <td>{event.movement}</td>
                  <td>{event.unit}</td>
                  <td>{event.carrier}</td>
                  <td>{event.dock}</td>
                  <td>
                    <span className={`ops-pill ${eventTone(event.status)}`}>{event.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
