import React from "react";
import styles from "./HomePage.module.css";
import HomeContent from "../../../assets/HomeContect.png";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext"; // if needed
import FAQSection from "./Components/FAQSection";
import Testimonials from "./Components/Testimonials";
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
          <img className={s.Image} src={HomeContent} alt="homeImage" />
        </div>
      </div>

      {/* Features Section */}
      <div className={s.featuresSection}>
        <h2 className={s.featuresTitle}>Features of the platform</h2>
        {/* <p className={s.featuresSubtitle}>
          We regularly improve our platform to make your trading comfortable and safe.
        </p> */}
        <div className={s.featuresGrid}>
          {[
            {
              title: "User-friendly interface",
              desc: "You have access to all the trading instruments you need, and their speed is impressive.",
              link: "Sign up",
            },
            {
              title: "Integrated signals",
              desc: "Signals with 87% accuracy rate will help you to build a profitable strategy.",
              link: "Try it",
            },
            {
              title: "Trading indicators",
              desc: "We have collected the most useful trading indicators for you. Test them on a demo account.",
              link: "Explore",
            },
            {
              title: "Support 24/7",
              desc: "Our highly trained support staff is ready to assist you at any time.",
              link: "Submit a request",
            },
            {
              title: "Bonus programs",
              desc: "Participate in tournaments and giveaways for traders to get bonuses.",
              link: "Get a bonus",
            },
            {
              title: "Deposits and withdrawals",
              desc: "Various deposit options and fast withdrawal of funds. The minimum deposit is only 10 USD.",
              link: "Start trading",
            },
          ].map((item, index) => (
            <div key={index} className={s.featureCard}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <NavLink to={"/register"} className={s.featureLink}>
                {item.link} →
              </NavLink>
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

  <div className={s.footerRight}>
    
    <div className={s.footerSocials}>
      <p>Follow us on social media</p>
      <div className={s.socialIcons}>
        <a href="#"><span>📘</span></a>
        <a href="#"><span>📷</span></a>
        <a href="#"><span>✈️</span></a>
      </div>
    </div>
  </div>
</div>

      </div>
    </>
  );
};

export default HomePage;
