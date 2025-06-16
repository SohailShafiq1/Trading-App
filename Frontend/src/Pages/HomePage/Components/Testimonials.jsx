import React, { useState, useEffect } from "react";
import styles from "../HomePage.module.css";
const s = styles;

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/testimonials`
        );
        const data = await res.json();
        setTestimonials(data.reverse()); // Show latest first
      } catch (err) {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const visibleTestimonials = showAll ? testimonials : testimonials.slice(0, 6);

  return (
    <div>
      <div className={s.testimonialGrid}>
        {loading ? (
          <div>Loading testimonials...</div>
        ) : visibleTestimonials.length === 0 ? (
          <div>No testimonials found.</div>
        ) : (
          visibleTestimonials.map((item, idx) => (
            <div key={item._id || idx} className={s.testimonialCard}>
              <h3>{item.name}</h3>
              <p className={s.meta}>
                <strong>Registered:</strong> {item.registered}
              </p>
              <p className={s.meta}>
                <strong>Earned:</strong> {item.earned}
              </p>
              <div className={s.stars}>
                {Array.from({ length: item.rating }, (_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
              <p className={s.feedback}>{item.text}</p>
            </div>
          ))
        )}
      </div>
      {!showAll && testimonials.length > 6 && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className={s.button} onClick={() => setShowAll(true)}>
            Show All Reviews
          </button>
        </div>
      )}
      {showAll && testimonials.length > 6 && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className={s.button} onClick={() => setShowAll(false)}>
            Show Less
          </button>
        </div>
      )}
    </div>
  );
};

export default Testimonials;
