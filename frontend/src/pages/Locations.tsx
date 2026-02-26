import { useMemo, useState, type FormEvent } from "react";
import "./OperationsUi.css";

type Dock = {
  id: string;
  name: string;
};

type Zone = {
  id: string;
  name: string;
  docks: Dock[];
};

type Yard = {
  id: string;
  name: string;
  zones: Zone[];
};

type Area = {
  id: string;
  name: string;
  yards: Yard[];
};

type LocationKind = "area" | "yard" | "zone" | "dock";

type EditTarget = {
  kind: LocationKind;
  id: string;
  areaId?: string;
  yardId?: string;
  zoneId?: string;
};

const initialHierarchy: Area[] = [
  {
    id: "area-1",
    name: "North Area",
    yards: [
      {
        id: "yard-1",
        name: "Yard N1",
        zones: [
          {
            id: "zone-1",
            name: "Zone N1-A",
            docks: [
              { id: "dock-1", name: "N1-A-01" },
              { id: "dock-2", name: "N1-A-02" },
              { id: "dock-3", name: "N1-A-03" },
            ],
          },
          {
            id: "zone-2",
            name: "Zone N1-B",
            docks: [
              { id: "dock-4", name: "N1-B-01" },
              { id: "dock-5", name: "N1-B-02" },
            ],
          },
        ],
      },
      {
        id: "yard-2",
        name: "Yard N2",
        zones: [
          {
            id: "zone-3",
            name: "Zone N2-A",
            docks: [
              { id: "dock-6", name: "N2-A-01" },
              { id: "dock-7", name: "N2-A-02" },
            ],
          },
          {
            id: "zone-4",
            name: "Zone N2-B",
            docks: [
              { id: "dock-8", name: "N2-B-01" },
              { id: "dock-9", name: "N2-B-02" },
              { id: "dock-10", name: "N2-B-03" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "area-2",
    name: "South Area",
    yards: [
      {
        id: "yard-3",
        name: "Yard S1",
        zones: [
          {
            id: "zone-5",
            name: "Zone S1-A",
            docks: [
              { id: "dock-11", name: "S1-A-01" },
              { id: "dock-12", name: "S1-A-02" },
            ],
          },
          {
            id: "zone-6",
            name: "Zone S1-B",
            docks: [{ id: "dock-13", name: "S1-B-01" }],
          },
        ],
      },
    ],
  },
];

const emptyAddForm = {
  kind: "area" as LocationKind,
  name: "",
  areaId: "",
  yardId: "",
  zoneId: "",
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

export default function Locations() {
  const [areas, setAreas] = useState<Area[]>(initialHierarchy);
  const [activeAreaId, setActiveAreaId] = useState(initialHierarchy[0]?.id ?? "");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addError, setAddError] = useState("");

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

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

  const activeArea = useMemo(
    () => areas.find((area) => area.id === activeAreaId) ?? areas[0] ?? null,
    [areas, activeAreaId],
  );

  const selectedAreaId = addForm.areaId || activeArea?.id || "";
  const areaForAdd = areas.find((area) => area.id === selectedAreaId);
  const yardOptions = areaForAdd?.yards ?? [];
  const zoneOptions = yardOptions.find((yard) => yard.id === addForm.yardId)?.zones ?? [];

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
      areaId: activeArea?.id ?? "",
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
      areaId: kind === "area" ? "" : prev.areaId || activeArea?.id || "",
      yardId: kind === "zone" || kind === "dock" ? prev.yardId : "",
      zoneId: kind === "dock" ? prev.zoneId : "",
    }));
  };

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

    if (addForm.kind === "area") {
      const nextAreaId = createId("area");
      setAreas((prev) => [...prev, { id: nextAreaId, name, yards: [] }]);
      setActiveAreaId(nextAreaId);
      closeAddModal();
      return;
    }

    if (addForm.kind === "yard") {
      const nextYardId = createId("yard");
      setAreas((prev) =>
        prev.map((area) =>
          area.id === addForm.areaId
            ? { ...area, yards: [...area.yards, { id: nextYardId, name, zones: [] }] }
            : area,
        ),
      );
      closeAddModal();
      return;
    }

    if (addForm.kind === "zone") {
      const nextZoneId = createId("zone");
      setAreas((prev) =>
        prev.map((area) =>
          area.id !== addForm.areaId
            ? area
            : {
                ...area,
                yards: area.yards.map((yard) =>
                  yard.id === addForm.yardId
                    ? { ...yard, zones: [...yard.zones, { id: nextZoneId, name, docks: [] }] }
                    : yard,
                ),
              },
        ),
      );
      closeAddModal();
      return;
    }

    const nextDockId = createId("dock");
    setAreas((prev) =>
      prev.map((area) =>
        area.id !== addForm.areaId
          ? area
          : {
              ...area,
              yards: area.yards.map((yard) =>
                yard.id !== addForm.yardId
                  ? yard
                  : {
                      ...yard,
                      zones: yard.zones.map((zone) =>
                        zone.id === addForm.zoneId
                          ? { ...zone, docks: [...zone.docks, { id: nextDockId, name }] }
                          : zone,
                      ),
                    },
              ),
            },
      ),
    );
    closeAddModal();
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editTarget) return;
    const name = editName.trim();
    if (!name) {
      setEditError("Name is required.");
      return;
    }

    if (editTarget.kind === "area") {
      setAreas((prev) => prev.map((area) => (area.id === editTarget.id ? { ...area, name } : area)));
      closeEditModal();
      return;
    }

    if (editTarget.kind === "yard") {
      setAreas((prev) =>
        prev.map((area) =>
          area.id !== editTarget.areaId
            ? area
            : {
                ...area,
                yards: area.yards.map((yard) => (yard.id === editTarget.id ? { ...yard, name } : yard)),
              },
        ),
      );
      closeEditModal();
      return;
    }

    if (editTarget.kind === "zone") {
      setAreas((prev) =>
        prev.map((area) =>
          area.id !== editTarget.areaId
            ? area
            : {
                ...area,
                yards: area.yards.map((yard) =>
                  yard.id !== editTarget.yardId
                    ? yard
                    : {
                        ...yard,
                        zones: yard.zones.map((zone) => (zone.id === editTarget.id ? { ...zone, name } : zone)),
                      },
                ),
              },
        ),
      );
      closeEditModal();
      return;
    }

    setAreas((prev) =>
      prev.map((area) =>
        area.id !== editTarget.areaId
          ? area
          : {
              ...area,
              yards: area.yards.map((yard) =>
                yard.id !== editTarget.yardId
                  ? yard
                  : {
                      ...yard,
                      zones: yard.zones.map((zone) =>
                        zone.id !== editTarget.zoneId
                          ? zone
                          : {
                              ...zone,
                              docks: zone.docks.map((dock) => (dock.id === editTarget.id ? { ...dock, name } : dock)),
                            },
                      ),
                    },
              ),
            },
      ),
    );
    closeEditModal();
  };

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Locations</h1>
          <p className="ops-subtitle">
            Area-focused location view with add/edit actions for Area, Yard, Zone, and Dock.
          </p>
        </div>
        <div className="ops-header-actions">
          <button type="button" className="ops-action-btn ops-action-btn-primary" onClick={openAddModal}>
            Add Location
          </button>
        </div>
      </header>

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
      </section>

      {activeArea && (
        <section className="ops-card">
          <div className="ops-card-header">
            <h2>{activeArea.name}</h2>
            <button
              type="button"
              className="ops-mini-btn"
              onClick={() => openEditModal({ kind: "area", id: activeArea.id }, activeArea.name)}
            >
              Edit Area
            </button>
          </div>

          <div className="loc-yard-stack">
            {activeArea.yards.map((yard) => (
              <article key={yard.id} className="loc-yard-card">
                <div className="loc-item-header">
                  <h3>{yard.name}</h3>
                  <button
                    type="button"
                    className="ops-mini-btn"
                    onClick={() =>
                      openEditModal({ kind: "yard", id: yard.id, areaId: activeArea.id }, yard.name)
                    }
                  >
                    Edit Yard
                  </button>
                </div>

                <div className="loc-zone-grid">
                  {yard.zones.map((zone) => (
                    <section key={zone.id} className="loc-zone-card">
                      <div className="loc-item-header">
                        <h4>{zone.name}</h4>
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
                      </div>

                      <div className="loc-dock-grid">
                        {zone.docks.map((dock) => (
                          <div key={dock.id} className="loc-dock-item">
                            <span>{dock.name}</span>
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
                          </div>
                        ))}
                        {zone.docks.length === 0 && <p className="loc-empty">No docks yet.</p>}
                      </div>
                    </section>
                  ))}
                  {yard.zones.length === 0 && <p className="loc-empty">No zones yet.</p>}
                </div>
              </article>
            ))}
            {activeArea.yards.length === 0 && <p className="loc-empty">No yards in this area yet.</p>}
          </div>
        </section>
      )}

      {isAddModalOpen && (
        <div className="ops-modal-backdrop" role="presentation" onClick={closeAddModal}>
          <div className="ops-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-header">
              <h3>Add Location</h3>
              <button type="button" className="ops-modal-close" onClick={closeAddModal}>
                x
              </button>
            </div>
            <form className="ops-form-grid" onSubmit={handleAddSubmit}>
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

              {addForm.kind !== "area" && (
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
              )}

              {(addForm.kind === "zone" || addForm.kind === "dock") && (
                <label className="ops-form-field">
                  Parent Yard
                  <select
                    className="ops-select"
                    value={addForm.yardId}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, yardId: event.target.value, zoneId: "" }))
                    }
                  >
                    <option value="">Select yard</option>
                    {yardOptions.map((yard) => (
                      <option key={yard.id} value={yard.id}>
                        {yard.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {addForm.kind === "dock" && (
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
              )}

              {addError && <p className="ops-form-error">{addError}</p>}
              <div className="ops-modal-actions">
                <button type="button" className="ops-action-btn" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="ops-action-btn ops-action-btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="ops-modal-backdrop" role="presentation" onClick={closeEditModal}>
          <div className="ops-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-header">
              <h3>Edit {editTarget.kind}</h3>
              <button type="button" className="ops-modal-close" onClick={closeEditModal}>
                x
              </button>
            </div>
            <form className="ops-form-grid" onSubmit={handleEditSubmit}>
              {editParentContext && <p className="ops-muted-inline">{editParentContext}</p>}
              <label className="ops-form-field ops-form-field-wide">
                Name
                <input
                  className="ops-input"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Enter name"
                />
              </label>
              {editError && <p className="ops-form-error">{editError}</p>}
              <div className="ops-modal-actions">
                <button type="button" className="ops-action-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="ops-action-btn ops-action-btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

