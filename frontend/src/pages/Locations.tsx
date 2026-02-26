import type { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createArea,
  createDock,
  createYard,
  createZone,
  deleteArea,
  deleteDock,
  deleteYard,
  deleteZone,
  getLocationTree,
  updateArea,
  updateDock,
  updateYard,
  updateZone,
  type LocationArea,
} from "../lib/api";
import "./OperationsUi.css";

type LocationKind = "area" | "yard" | "zone" | "dock";

type EditTarget = {
  kind: LocationKind;
  id: number;
  areaId?: number;
  yardId?: number;
  zoneId?: number;
};

type AddFormState = {
  kind: LocationKind;
  name: string;
  areaId: string;
  yardId: string;
  zoneId: string;
};

const emptyAddForm: AddFormState = {
  kind: "area",
  name: "",
  areaId: "",
  yardId: "",
  zoneId: "",
};

const kindLabel: Record<LocationKind, string> = {
  area: "Area",
  yard: "Yard",
  zone: "Zone",
  dock: "Dock",
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export default function Locations() {
  const [areas, setAreas] = useState<LocationArea[]>([]);
  const [activeAreaId, setActiveAreaId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(emptyAddForm);
  const [addError, setAddError] = useState("");
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deleteKey, setDeleteKey] = useState("");

  const loadLocations = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const data = await getLocationTree();
      setAreas(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Failed to load locations."));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    if (areas.length === 0) {
      if (activeAreaId !== null) {
        setActiveAreaId(null);
      }
      return;
    }

    const hasCurrentArea = activeAreaId !== null && areas.some((area) => area.id === activeAreaId);
    if (!hasCurrentArea) {
      setActiveAreaId(areas[0].id);
    }
  }, [areas, activeAreaId]);

  const activeArea = useMemo(
    () => (activeAreaId ? areas.find((area) => area.id === activeAreaId) ?? null : null),
    [areas, activeAreaId],
  );

  const stats = useMemo(() => {
    const yardCount = areas.reduce((acc, area) => acc + area.yards.length, 0);
    const zoneCount = areas.reduce(
      (acc, area) => acc + area.yards.reduce((yardAcc, yard) => yardAcc + yard.zones.length, 0),
      0,
    );
    const dockCount = areas.reduce(
      (acc, area) =>
        acc +
        area.yards.reduce(
          (yardAcc, yard) =>
            yardAcc + yard.zones.reduce((zoneAcc, zone) => zoneAcc + zone.docks.length, 0),
          0,
        ),
      0,
    );

    return { areaCount: areas.length, yardCount, zoneCount, dockCount };
  }, [areas]);

  const selectedAreaId = Number(addForm.areaId) || activeArea?.id || 0;
  const areaForAdd = areas.find((area) => area.id === selectedAreaId) ?? null;
  const yardOptions = areaForAdd?.yards ?? [];
  const zoneOptions = yardOptions.find((yard) => yard.id === Number(addForm.yardId))?.zones ?? [];

  const editParentContext = useMemo(() => {
    if (!editTarget || editTarget.kind === "area") return "";
    const area = areas.find((item) => item.id === editTarget.areaId);
    if (!area) return "";
    if (editTarget.kind === "yard") return `Parent Area: ${area.name}`;
    const yard = area.yards.find((item) => item.id === editTarget.yardId);
    if (!yard) return `Parent Area: ${area.name}`;
    if (editTarget.kind === "zone") return `Parent: ${area.name} > ${yard.name}`;
    const zone = yard.zones.find((item) => item.id === editTarget.zoneId);
    return zone ? `Parent: ${area.name} > ${yard.name} > ${zone.name}` : `Parent: ${area.name} > ${yard.name}`;
  }, [areas, editTarget]);

  const openAddModal = () => {
    setAddForm({
      ...emptyAddForm,
      areaId: activeArea ? String(activeArea.id) : "",
    });
    setAddError("");
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddError("");
  };

  const openEditModal = (target: EditTarget, currentName: string) => {
    setEditTarget(target);
    setEditName(currentName);
    setEditError("");
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditName("");
    setEditError("");
  };

  const handleLocationTypeChange = (kind: LocationKind) => {
    setAddForm((prev) => ({
      ...prev,
      kind,
      areaId: kind === "area" ? "" : prev.areaId || (activeArea ? String(activeArea.id) : ""),
      yardId: kind === "zone" || kind === "dock" ? prev.yardId : "",
      zoneId: kind === "dock" ? prev.zoneId : "",
    }));
  };

  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError("");

    const name = addForm.name.trim();
    if (!name) {
      setAddError("Location name is required.");
      return;
    }

    if (addForm.kind !== "area" && !addForm.areaId) {
      setAddError("Please select a parent area.");
      return;
    }
    if ((addForm.kind === "zone" || addForm.kind === "dock") && !addForm.yardId) {
      setAddError("Please select a parent yard.");
      return;
    }
    if (addForm.kind === "dock" && !addForm.zoneId) {
      setAddError("Please select a parent zone.");
      return;
    }

    setIsAddSubmitting(true);
    try {
      if (addForm.kind === "area") {
        const createdArea = await createArea({ name });
        setActiveAreaId(createdArea.id);
      } else if (addForm.kind === "yard") {
        await createYard({ name, areaId: Number(addForm.areaId) });
      } else if (addForm.kind === "zone") {
        await createZone({ name, yardId: Number(addForm.yardId) });
      } else {
        await createDock({ name, zoneId: Number(addForm.zoneId) });
      }

      closeAddModal();
      await loadLocations(true);
    } catch (error) {
      setAddError(getApiErrorMessage(error, "Failed to add location."));
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const name = editName.trim();
    if (!name) {
      setEditError("Name is required.");
      return;
    }

    setIsEditSubmitting(true);
    setEditError("");
    try {
      if (editTarget.kind === "area") {
        await updateArea(editTarget.id, { name });
      } else if (editTarget.kind === "yard") {
        await updateYard(editTarget.id, { name });
      } else if (editTarget.kind === "zone") {
        await updateZone(editTarget.id, { name });
      } else {
        await updateDock(editTarget.id, { name });
      }

      closeEditModal();
      await loadLocations(true);
    } catch (error) {
      setEditError(getApiErrorMessage(error, "Failed to save changes."));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (target: EditTarget, displayName: string) => {
    const label = kindLabel[target.kind];
    const confirmed = window.confirm(`Delete ${label} "${displayName}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const key = `${target.kind}-${target.id}`;
    setDeleteKey(key);
    try {
      if (target.kind === "area") {
        await deleteArea(target.id);
      } else if (target.kind === "yard") {
        await deleteYard(target.id);
      } else if (target.kind === "zone") {
        await deleteZone(target.id);
      } else {
        await deleteDock(target.id);
      }

      await loadLocations(true);
    } catch (error) {
      window.alert(getApiErrorMessage(error, `Failed to delete ${label.toLowerCase()}.`));
    } finally {
      setDeleteKey("");
    }
  };

  if (isLoading) {
    return (
      <div className="ops-page">
        <section className="ops-card">
          <p className="loc-empty">Loading locations...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Locations</h1>
          <p className="ops-subtitle">Manage Area - Yard - Zone - Dock hierarchy with add, edit, and delete.</p>
        </div>
        <div className="ops-header-actions">
          <button type="button" className="ops-action-btn ops-action-btn-primary" onClick={openAddModal}>
            Add Location
          </button>
        </div>
      </header>

      {loadError ? (
        <section className="ops-card">
          <p className="ops-form-error">{loadError}</p>
          <button type="button" className="ops-action-btn" onClick={() => void loadLocations()}>
            Retry
          </button>
        </section>
      ) : null}

      <section className="ops-kpi-grid">
        <article className="ops-card">
          <p className="ops-kpi-label">Areas</p>
          <p className="ops-kpi-value">{stats.areaCount}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Yards</p>
          <p className="ops-kpi-value">{stats.yardCount}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Zones</p>
          <p className="ops-kpi-value">{stats.zoneCount}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Docks</p>
          <p className="ops-kpi-value">{stats.dockCount}</p>
        </article>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Areas</h2>
          <span className="ops-muted">View one area at a time</span>
        </div>
        {areas.length === 0 ? (
          <p className="loc-empty">No areas available. Add your first area.</p>
        ) : (
          <div className="loc-area-switch">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={`loc-area-btn ${area.id === activeArea?.id ? "active" : ""}`}
                onClick={() => setActiveAreaId(area.id)}
              >
                {area.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {activeArea ? (
        <section className="ops-card">
          <div className="ops-card-header">
            <h2>{activeArea.name}</h2>
            <div className="ops-inline-actions">
              <button
                type="button"
                className="ops-mini-btn"
                onClick={() => openEditModal({ kind: "area", id: activeArea.id }, activeArea.name)}
              >
                Edit Area
              </button>
              <button
                type="button"
                className="ops-mini-btn ops-mini-btn-danger"
                onClick={() => void handleDelete({ kind: "area", id: activeArea.id }, activeArea.name)}
                disabled={deleteKey === `area-${activeArea.id}`}
              >
                Delete Area
              </button>
            </div>
          </div>

          <div className="loc-yard-stack">
            {activeArea.yards.length === 0 ? (
              <p className="loc-empty">No yards in this area yet.</p>
            ) : (
              activeArea.yards.map((yard) => (
                <article key={yard.id} className="loc-yard-card">
                  <div className="loc-item-header">
                    <h3>{yard.name}</h3>
                    <div className="ops-inline-actions">
                      <button
                        type="button"
                        className="ops-mini-btn"
                        onClick={() =>
                          openEditModal({ kind: "yard", id: yard.id, areaId: activeArea.id }, yard.name)
                        }
                      >
                        Edit Yard
                      </button>
                      <button
                        type="button"
                        className="ops-mini-btn ops-mini-btn-danger"
                        onClick={() =>
                          void handleDelete(
                            { kind: "yard", id: yard.id, areaId: activeArea.id },
                            yard.name,
                          )
                        }
                        disabled={deleteKey === `yard-${yard.id}`}
                      >
                        Delete Yard
                      </button>
                    </div>
                  </div>

                  <div className="loc-zone-grid">
                    {yard.zones.length === 0 ? (
                      <p className="loc-empty">No zones yet.</p>
                    ) : (
                      yard.zones.map((zone) => (
                        <section key={zone.id} className="loc-zone-card">
                          <div className="loc-item-header">
                            <h4>{zone.name}</h4>
                            <div className="ops-inline-actions">
                              <button
                                type="button"
                                className="ops-mini-btn"
                                onClick={() =>
                                  openEditModal(
                                    {
                                      kind: "zone",
                                      id: zone.id,
                                      areaId: activeArea.id,
                                      yardId: yard.id,
                                    },
                                    zone.name,
                                  )
                                }
                              >
                                Edit Zone
                              </button>
                              <button
                                type="button"
                                className="ops-mini-btn ops-mini-btn-danger"
                                onClick={() =>
                                  void handleDelete(
                                    {
                                      kind: "zone",
                                      id: zone.id,
                                      areaId: activeArea.id,
                                      yardId: yard.id,
                                    },
                                    zone.name,
                                  )
                                }
                                disabled={deleteKey === `zone-${zone.id}`}
                              >
                                Delete Zone
                              </button>
                            </div>
                          </div>

                          <div className="loc-dock-grid">
                            {zone.docks.length === 0 ? (
                              <p className="loc-empty">No docks yet.</p>
                            ) : (
                              zone.docks.map((dock) => (
                                <div key={dock.id} className="loc-dock-item">
                                  <span>{dock.name}</span>
                                  <div className="ops-inline-actions">
                                    <button
                                      type="button"
                                      className="ops-mini-btn"
                                      onClick={() =>
                                        openEditModal(
                                          {
                                            kind: "dock",
                                            id: dock.id,
                                            areaId: activeArea.id,
                                            yardId: yard.id,
                                            zoneId: zone.id,
                                          },
                                          dock.name,
                                        )
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="ops-mini-btn ops-mini-btn-danger"
                                      onClick={() =>
                                        void handleDelete(
                                          {
                                            kind: "dock",
                                            id: dock.id,
                                            areaId: activeArea.id,
                                            yardId: yard.id,
                                            zoneId: zone.id,
                                          },
                                          dock.name,
                                        )
                                      }
                                      disabled={deleteKey === `dock-${dock.id}`}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </section>
                      ))
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {isAddModalOpen ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={closeAddModal}>
          <div className="ops-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-header">
              <h3>Add Location</h3>
              <button type="button" className="ops-modal-close" onClick={closeAddModal}>
                x
              </button>
            </div>
            <form className="ops-form-grid" onSubmit={(event) => void handleAddSubmit(event)}>
              <label className="ops-form-field">
                Type
                <select
                  className="ops-select"
                  value={addForm.kind}
                  onChange={(event) => handleLocationTypeChange(event.target.value as LocationKind)}
                >
                  <option value="area">Area</option>
                  <option value="yard">Yard</option>
                  <option value="zone">Zone</option>
                  <option value="dock">Dock</option>
                </select>
              </label>

              <label className="ops-form-field ops-form-field-wide">
                Name
                <input
                  className="ops-input"
                  value={addForm.name}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Enter location name"
                />
              </label>

              {addForm.kind !== "area" ? (
                <label className="ops-form-field">
                  Parent Area
                  <select
                    className="ops-select"
                    value={addForm.areaId}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, areaId: event.target.value, yardId: "", zoneId: "" }))
                    }
                  >
                    <option value="">Select area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {addForm.kind === "zone" || addForm.kind === "dock" ? (
                <label className="ops-form-field">
                  Parent Yard
                  <select
                    className="ops-select"
                    value={addForm.yardId}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, yardId: event.target.value, zoneId: "" }))}
                  >
                    <option value="">Select yard</option>
                    {yardOptions.map((yard) => (
                      <option key={yard.id} value={yard.id}>
                        {yard.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {addForm.kind === "dock" ? (
                <label className="ops-form-field">
                  Parent Zone
                  <select
                    className="ops-select"
                    value={addForm.zoneId}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, zoneId: event.target.value }))}
                  >
                    <option value="">Select zone</option>
                    {zoneOptions.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {addError ? <p className="ops-form-error">{addError}</p> : null}
              <div className="ops-modal-actions">
                <button type="button" className="ops-action-btn" onClick={closeAddModal} disabled={isAddSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="ops-action-btn ops-action-btn-primary" disabled={isAddSubmitting}>
                  {isAddSubmitting ? "Saving..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={closeEditModal}>
          <div className="ops-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-header">
              <h3>Edit {kindLabel[editTarget.kind]}</h3>
              <button type="button" className="ops-modal-close" onClick={closeEditModal}>
                x
              </button>
            </div>
            <form className="ops-form-grid" onSubmit={(event) => void handleEditSubmit(event)}>
              {editParentContext ? <p className="ops-muted-inline">{editParentContext}</p> : null}
              <label className="ops-form-field ops-form-field-wide">
                Name
                <input
                  className="ops-input"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Enter name"
                />
              </label>
              {editError ? <p className="ops-form-error">{editError}</p> : null}
              <div className="ops-modal-actions">
                <button type="button" className="ops-action-btn" onClick={closeEditModal} disabled={isEditSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="ops-action-btn ops-action-btn-primary" disabled={isEditSubmitting}>
                  {isEditSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
