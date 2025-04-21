import React, { useState } from 'react';
import styles from './Profile.module.css';
const s = styles;
import { NavLink } from 'react-router-dom';
const Profile = () => {
  return (
    <div className={s.container}>
      <div className={s.profileBox}>
        <h2 className={s.title}>Personal data:</h2>
        <div className={s.userInfo}>
          <div className={s.avatar}></div>
          <div>
            <p className={s.email}>example@gmail.com</p>
            <p className={s.userId}>ID: 55468924</p>
            <p className={s.verified}>✅ Verified</p>
          </div>
        </div>

        <div className={s.form}>
          <div className={s.row}>
            <div className={s.inputBox}>
              <label>First Name</label>
              <input type="text" value="James" />
            </div>
            <div className={s.inputBox}>
              <label>Last Name</label>
              <input type="text" value="Charles" />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.inputBox}>
              <label>Email</label>
              <input type="email" value="example@gmail.com" />
            </div>
            <div className={s.inputBox}>
              <label>Password</label>
              <input type="password" value="******" />
              <a href="#" className={s.forgot}>Forget Your Password?</a>
            </div>
          </div>

          <div className={s.row}>
            <div className={s.inputBox}>
              <label>Date Of Birth</label>
              <input type="text" placeholder="DD/MM/YEAR" />
            </div>
            <div className={s.inputBox}>
              <label>Country</label>
              <select>
                <option>Select Country</option>
              </select>
            </div>
          </div>

          <div className={s.actions}>
            <button className={s.saveBtn}>Save</button>
            <NavLink  className={s.logout}>Logout</NavLink>
            <NavLink className={s.delete}>X Delete Account</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
