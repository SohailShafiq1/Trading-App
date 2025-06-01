import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./User.module.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const User = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCnicModal, setShowCnicModal] = useState(false);
  const [modalCnicUsers, setModalCnicUsers] = useState([]);
  const [modalCnic, setModalCnic] = useState("");
  const [filters, setFilters] = useState({
    verified: "all",
    country: "all",
    currency: "all",
    cnicMatch: "all",
    blocked: "all",
  });
  const [duplicateCnicKeys, setDuplicateCnicKeys] = useState([]);
  const [duplicateCnicSummary, setDuplicateCnicSummary] = useState([]);
  const [search, setSearch] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockUserId, setBlockUserId] = useState(null);
  const [showMailSent, setShowMailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unblockSuccess, setUnblockSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users`);
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users];
    if (filters.verified !== "all") {
      filtered = filtered.filter((u) =>
        filters.verified === "verified" ? u.verified : !u.verified
      );
    }
    if (filters.country !== "all") {
      filtered = filtered.filter((u) => u.country === filters.country);
    }
    if (filters.currency !== "all") {
      filtered = filtered.filter((u) => u.currency === filters.currency);
    }
    if (filters.cnicMatch !== "all") {
      if (filters.cnicMatch === "matched") {
        filtered = filtered.filter(
          (u) => u.cnicNumber && u.imgCNIC && u.cnicNumber === u.imgCNIC
        );
      } else if (filters.cnicMatch === "notmatched") {
        filtered = filtered.filter(
          (u) => !(u.cnicNumber && u.imgCNIC && u.cnicNumber === u.imgCNIC)
        );
      } else if (filters.cnicMatch === "duplicate") {
        filtered = filtered.filter((u) => {
          const cnicKey = `${u.cnicNumber || ""}_${u.imgCNIC || ""}`;
          return duplicateCnicKeys.includes(cnicKey);
        });
      }
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.firstName && u.firstName.toLowerCase().includes(s)) ||
          (u.lastName && u.lastName.toLowerCase().includes(s)) ||
          (u.userId && String(u.userId).toLowerCase().includes(s)) ||
          (u._id && String(u._id).toLowerCase().includes(s))
      );
    }
    if (filters.blocked && filters.blocked !== "all") {
      filtered = filtered.filter((u) =>
        filters.blocked === "blocked" ? u.blocked : !u.blocked
      );
    }
    setFilteredUsers(filtered);
  }, [filters, users, duplicateCnicKeys, search]);

  // After fetching users, find duplicates
  useEffect(() => {
    // Build a map of cnicNumber+imgCNIC to count occurrences
    const cnicMap = {};
    users.forEach((u) => {
      const key = `${u.cnicNumber || ""}_${u.imgCNIC || ""}`;
      if (u.cnicNumber && u.imgCNIC) {
        cnicMap[key] = (cnicMap[key] || 0) + 1;
      }
    });
    setDuplicateCnicKeys(
      Object.entries(cnicMap)
        .filter(([_, count]) => count > 1)
        .map(([key]) => key)
    );
  }, [users]);

  // Find duplicate CNIC numbers and group users by CNIC
  useEffect(() => {
    const cnicMap = {};
    users.forEach((u) => {
      if (u.cnicNumber) {
        if (!cnicMap[u.cnicNumber]) cnicMap[u.cnicNumber] = [];
        cnicMap[u.cnicNumber].push(u);
      }
    });
    // Only keep CNICs with more than one user
    const summary = Object.entries(cnicMap)
      .filter(([_, arr]) => arr.length > 1)
      .map(([cnic, arr]) => ({ cnic, users: arr }));
    setDuplicateCnicSummary(summary);
  }, [users]);

  // Get unique countries and currencies for dropdowns
  const countries = Array.from(
    new Set(users.map((u) => u.country).filter(Boolean))
  );
  const currencies = Array.from(
    new Set(users.map((u) => u.currency).filter(Boolean))
  );

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleVerify = async (userId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/users/verify/${userId}`);
      // Refresh users list after verification
      const response = await axios.get(`${BACKEND_URL}/api/users`);
      setUsers(response.data);
    } catch (err) {
      console.error("Error verifying user:", err);
    }
  };

  const handleUnverify = async (userId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/users/unverify/${userId}`);
      // Refresh users list after unverification
      const response = await axios.get(`${BACKEND_URL}/api/users`);
      setUsers(response.data);
    } catch (err) {
      console.error("Error unverifying user:", err);
    }
  };

  const handleView = async (userId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/users/${userId}`);
      setSelectedUser(res.data);
      setShowModal(true);
    } catch (err) {
      alert("Failed to fetch user details");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleCnicView = (cnic) => {
    const usersWithSameCnic = users.filter(
      (u) => u.cnicNumber === cnic || u.imgCNIC === cnic
    );
    setModalCnicUsers(usersWithSameCnic);
    setModalCnic(cnic);
    setShowCnicModal(true);
  };

  const closeCnicModal = () => {
    setShowCnicModal(false);
    setModalCnicUsers([]);
    setModalCnic("");
  };

  const handleResetFilters = () => {
    setFilters({
      verified: "all",
      country: "all",
      currency: "all",
      cnicMatch: "all",
      blocked: "all",
    });
    setSearch("");
  };

  const handleBlock = (userId) => {
    setBlockUserId(userId);
    setBlockReason("");
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    setIsLoading(true);
    try {
      await axios.put(`${BACKEND_URL}/api/users/block/${blockUserId}`, {
        reason: blockReason,
      });
      setShowBlockModal(false);
      setBlockUserId(null);
      setShowMailSent(true);
      const response = await axios.get(`${BACKEND_URL}/api/users`);
      setUsers(response.data);
    } catch (err) {
      alert("Failed to block user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    setIsLoading(true);
    try {
      await axios.put(`${BACKEND_URL}/api/users/unblock/${userId}`);
      const response = await axios.get(`${BACKEND_URL}/api/users`);
      setUsers(response.data);
      setUnblockSuccess(true);
      setTimeout(() => setUnblockSuccess(false), 2000);
    } catch (err) {
      alert("Failed to unblock user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={s.section}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Registered Users</h2>
        <div className={s.searchBarWrapper}>
          <input
            type="text"
            className={s.searchBar}
            placeholder="Search by email, name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: "350px",
              fontSize: "1rem",
            }}
          />
        </div>
      </div>
      {/* --- Filter Box --- */}
      <div className={s.filterBox}>
        <select
          name="verified"
          value={filters.verified}
          onChange={handleFilterChange}
        >
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <select
          name="country"
          value={filters.country}
          onChange={handleFilterChange}
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="currency"
          value={filters.currency}
          onChange={handleFilterChange}
        >
          <option value="all">All Currencies</option>
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="cnicMatch"
          value={filters.cnicMatch}
          onChange={handleFilterChange}
        >
          <option value="all">All CNIC/Image</option>
          <option value="matched">CNIC & Image Matched</option>
          <option value="notmatched">Not Matched</option>
          <option value="duplicate">Duplicate CNIC/Image</option>{" "}
          {/* <-- Add this */}
        </select>
        <select
          name="blocked"
          value={filters.blocked || "all"}
          onChange={handleFilterChange}
        >
          <option value="all">All Users</option>
          <option value="blocked">Blocked Users</option>
          <option value="unblocked">Unblocked Users</option>
        </select>
        <button className={s.resetButton} onClick={handleResetFilters}>
          Remove All Filters
        </button>
      </div>
      {/* --- End Filter Box --- */}
      <table className={s.userTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Country</th>
            <th>Currency</th>
            <th>Role</th>
            <th>Assets</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const cnicKey = `${user.cnicNumber || ""}_${user.imgCNIC || ""}`;
            const isDuplicate = duplicateCnicKeys.includes(cnicKey);

            return (
              <tr
                key={user._id}
                className={`${isDuplicate ? s.duplicateRow : s.userRow} ${
                  user.blocked ? s.blockedRow : ""
                }`}
                onClick={() => handleView(user._id)}
                style={{ cursor: "pointer" }}
              >
                <td>{user.userId}</td>
                <td>{user.email}</td>
                <td>{user.country}</td>
                <td>{user.currency}</td>
                <td>{user.isAdmin ? "Admin" : "User"}</td>
                <td>{user.assets}</td>
                <td>{user.verified ? "Verified" : "Unverified"}</td>
                <td>
                  {user.blocked ? (
                    <button
                      style={{
                        background: "#388e1c",
                        color: "#fff",
                        marginRight: 8,
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleUnblock(user._id);
                      }}
                    >
                      Unblock
                    </button>
                  ) : (
                    <>
                      {!user.verified ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerify(user._id);
                          }}
                        >
                          Verify
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnverify(user._id);
                          }}
                        >
                          Unverify
                        </button>
                      )}
                      <button
                        style={{
                          marginLeft: 8,
                          background: "#e53935",
                          color: "#fff",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBlock(user._id);
                        }}
                      >
                        Block
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* ...existing modal code... */}
      {showModal && selectedUser && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <button className={s.closeButton} onClick={closeModal}>
              ×
            </button>
            <h3>User Details</h3>
            <ul className={s.detailsList}>
              <li>
                <b>First Name:</b> {selectedUser.firstName}
              </li>
              <li>
                <b>Last Name:</b> {selectedUser.lastName}
              </li>
              <li>
                <b>Email:</b> {selectedUser.email}
              </li>
              <li>
                <b>Country:</b> {selectedUser.country}
              </li>
              <li>
                <b>Currency:</b> {selectedUser.currency}
              </li>
              <li>
                <b>CNIC Number:</b> {selectedUser.cnicNumber}
              </li>
              <li>
                <b>CNIC Picture:</b>
                <br />
                {selectedUser.cnicPicture && (
                  <img
                    src={`http://localhost:5000/${selectedUser.cnicPicture}`}
                    alt="CNIC"
                    style={{
                      width: 120,
                      marginTop: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </li>
              <li>
                <b>Image No:</b>{" "}
                {selectedUser.imgCNIC ? (
                  selectedUser.imgCNIC
                ) : (
                  <span style={{ color: "#e53935" }}>Image not matched</span>
                )}
              </li>
              <li>
                <b>CNIC Back Image:</b>
                <br />
                {selectedUser.cnicBackPicture && (
                  <img
                    src={`http://localhost:5000/${selectedUser.cnicBackPicture}`}
                    alt="CNIC Back"
                    style={{
                      width: 120,
                      marginTop: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </li>
              <li>
                <b>Passport Number:</b>{" "}
                {selectedUser.passportNumber || (
                  <span style={{ color: "#e53935" }}>Not provided</span>
                )}
              </li>
              <li>
                <b>Passport Image:</b>
                <br />
                {selectedUser.passportImage ? (
                  <img
                    src={`http://localhost:5000/${selectedUser.passportImage.replace(
                      /^\//,
                      ""
                    )}`}
                    alt="Passport"
                    style={{
                      width: 120,
                      marginTop: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                ) : (
                  <span style={{ color: "#e53935" }}>Not provided</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
      {/* --- CNIC Modal --- */}
      {showCnicModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h3>Users with CNIC: {modalCnic}</h3>
            <ul>
              {modalCnicUsers.map((u) => (
                <li key={u._id}>{u.email}</li>
              ))}
            </ul>
            <button
              className={s.closeButton}
              onClick={() => setShowCnicModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* --- Duplicate CNIC Summary --- */}
      {duplicateCnicSummary.length > 0 && (
        <div className={s.duplicateCnicBox}>
          <h3>Duplicate CNIC Numbers</h3>
          <table className={s.userTable}>
            <thead>
              <tr>
                <th>CNIC Number</th>
                <th>Count</th>
                <th>Show Users</th>
              </tr>
            </thead>
            <tbody>
              {duplicateCnicSummary.map(({ cnic, users }) => (
                <tr key={cnic}>
                  <td>{cnic}</td>
                  <td>{users.length}</td>
                  <td>
                    <button
                      onClick={() => {
                        setModalCnicUsers(users);
                        setModalCnic(cnic);
                        setShowCnicModal(true);
                      }}
                      className={s.showUsersButton}
                    >
                      Show Emails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* --- Block User Modal --- */}
      {showBlockModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h3>Block User</h3>
            <p>Please provide a reason for blocking this user:</p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                borderRadius: 6,
                padding: 8,
                marginBottom: 12,
              }}
            />
            <button
              onClick={confirmBlock}
              style={{
                background: "#e53935",
                color: "#fff",
                marginRight: 8,
              }}
              disabled={!blockReason.trim()}
            >
              Confirm Block
            </button>
            <button onClick={() => setShowBlockModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* --- Mail Sent Confirmation --- */}
      {showMailSent && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h3>Mail Sent</h3>
            <p>The user has been blocked and a notification email was sent.</p>
            <button
              className={s.closeButton}
              onClick={() => setShowMailSent(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {isLoading && (
        <div className={s.loaderOverlay}>
          <div className={s.loaderSpinner}></div>
          <div className={s.loaderText}>Processing, please wait...</div>
        </div>
      )}
      {unblockSuccess && (
        <div className={s.successOverlay}>
          <div className={s.successModal}>
            <span className={s.successIcon}>✔️</span>
            <div>User unblocked successfully!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
