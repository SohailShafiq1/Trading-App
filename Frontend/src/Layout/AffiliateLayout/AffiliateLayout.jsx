import { MdUndo } from "react-icons/md";
import styles from "./AffiliateLayout.module.css";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
const s = styles;
import logo from "../../../assets/WealthXLogo.png";

const AffiliateLayout = () => {
  const navigate = useNavigate();
  return (
    <>
      <div style={{ background: "#E0E0E0" }} className={s.container}>
        <div
          className={s.logo}
          onClick={() => {
            navigate("/binarychart");
          }}
        >
          <img src={logo} alt="" />
        </div>
        <div className={s.navBar}>
          <NavLink
            style={{
              background: `linear-gradient(90deg, #66b544, #1a391d)`,
              color: "white",
            }}
            className={s.btn}
            onClick={() => navigate(-1)}
          >
            <MdUndo className={s.icons} />
            Back
          </NavLink>
        </div>
      </div>
      <div style={{ marginBottom: "5rem" }}>
        <Outlet />
      </div>
      <div className={s.footer}>
        <div className={s.footBar}>
          <NavLink className={s.footBtn} onClick={() => navigate(-1)}>
            <MdUndo className={s.icons} />
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default AffiliateLayout;
