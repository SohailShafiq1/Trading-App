import React, { useState, useEffect } from "react";
import styles from "../HomePage.module.css";
const s = styles;

const FAQSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faqs`)
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch(() => setFaqs([]));
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <div className={s.faqSection}>
      <h2 className={s.faqTitle}>Frequently asked questions</h2>
      <p className={s.faqSubtitle}>
        See the most common questions of new traders answered here.
      </p>
      <div className={s.faqList}>
        {faqs.map((faq, index) => (
          <div key={faq._id || index} className={s.faqItem}>
            <div className={s.faqQuestion} onClick={() => toggleFAQ(index)}>
              <span>{faq.question}</span>
              <span className={s.faqToggle}>
                {activeIndex === index ? "−" : "+"}
              </span>
            </div>
            {activeIndex === index && (
              <div className={s.faqAnswer}>{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
