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
  });
  const [duplicateCnicKeys, setDuplicateCnicKeys] = useState([]);
  const [duplicateCnicSummary, setDuplicateCnicSummary] = useState([]);
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
    setFilteredUsers(filtered);
  }, [filters, users, duplicateCnicKeys]);

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
    });
  };

  return (
    <div className={s.section}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>Registered Users</h2>
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
                className={isDuplicate ? s.duplicateRow : s.userRow}
                onClick={() => handleView(user._id)}
                style={{ cursor: "pointer" }}
              >
                <td>{user._id}</td>
                <td>{user.email}</td>
                <td>{user.country}</td>
                <td>{user.currency}</td>
                <td>{user.isAdmin ? "Admin" : "User"}</td>
                <td>{user.assets}</td>
                <td>{user.verified ? "Verified" : "Unverified"}</td>
                <td>
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
    </div>
  );
};

export default User;
