import React, { useState, useEffect } from 'react';
import styles from "./HomePage.module.css";
const s = styles


const faqs = [
  {
    question: "How do I learn how to trade?",
    answer: "Sign up and start practicing on a free demo account. It is just like real trading, except virtual funds are used.",
  },
  {
    question: "How long does it take to withdraw funds?",
    answer: "Generally, a withdrawal procedure may take from 1 to 5 days, depending on volume and your method. We do our best to withdraw your funds as soon as possible.",
  },
  {
    question: "What is trading platform and what is it for?",
    answer: "A trading platform is software that allows you to perform trading operations using various instruments, view quotes, and manage market positions.",
  },
  {
    question: "Can I trade using a phone / mobile device?",
    answer: "Yes, the platform works on all modern computers and mobile devices. You can use the browser version or mobile app.",
  },
  {
    question: "What is the minimum deposit amount?",
    answer: "You can start trading with as little as 10 USD. No large deposits required to begin.",
  },
  {
    question: "Are there any deposit or withdrawal fees?",
    answer: "No, the broker does not charge deposit/withdrawal fees. However, third-party services may charge their own fees.",
  },
];

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

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
          <div key={index} className={s.faqItem}>
            <div
              className={s.faqQuestion}
              onClick={() => toggleFAQ(index)}
            >
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
