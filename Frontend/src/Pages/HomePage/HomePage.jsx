import React from "react";
import styles from "./HomePage.module.css";
import HomeContent from "../../../assets/HomeContect.png";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext"; // if needed
import FAQSection from "./Components/FAQSection";
import Testimonials from "./Components/Testimonials";
import WealthXVideo from "../../../assets/video.mp4";
const s = styles;

const HomePage = () => {
  
  return (
    <>
      <div className={s.homeContainer}>
        <p className={s.homeDescription}>
          Your Gateway to Smarter,<br />Faster, More Profitable Trades 
          
        </p>
        <div className={s.homeParagraph}>
         Register now and receive $10,000 in your demo account to start learning how to trade.
        </div>
        <div className={s.homeButton}>
          <NavLink to={"/register"}>Create a free account</NavLink>
        </div>
        <div className={s.homeImage}>
          <video className={s.Image} src={WealthXVideo} autoPlay loop muted playsInline poster={HomeContent} />
        </div>
      </div>

      {/* Features Section */} 
      <div className={s.featuresSection}>
        <h2 className={s.featuresTitle}>What Our Platform Offers</h2>
        {/* <p className={s.featuresSubtitle}>
          We regularly improve our platform to make your trading comfortable and safe.
        </p> */}
        <div className={s.featuresGrid}>
          {[
            {
              title: "1 Intuitive Design",
              desc: "Access a full range of trading tools, all optimized for speed and efficiency.",
            },
            {
              title: "2 Technical Indicators",
              desc: "Use your demo account to test the top trading indicators we’ve carefully selected for you.",
            },
            {
              title: "3. 24/7 Customer Support",
              desc: "Our expert support team is always available to help you whenever you need it.",
            },
            {
              title: "4 Add or Withdraw Funds",
              desc: "Enjoy fast withdrawals and flexible deposit options with a minimum deposit of only $10.",
            }
            
          ].map((item, index) => (
            <div key={index} className={s.featureCard}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
             
            </div>
          ))}
        </div>
<div className={s.demoBanner}>
  <div className={s.demoContent}>
    <div className={s.demoLeft}>
      <span className={s.demoIcon}>🎓💵</span>
      <div>
        <p className={s.demoMainText}>Trade on demo – no registration is required!</p>
        <p className={s.demoSubText}>Or register a personal account to access additional features.</p>
      </div>
    </div>
    <div className={s.demoButtons}>
      <NavLink to="/register" className={s.demoBtnDark}>
        Try demo
      </NavLink>
      <NavLink to="/register" className={s.demoBtnGreen}>
        Register an account
      </NavLink>
    </div>
  </div>
</div>
<div className={s.testimonialSection}>
  <h2 className={s.testimonialTitle}>What people say about us</h2>
  <p className={s.testimonialSubtitle}>
    We asked our customers to rate our platform on a five-point scale.
  </p>
 <Testimonials/>
</div>
<FAQSection />
<div className={s.footer}>
  <div className={s.footerLeft}>
    <div className={s.footerLogo}>WEALTHX</div>
    <div className={s.footerColumn}>
      <h4>FAQ →</h4>
      <p>General questions</p>
      <p>Financial questions</p>
      <p>Verification</p>
    </div>
    <div className={s.footerColumn}>
      <h4>About us →</h4>
      <p>Contacts</p>
    </div>
    <div className={s.footerColumn}>
      <h4>More</h4>
      <p>Demo account</p>
      <p>
        Affiliate program <span style={{ fontSize: "0.8rem" }}>↗</span>
      </p>
    </div>
  </div>

 
</div>

      </div>
    </>
  );
};

export default HomePage;
