import React from "react";
import api from "../lib/api";
import editIcon from "../assets/icons/edit.svg";
import deleteIcon from "../assets/icons/delete.svg";
import "./Users.css";

type UserRecord = {
  id: number;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  roleName: string | null;
};

const roleOptions = [
  "All Roles",
  "Administrator",
  "Yard Manager",
  "Yard Jockey",
  "Gate Security",
  "View Only",
];
const roleNames = roleOptions.slice(1);

function getInitials(name?: string | null, email?: string | null) {
  const source = (name ?? "").trim() || (email ?? "").trim();
  if (!source) return "NA";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRoleTone(roleName?: string | null) {
  switch ((roleName ?? "").trim()) {
    case "Administrator":
      return "role-administrator";
    case "Yard Manager":
      return "role-manager";
    case "Yard Jockey":
      return "role-jockey";
    case "Gate Security":
      return "role-gate";
    case "View Only":
      return "role-view";
    default:
      return "role-unknown";
  }
}

export default function Users() {
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("All Roles");
  const [statusFilter, setStatusFilter] = React.useState("All Status");
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [selectedRole, setSelectedRole] = React.useState(roleNames[0] ?? "");
  const [savingRoleId, setSavingRoleId] = React.useState<number | null>(null);
  const [togglingId, setTogglingId] = React.useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [addForm, setAddForm] = React.useState({
    firstname: "",
    lastname: "",
    email: "",
    role: roleNames[0] ?? "",
  });

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);
    api
      .get("/users")
      .then((response) => {
        if (!active) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setUsers(data);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load users.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleToggleActive(user: UserRecord) {
    setTogglingId(user.id);
    try {
      const response = await api.patch(`/users/${user.id}/toggle-active`);
      const nextIsActive =
        typeof response.data?.isActive === "boolean" ? response.data.isActive : !user.isActive;
      setUsers((prev) =>
        prev.map((entry) => (entry.id === user.id ? { ...entry, isActive: nextIsActive } : entry)),
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update status.";
      alert(msg);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleRoleSave(userId: number) {
    if (!selectedRole) return;
    setSavingRoleId(userId);
    try {
      const response = await api.put(`/users/${userId}/role`, { roleName: selectedRole });
      const nextRole = response.data?.roleName ?? selectedRole;
      setUsers((prev) =>
        prev.map((entry) => (entry.id === userId ? { ...entry, roleName: nextRole } : entry)),
      );
      setEditingUserId(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update role.";
      alert(msg);
    } finally {
      setSavingRoleId(null);
    }
  }

  const filteredUsers = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const name = user.displayName ?? user.username ?? "";
      const email = user.email ?? "";
      const role = user.roleName ?? "Unknown";
      if (term) {
        const haystack = `${name} ${email} ${role}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (roleFilter !== "All Roles" && role !== roleFilter) {
        return false;
      }
      if (statusFilter !== "All Status") {
        const isActive = user.isActive;
        if (statusFilter === "Active" && !isActive) return false;
        if (statusFilter === "Inactive" && isActive) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const adminUsers = users.filter((user) => user.roleName === "Administrator").length;
  const pendingVerification = users.filter((user) => !user.emailConfirmed).length;
  const activeRate = totalUsers ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0;

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage team members and their access permissions</p>
        </div>
        <div className="users-header-actions">
          <button className="btn-secondary">Export</button>
          <button className="btn-primary" type="button" onClick={() => setIsAddOpen(true)}>
            Add User
          </button>
        </div>
      </header>

      <section className="users-stats">
        <article className="stat-card">
          <p className="stat-label">Total Users</p>
          <p className="stat-value">{totalUsers}</p>
          <p className="stat-meta">All registered users</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Active Users</p>
          <p className="stat-value">{activeUsers}</p>
          <p className="stat-meta positive">{activeRate}% active</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Administrators</p>
          <p className="stat-value">{adminUsers}</p>
          <p className="stat-meta">Full access</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Pending Verification</p>
          <p className="stat-value">{pendingVerification}</p>
          <p className="stat-meta">Email not confirmed</p>
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
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
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
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="users-row users-row-empty">Loading users...</div>
          ) : error ? (
            <div className="users-row users-row-empty">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="users-row users-row-empty">No users found.</div>
          ) : (
            filteredUsers.map((user) => (
              <div className="users-row" key={user.id}>
                <div className="user-cell">
                  <div className="user-avatar">
                    {getInitials(user.displayName ?? user.username, user.email)}
                  </div>
                  <div>
                    <div className="user-name">
                      {user.displayName ?? user.username ?? "Unknown User"}
                    </div>
                    <div className="user-email">{user.email ?? "No email"}</div>
                  </div>
                </div>
                <div>
                  <span className={`role-pill ${getRoleTone(user.roleName)}`}>
                    {user.roleName ?? "Unknown"}
                  </span>
                </div>
                <div className="status-cell">
                  <span className={`status-dot ${user.isActive ? "active" : "inactive"}`} />
                  {user.isActive ? "Active" : "Inactive"}
                </div>
                <div className="action-cell">
                  {editingUserId === user.id ? (
                    <div className="action-edit">
                      <select
                        className="role-select"
                        value={selectedRole}
                        onChange={(event) => setSelectedRole(event.target.value)}
                      >
                        {roleNames.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-mini btn-mini-primary"
                        onClick={() => handleRoleSave(user.id)}
                        disabled={savingRoleId === user.id}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        className="btn-mini btn-mini-ghost"
                        onClick={() => setEditingUserId(null)}
                        disabled={savingRoleId === user.id}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Edit role"
                        onClick={() => {
                          setSelectedRole(user.roleName ?? roleNames[0] ?? "");
                          setEditingUserId(user.id);
                        }}
                      >
                        <img src={editIcon} alt="" className="icon-image" />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={user.isActive ? "Disable user" : "Enable user"}
                        onClick={() => handleToggleActive(user)}
                        disabled={togglingId === user.id}
                      >
                        <img src={deleteIcon} alt="" className="icon-image" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isAddOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add User</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setIsAddOpen(false)}
              >
                x
              </button>
            </div>

            <form
              className="modal-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsAdding(true);
                setAddError(null);
                try {
                  const response = await api.post("/users", addForm);
                  const created = response.data;
                  setUsers((prev) => [created, ...prev]);
                  setIsAddOpen(false);
                  setAddForm({
                    firstname: "",
                    lastname: "",
                    email: "",
                    role: roleNames[0] ?? "",
                  });
                } catch (error: any) {
                  const msg = error?.response?.data?.message || "Failed to add user.";
                  setAddError(msg);
                } finally {
                  setIsAdding(false);
                }
              }}
            >
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="add-firstname">First name</label>
                  <input
                    className="form-input"
                    id="add-firstname"
                    type="text"
                    value={addForm.firstname}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, firstname: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-lastname">Last name</label>
                  <input
                    className="form-input"
                    id="add-lastname"
                    type="text"
                    value={addForm.lastname}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, lastname: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="add-email">Email</label>
                <input
                  className="form-input"
                  id="add-email"
                  type="email"
                  value={addForm.email}
                  onChange={(event) =>
                    setAddForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="add-role">Role</label>
                <select
                  className="form-select"
                  id="add-role"
                  value={addForm.role}
                  onChange={(event) =>
                    setAddForm((prev) => ({ ...prev, role: event.target.value }))
                  }
                  required
                >
                  {roleNames.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {addError ? <div className="form-error">{addError}</div> : null}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
