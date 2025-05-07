import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./User.module.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const User = () => {
  const [users, setUsers] = useState([]); // State to store registered users

  // Fetch registered users from the backend
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

  return (
    <div className={s.section}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default User;
