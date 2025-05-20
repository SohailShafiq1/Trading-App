import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import styles from "./User.module.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const User = () => {
  const [users, setUsers] = useState([]);
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
            <tr key={user._id}>
              <td>{user._id}</td>
              <td>{user.email}</td>
              <td>{user.country}</td>
              <td>{user.currency}</td>
              <td>{user.isAdmin ? "Admin" : "User"}</td>
              <td> {user.assets}</td>
              <td>{user.verified ? "Verified" : "Unverified"}</td>
              <td>
                {!user.verified ? (
                  <button onClick={() => handleVerify(user._id)}>Verify</button>
                ) : (
                  <button onClick={() => handleUnverify(user._id)}>
                    Unverify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default User;
