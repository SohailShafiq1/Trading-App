import React from "react";
import styles from "./HomePage.module.css";
import HomeContent from "../../../assets/HomeContect.png";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext"; // if needed
import FAQSection from "./FAQSection";
const s = styles;

const HomePage = () => {
  
  return (
    <>
      <div className={s.homeContainer}>
        <p className={s.homeDescription}>
          Smart and Innovative <br />
          Platform for Investments
        </p>
        <div className={s.homeParagraph}>
          Sign up and get 10,000 USD to your demo account to learn how to trade
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
        <p className={s.featuresSubtitle}>
          We regularly improve our platform to make your trading comfortable and safe.
        </p>
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
  <div className={s.testimonialGrid}>
    {[
      {
        name: "Rizwan",
        registered: "November 28, 2024",
        earned: "$1041",
        rating: 5,
        text: "This is a great trading platform. I tried some others before, but this one is smooth, fast, and gives real payouts...",
      },
      {
        name: "Sofia",
        registered: "November 15, 2023",
        earned: "$612",
        rating: 5,
        text: "My best choice so far. Super easy for deposits and withdrawals. Excellent support team as well.",
      },
      {
        name: "Adarsh",
        registered: "November 01, 2024",
        earned: "$379",
        rating: 5,
        text: "The platform is intuitive and smooth. I’m happy with the returns and interface!",
      },
      {
        name: "Zain",
        registered: "November 21, 2023",
        earned: "$134",
        rating: 5,
        text: "Very user-friendly. My trades process instantly and I like the demo account too.",
      },
      {
        name: "Md Imran",
        registered: "November 24, 2024",
        earned: "$217",
        rating: 5,
        text: "Deposit and withdrawal system is top-notch. Happy user!",
      },
      {
        name: "Bilal",
        registered: "December 03, 2023",
        earned: "$780",
        rating: 5,
        text: "WealthX is fantastic. From signup to trading, everything was super smooth.",
      },
    ].map((item, idx) => (
      <div key={idx} className={s.testimonialCard}>
        <h3>{item.name}</h3>
        <p className={s.meta}><strong>Registered:</strong> {item.registered}</p>
        <p className={s.meta}><strong>Earned:</strong> {item.earned}</p>
        <div className={s.stars}>
          {Array.from({ length: item.rating }, (_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
        <p className={s.feedback}>{item.text}</p>
        <a href="#" className={s.readMore}>Read More →</a>
      </div>
    ))}
  </div>

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
