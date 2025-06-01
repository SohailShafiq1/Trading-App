import React from "react";
import { AiOutlineSetting } from "react-icons/ai";
import { HiOutlineVolumeUp } from "react-icons/hi";
import { AiTwotoneBell } from "react-icons/ai";
import styles from "./Tabs.module.css";

const Tabs = () => {
  return (
    <div className={styles.tabs}>
      <div className={styles.tab}>
        <AiTwotoneBell />
      </div>
      <div className={styles.tab}>
        <HiOutlineVolumeUp />
      </div>
      <div className={styles.tab}>
        <AiOutlineSetting />
      </div>
    </div>
  );
};

export default Tabs;
