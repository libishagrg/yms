import { useMemo, useState, type FormEvent } from "react";
import "./OperationsUi.css";

type CarrierRisk = "Low" | "Medium" | "High";

type Carrier = {
  id: string;
  name: string;
  activeLoads: number;
  onTime: number;
  avgDwell: string;
  risk: CarrierRisk;
};

const initialCarriers: Carrier[] = [
  { id: "car-1", name: "BlueLine Logistics", activeLoads: 34, onTime: 96, avgDwell: "39m", risk: "Low" },
  { id: "car-2", name: "PrimeCargo", activeLoads: 28, onTime: 91, avgDwell: "44m", risk: "Medium" },
  { id: "car-3", name: "NorthHaul", activeLoads: 19, onTime: 87, avgDwell: "53m", risk: "Medium" },
  { id: "car-4", name: "Atlas Freight", activeLoads: 16, onTime: 81, avgDwell: "61m", risk: "High" },
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

const emptyCarrierForm = {
  name: "",
  activeLoads: "0",
  onTime: "90",
  avgDwell: "45m",
  risk: "Low" as CarrierRisk,
};

function riskTone(risk: CarrierRisk) {
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
  const [carrierRows, setCarrierRows] = useState<Carrier[]>(initialCarriers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [carrierForm, setCarrierForm] = useState(emptyCarrierForm);

  const stats = useMemo(() => {
    const activeCarriers = carrierRows.length;
    const totalLoads = carrierRows.reduce((acc, carrier) => acc + carrier.activeLoads, 0);
    const avgOnTime = activeCarriers
      ? Math.round(carrierRows.reduce((acc, carrier) => acc + carrier.onTime, 0) / activeCarriers)
      : 0;
    const loadsWithRisk = carrierRows.filter((carrier) => carrier.risk !== "Low").length;

    return { activeCarriers, totalLoads, avgOnTime, loadsWithRisk };
  }, [carrierRows]);

  const openAddCarrier = () => {
    setEditingCarrierId(null);
    setCarrierForm(emptyCarrierForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditCarrier = (carrier: Carrier) => {
    setEditingCarrierId(carrier.id);
    setCarrierForm({
      name: carrier.name,
      activeLoads: String(carrier.activeLoads),
      onTime: String(carrier.onTime),
      avgDwell: carrier.avgDwell,
      risk: carrier.risk,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleCarrierSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = carrierForm.name.trim();
    const activeLoads = Number(carrierForm.activeLoads);
    const onTime = Number(carrierForm.onTime);
    const avgDwell = carrierForm.avgDwell.trim();

    if (!name) {
      setFormError("Carrier name is required.");
      return;
    }
    if (Number.isNaN(activeLoads) || activeLoads < 0) {
      setFormError("Active loads must be zero or higher.");
      return;
    }
    if (Number.isNaN(onTime) || onTime < 0 || onTime > 100) {
      setFormError("On-time must be between 0 and 100.");
      return;
    }
    if (!avgDwell) {
      setFormError("Average dwell is required.");
      return;
    }

    if (editingCarrierId) {
      setCarrierRows((prev) =>
        prev.map((carrier) =>
          carrier.id === editingCarrierId
            ? { ...carrier, name, activeLoads, onTime, avgDwell, risk: carrierForm.risk }
            : carrier,
        ),
      );
    } else {
      setCarrierRows((prev) => [
        ...prev,
        {
          id: `car-${Date.now()}`,
          name,
          activeLoads,
          onTime,
          avgDwell,
          risk: carrierForm.risk,
        },
      ]);
    }

    closeModal();
  };

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Carriers</h1>
          <p className="ops-subtitle">
            Carrier-level analytics view with add/edit support (frontend-only dummy data).
          </p>
        </div>
        <div className="ops-header-actions">
          <button type="button" className="ops-action-btn ops-action-btn-primary" onClick={openAddCarrier}>
            Add Carrier
          </button>
        </div>
      </header>

      <section className="ops-kpi-grid">
        <article className="ops-card">
          <p className="ops-kpi-label">Active Carriers</p>
          <p className="ops-kpi-value">{stats.activeCarriers}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Total Active Loads</p>
          <p className="ops-kpi-value">{stats.totalLoads}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Avg On-time</p>
          <p className="ops-kpi-value">{stats.avgOnTime}%</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Loads With Risk</p>
          <p className="ops-kpi-value">{stats.loadsWithRisk}</p>
        </article>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Carrier Performance Snapshot</h2>
          <span className="ops-muted">Editable rows</span>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {carrierRows.map((carrier) => (
                <tr key={carrier.id}>
                  <td>{carrier.name}</td>
                  <td>{carrier.activeLoads}</td>
                  <td>{carrier.onTime}%</td>
                  <td>{carrier.avgDwell}</td>
                  <td>
                    <span className={`ops-pill ${riskTone(carrier.risk)}`}>{carrier.risk}</span>
                  </td>
                  <td>
                    <button type="button" className="ops-mini-btn" onClick={() => openEditCarrier(carrier)}>
                      Edit
                    </button>
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

      {isModalOpen && (
        <div className="ops-modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="ops-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-header">
              <h3>{editingCarrierId ? "Edit Carrier" : "Add Carrier"}</h3>
              <button type="button" className="ops-modal-close" onClick={closeModal}>
                x
              </button>
            </div>
            <form className="ops-form-grid" onSubmit={handleCarrierSubmit}>
              <label className="ops-form-field ops-form-field-wide">
                Carrier Name
                <input
                  className="ops-input"
                  value={carrierForm.name}
                  onChange={(event) => setCarrierForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="BlueLine Logistics"
                />
              </label>
              <label className="ops-form-field">
                Active Loads
                <input
                  type="number"
                  min={0}
                  className="ops-input"
                  value={carrierForm.activeLoads}
                  onChange={(event) =>
                    setCarrierForm((prev) => ({ ...prev, activeLoads: event.target.value }))
                  }
                />
              </label>
              <label className="ops-form-field">
                On-time %
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="ops-input"
                  value={carrierForm.onTime}
                  onChange={(event) => setCarrierForm((prev) => ({ ...prev, onTime: event.target.value }))}
                />
              </label>
              <label className="ops-form-field">
                Avg Dwell
                <input
                  className="ops-input"
                  value={carrierForm.avgDwell}
                  onChange={(event) => setCarrierForm((prev) => ({ ...prev, avgDwell: event.target.value }))}
                  placeholder="45m"
                />
              </label>
              <label className="ops-form-field">
                Risk
                <select
                  className="ops-select"
                  value={carrierForm.risk}
                  onChange={(event) =>
                    setCarrierForm((prev) => ({ ...prev, risk: event.target.value as CarrierRisk }))
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
              {formError && <p className="ops-form-error">{formError}</p>}
              <div className="ops-modal-actions">
                <button type="button" className="ops-action-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ops-action-btn ops-action-btn-primary">
                  {editingCarrierId ? "Save Changes" : "Add Carrier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

