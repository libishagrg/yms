import "./Users.css";

const users = [
  {
    initials: "JD",
    name: "John Doe",
    email: "john.doe@company.com",
    role: "Admin",
    status: "Active",
    lastActive: "Just now",
    roleTone: "admin",
  },
  {
    initials: "SM",
    name: "Sarah Miller",
    email: "sarah.miller@company.com",
    role: "Manager",
    status: "Active",
    lastActive: "5 mins ago",
    roleTone: "manager",
  },
  {
    initials: "MJ",
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    role: "Operator",
    status: "Active",
    lastActive: "1 hour ago",
    roleTone: "operator",
  },
  {
    initials: "EW",
    name: "Emily Wilson",
    email: "emily.wilson@company.com",
    role: "Viewer",
    status: "Inactive",
    lastActive: "3 days ago",
    roleTone: "viewer",
  },
  {
    initials: "RB",
    name: "Robert Brown",
    email: "robert.brown@company.com",
    role: "Admin",
    status: "Active",
    lastActive: "2 hours ago",
    roleTone: "admin",
  },
];

export default function Users() {
  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage team members and their access permissions</p>
        </div>
        <div className="users-header-actions">
          <button className="btn-secondary">Export</button>
          <button className="btn-primary">Add User</button>
        </div>
      </header>

      <section className="users-stats">
        <article className="stat-card">
          <p className="stat-label">Total Users</p>
          <p className="stat-value">24</p>
          <p className="stat-meta positive">+3 this month</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Active Users</p>
          <p className="stat-value">21</p>
          <p className="stat-meta positive">87.5% active</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Administrators</p>
          <p className="stat-value">3</p>
          <p className="stat-meta">Full access</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Pending Invites</p>
          <p className="stat-value">2</p>
          <p className="stat-meta">Awaiting response</p>
        </article>
      </section>

      <section className="users-table-card">
        <div className="users-table-header">
          <h2>All Users</h2>
          <div className="users-filters">
            <div className="users-search">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M11 4a7 7 0 015.53 11.25l3.11 3.11a1 1 0 01-1.42 1.42l-3.11-3.11A7 7 0 1111 4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              <input type="text" placeholder="Search users..." />
            </div>
            <select>
              <option>All Roles</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Operator</option>
              <option>Viewer</option>
            </select>
            <select>
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="users-table">
          <div className="users-row users-row-header">
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last Active</span>
            <span>Actions</span>
          </div>
          {users.map((user) => (
            <div className="users-row" key={user.email}>
              <div className="user-cell">
                <div className="user-avatar">{user.initials}</div>
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              <div>
                <span className={`role-pill ${user.roleTone}`}>{user.role}</span>
              </div>
              <div className="status-cell">
                <span className={`status-dot ${user.status.toLowerCase()}`} />
                {user.status}
              </div>
              <div className="last-active">{user.lastActive}</div>
              <div className="action-cell">
                <button className="icon-button" aria-label="Edit user">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M4 20h4l10-10-4-4L4 16v4z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 6l4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="icon-button" aria-label="Delete user">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M6 7h12M9 7V5h6v2M9 10v6M15 10v6M7 7l1 12h8l1-12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
