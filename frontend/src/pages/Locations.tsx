import "./OperationsUi.css";

type Zone = {
  name: string;
  docks: string[];
};

type Yard = {
  name: string;
  zones: Zone[];
};

type Area = {
  name: string;
  yards: Yard[];
};

const locationHierarchy: Area[] = [
  {
    name: "North Area",
    yards: [
      {
        name: "Yard N1",
        zones: [
          { name: "Zone N1-A", docks: ["N1-A-01", "N1-A-02", "N1-A-03"] },
          { name: "Zone N1-B", docks: ["N1-B-01", "N1-B-02"] },
        ],
      },
      {
        name: "Yard N2",
        zones: [
          { name: "Zone N2-A", docks: ["N2-A-01", "N2-A-02"] },
          { name: "Zone N2-B", docks: ["N2-B-01", "N2-B-02", "N2-B-03"] },
        ],
      },
    ],
  },
  {
    name: "South Area",
    yards: [
      {
        name: "Yard S1",
        zones: [
          { name: "Zone S1-A", docks: ["S1-A-01", "S1-A-02"] },
          { name: "Zone S1-B", docks: ["S1-B-01"] },
        ],
      },
    ],
  },
];

const totalYards = locationHierarchy.reduce((acc, area) => acc + area.yards.length, 0);
const totalZones = locationHierarchy.reduce(
  (acc, area) => acc + area.yards.reduce((yardAcc, yard) => yardAcc + yard.zones.length, 0),
  0,
);
const totalDocks = locationHierarchy.reduce(
  (acc, area) =>
    acc +
    area.yards.reduce(
      (yardAcc, yard) => yardAcc + yard.zones.reduce((zoneAcc, zone) => zoneAcc + zone.docks.length, 0),
      0,
    ),
  0,
);

export default function Locations() {
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <h1 className="ops-title">Locations</h1>
          <p className="ops-subtitle">
            Analytics hierarchy: <strong>Area &gt; Yard &gt; Zone &gt; Dock</strong>
          </p>
        </div>
      </header>

      <section className="ops-kpi-grid">
        <article className="ops-card">
          <p className="ops-kpi-label">Areas</p>
          <p className="ops-kpi-value">{locationHierarchy.length}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Yards</p>
          <p className="ops-kpi-value">{totalYards}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Zones</p>
          <p className="ops-kpi-value">{totalZones}</p>
        </article>
        <article className="ops-card">
          <p className="ops-kpi-label">Docks</p>
          <p className="ops-kpi-value">{totalDocks}</p>
        </article>
      </section>

      <section className="ops-card">
        <div className="ops-card-header">
          <h2>Location Tree</h2>
          <span className="ops-muted">Dummy structure</span>
        </div>

        <div className="ops-area-grid">
          {locationHierarchy.map((area) => (
            <article key={area.name} className="ops-area-card">
              <h3>{area.name}</h3>
              <div className="ops-yard-grid">
                {area.yards.map((yard) => (
                  <section key={yard.name} className="ops-yard-card">
                    <h4>{yard.name}</h4>
                    <div className="ops-zone-grid">
                      {yard.zones.map((zone) => (
                        <div key={zone.name} className="ops-zone-card">
                          <p>{zone.name}</p>
                          <div className="ops-dock-list">
                            {zone.docks.map((dock) => (
                              <span key={dock} className="ops-chip">
                                {dock}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
