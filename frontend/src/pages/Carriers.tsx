import type { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createCarrier,
  deleteCarrier,
  getCarriers,
  updateCarrier,
  type CarrierRecord,
} from "../lib/api";
import "./OperationsUi.css";

type CarrierFormState = {
  name: string;
  scac: string;
  contactPerson: string;
  contactPhone: string;
  notes: string;
  isActive: boolean;
};

const emptyCarrierForm: CarrierFormState = {
  name: "",
  scac: "",
  contactPerson: "",
  contactPhone: "",
  notes: "",
  isActive: true,
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export default function Carriers() {
  const [carriers, setCarriers] = useState<CarrierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState<number | null>(null);
  const [carrierForm, setCarrierForm] = useState<CarrierFormState>(emptyCarrierForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCarrierId, setDeletingCarrierId] = useState<number | null>(null);

  const loadCarriers = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const data = await getCarriers();
      setCarriers(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Failed to load carriers."));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCarriers();
  }, [loadCarriers]);

  const stats = useMemo(() => {
    const total = carriers.length;
    const active = carriers.filter((carrier) => carrier.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [carriers]);

  const openAddCarrier = () => {
    setEditingCarrierId(null);
    setCarrierForm(emptyCarrierForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditCarrier = (carrier: CarrierRecord) => {
    setEditingCarrierId(carrier.id);
    setCarrierForm({
      name: carrier.name,
      scac: carrier.scac ?? "",
      contactPerson: carrier.contactPerson ?? "",
      contactPhone: carrier.contactPhone ?? "",
      notes: carrier.notes ?? "",
      isActive: carrier.isActive,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleCarrierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const name = carrierForm.name.trim();
    if (!name) {
      setFormError("Carrier name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        scac: carrierForm.scac.trim() || null,
        contactPerson: carrierForm.contactPerson.trim() || null,
        contactPhone: carrierForm.contactPhone.trim() || null,
        notes: carrierForm.notes.trim() || null,
        isActive: carrierForm.isActive,
      };

      if (editingCarrierId) {
        await updateCarrier(editingCarrierId, payload);
      } else {
        await createCarrier(payload);
      }

      closeModal();
      await loadCarriers(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Failed to save carrier."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCarrier = async (carrier: CarrierRecord) => {
    const confirmed = window.confirm(`Delete carrier "${carrier.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingCarrierId(carrier.id);
    try {
      await deleteCarrier(carrier.id);
      await loadCarriers(true);
    } catch (error) {
      window.alert(getApiErrorMessage(error, "Failed to delete carrier."));
    } finally {
      setDeletingCarrierId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="ops-page">
        <section className="ops-card">
          <p className="loc-empty">Loading carriers...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Carriers</h1>
          <p className="ops-subtitle">Manage carriers with add, edit, and delete actions.</p>
        </div>
        <div className="ops-header-actions">
          <button type="button" className="ops-action-btn ops-action-btn-primary" onClick={openAddCarrier}>
            Add Carrier
          </button>
        </div>
      </header>

      {loadError ? (
        <section className="ops-card">
          <p className="ops-form-error">{loadError}</p>
          <button type="button" className="ops-action-btn" onClick={() => void loadCarriers()}>
            Retry
          </button>
        </section>
      ) : null}

      <section className="ops-kpi-grid">
        <article className="ops-card">
          <p className="ops-kpi-label">Total Carriers</p>
          <p className="ops-kpi-value">{stats.total}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Active</p>
          <p className="ops-kpi-value">{stats.active}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Inactive</p>
          <p className="ops-kpi-value">{stats.inactive}</p>
        </article>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Carrier Directory</h2>
          <span className="ops-muted">Editable rows</span>
        </div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>SCAC</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {carriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ops-empty-cell">
                    No carriers found.
                  </td>
                </tr>
              ) : (
                carriers.map((carrier) => (
                  <tr key={carrier.id}>
                    <td>{carrier.name}</td>
                    <td>{carrier.scac || "-"}</td>
                    <td>{carrier.contactPerson || "-"}</td>
                    <td>{carrier.contactPhone || "-"}</td>
                    <td>
                      <span className={`ops-pill ${carrier.isActive ? "good" : "high"}`}>
                        {carrier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="ops-inline-actions">
                        <button type="button" className="ops-mini-btn" onClick={() => openEditCarrier(carrier)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ops-mini-btn ops-mini-btn-danger"
                          onClick={() => void handleDeleteCarrier(carrier)}
                          disabled={deletingCarrierId === carrier.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="ops-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-header">
              <h3>{editingCarrierId ? "Edit Carrier" : "Add Carrier"}</h3>
              <button type="button" className="ops-modal-close" onClick={closeModal}>
                x
              </button>
            </div>
            <form className="ops-form-grid" onSubmit={(event) => void handleCarrierSubmit(event)}>
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
                SCAC
                <input
                  className="ops-input"
                  value={carrierForm.scac}
                  onChange={(event) => setCarrierForm((prev) => ({ ...prev, scac: event.target.value }))}
                  placeholder="ABCD"
                />
              </label>
              <label className="ops-form-field">
                Contact Person
                <input
                  className="ops-input"
                  value={carrierForm.contactPerson}
                  onChange={(event) =>
                    setCarrierForm((prev) => ({ ...prev, contactPerson: event.target.value }))
                  }
                  placeholder="John Doe"
                />
              </label>
              <label className="ops-form-field">
                Contact Phone
                <input
                  className="ops-input"
                  value={carrierForm.contactPhone}
                  onChange={(event) =>
                    setCarrierForm((prev) => ({ ...prev, contactPhone: event.target.value }))
                  }
                  placeholder="+1 555 123 4567"
                />
              </label>
              <label className="ops-form-field ops-form-field-wide">
                Notes
                <textarea
                  className="ops-textarea"
                  value={carrierForm.notes}
                  onChange={(event) => setCarrierForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Optional notes"
                />
              </label>
              <label className="ops-toggle-field ops-form-field-wide">
                <input
                  type="checkbox"
                  checked={carrierForm.isActive}
                  onChange={(event) =>
                    setCarrierForm((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
                Carrier is active
              </label>
              {formError ? <p className="ops-form-error">{formError}</p> : null}
              <div className="ops-modal-actions">
                <button type="button" className="ops-action-btn" onClick={closeModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="ops-action-btn ops-action-btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingCarrierId ? "Save Changes" : "Add Carrier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
