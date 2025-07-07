import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Admins.module.css";
const s = styles;

const SECTION_OPTIONS = [
  { key: "chart", label: "Chart" },
  { key: "user", label: "User" },
  { key: "withdraw", label: "Withdraw" },
  { key: "coins", label: "Coins" },
  { key: "deposits", label: "Deposits" },
  { key: "bonuses", label: "Bonuses" },
  { key: "affiliate", label: "Affiliate" },
  { key: "trades", label: "Stats" },
  { key: "news", label: "News" },
  { key: "support", label: "Support" },
  { key: "usertrade", label: "Trade of User account" },
  { key: "leaderboard", label: "Leader board" },
  { key: "content", label: "Content Management" },
  { key: "amount", label: "Amount" },
  { key: "admins", label: "Admins" },
];

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("admin"); // 'admin' or 'user'
  const [search, setSearch] = useState("");
  const [accessEditId, setAccessEditId] = useState(null);
  const [accessEdit, setAccessEdit] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [makingAdminId, setMakingAdminId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/all-admins`
        );
        const data = await res.json();
        setAdmins(data.admins || []);
      } catch (err) {
        setError("Failed to fetch admins");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (view === "user" && users.length === 0) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/admin/all-users`
          );
          const data = await res.json();
          setUsers(data.users || []);
        } catch (err) {
          setError("Failed to fetch users");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [view]);

  // Filtered lists based on search
  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email &&
      admin.email.toLowerCase().includes(search.toLowerCase()) &&
      admin.isAdmin &&
      !admin.isSuperAdmin
  );
  const filteredUsers = users.filter(
    (user) =>
      user.email &&
      user.email.toLowerCase().includes(search.toLowerCase()) &&
      user.isAdmin !== true &&
      user.isAdmin !== 1 &&
      user.isAdmin !== "true" // Exclude all admin values
  );

  return (
    <>
      {/* Access Modal Popup */}
      {showAccessModal && (
        <div className={s.modalOverlay}>
          <div className={s.accessModalBox}>
            {showAccessModal === "edit" ? (
              <>
                <h3>Edit Admin Access</h3>
                <div className={s.accessOptionsGrid}>
                  {SECTION_OPTIONS.map((opt) => (
                    <label key={opt.key} className={s.accessOptionLabel}>
                      <input
                        type="checkbox"
                        checked={accessEdit.includes(opt.key)}
                        onChange={() => {
                          setAccessEdit((prev) =>
                            prev.includes(opt.key)
                              ? prev.filter((k) => k !== opt.key)
                              : [...prev, opt.key]
                          );
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className={s.modalActions}>
                  <button
                    className={s.actionBtn}
                    disabled={savingAccess}
                    onClick={async () => {
                      setSavingAccess(true);
                      try {
                        const res = await fetch(
                          `${
                            import.meta.env.VITE_BACKEND_URL
                          }/api/admin/set-admin-access`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: localStorage.getItem("token")
                                ? `Bearer ${localStorage.getItem("token")}`
                                : undefined,
                            },
                            body: JSON.stringify({
                              userId: accessEditId,
                              access: accessEdit,
                            }),
                          }
                        );
                        const data = await res.json();
                        if (data.success) {
                          setAdmins((prev) =>
                            prev.map((a) =>
                              a._id === accessEditId
                                ? { ...a, access: accessEdit }
                                : a
                            )
                          );
                          setShowAccessModal(false);
                          setAccessEditId(null);
                        } else {
                          alert(data.error || "Failed to set access");
                        }
                      } catch {
                        alert("Failed to set access");
                      } finally {
                        setSavingAccess(false);
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    className={s.actionBtn}
                    style={{ marginLeft: 8, background: "#eee", color: "#333" }}
                    onClick={() => {
                      setShowAccessModal(false);
                      setAccessEditId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Admin Access</h3>
                <div
                  className={s.accessBadgesRow}
                  style={{ margin: "18px 0 24px 0", justifyContent: "center" }}
                >
                  {accessEdit && accessEdit.length > 0 ? (
                    accessEdit.map((k) => {
                      const label = SECTION_OPTIONS.find(
                        (o) => o.key === k
                      )?.label;
                      return label ? (
                        <span key={k} className={s.accessBadge}>
                          {label}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <span style={{ color: "#aaa" }}>No Access</span>
                  )}
                </div>
                <div className={s.modalActions}>
                  <button
                    className={s.actionBtn}
                    style={{ background: "#eee", color: "#333" }}
                    onClick={() => {
                      setShowAccessModal(false);
                      setAccessEditId(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className={s.container}>
        <button
          className={s.backBtn}
          style={{ marginBottom: 20, padding: "8px 20px", fontWeight: 500 }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <div className={s.toggleBtns}>
          <button
            className={view === "admin" ? s.activeBtn : s.toggleBtn}
            onClick={() => setView("admin")}
          >
            Admin
          </button>
          <button
            className={view === "user" ? s.activeBtn : s.toggleBtn}
            onClick={() => setView("user")}
          >
            User's
          </button>
        </div>
        <input
          type="text"
          className={s.searchBar}
          placeholder={`Search ${
            view === "admin" ? "Admin" : "User"
          } by email...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            margin: "20px 0",
            padding: "8px",
            width: "100%",
            maxWidth: 400,
          }}
        />
        <h2>{view === "admin" ? "All Admins" : "All Users"}</h2>
        {loading && <div>Loading...</div>}
        {error && <div className={s.error}>{error}</div>}
        {!loading && !error && view === "admin" && (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Access</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>{admin.email}</td>
                  <td>Admin</td>
                  <td>
                    <button
                      className={s.actionBtn}
                      style={{ marginLeft: 0 }}
                      onClick={() => {
                        setAccessEditId(admin._id);
                        setAccessEdit(admin.access || []);
                        setShowAccessModal("edit");
                      }}
                    >
                      Edit
                    </button>
                  </td>
                  <td>{new Date(admin.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className={s.actionBtn}
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `${
                              import.meta.env.VITE_BACKEND_URL
                            }/api/admin/remove-admin`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: admin._id }),
                            }
                          );
                          const data = await res.json();
                          if (data.success) {
                            setAdmins((prev) =>
                              prev.filter((a) => a._id !== admin._id)
                            );
                          } else {
                            alert(data.error || "Failed to remove admin");
                          }
                        } catch {
                          alert("Failed to remove admin");
                        }
                      }}
                    >
                      Remove Admin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && view === "user" && (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Country</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>{user.country || "-"}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className={s.actionBtn}
                      disabled={makingAdminId === user._id}
                      onClick={async () => {
                        setMakingAdminId(user._id);
                        try {
                          const res = await fetch(
                            `${
                              import.meta.env.VITE_BACKEND_URL
                            }/api/admin/make-admin`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: user._id }),
                            }
                          );
                          const data = await res.json();
                          if (data.success) {
                            setUsers((prev) =>
                              prev.filter((u) => u._id !== user._id)
                            );
                            setAdmins((prev) => [
                              {
                                ...user,
                                isAdmin: true,
                                access: [],
                                createdAt: user.createdAt,
                              },
                              ...prev,
                            ]);
                          } else {
                            alert(data.error || "Failed to make admin");
                          }
                        } catch {
                          alert("Failed to make admin");
                        } finally {
                          setMakingAdminId(null);
                        }
                      }}
                    >
                      {makingAdminId === user._id ? (
                        <span className={s.loaderSpinner}></span>
                      ) : (
                        "Make Admin"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Admins;
