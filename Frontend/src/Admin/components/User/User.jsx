import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import styles from "./User.module.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const User = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users`);
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

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

  return (
    <div className={s.section}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>Registered Users</h2>
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
          {users.map((user) => (
            <tr
              key={user._id}
              className={s.userRow}
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
          ))}
        </tbody>
      </table>
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
              {/* Add more fields as needed */}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
