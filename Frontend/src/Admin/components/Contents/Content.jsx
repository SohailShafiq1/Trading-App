import React, { useState, useEffect } from "react";
import styles from "./Content.module.css";
const s = styles;

const Content = () => {
  // Tab state
  const [tab, setTab] = useState("faq");

  // FAQ state and logic
  const [faqs, setFaqs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqError, setFaqError] = useState("");
  const [faqSuccess, setFaqSuccess] = useState("");
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  useEffect(() => {
    if (tab === "faq") fetchFaqs();
    if (tab === "testimonials") fetchTestimonials();
    // eslint-disable-next-line
  }, [tab]);

  const fetchFaqs = async () => {
    setFaqLoading(true);
    setFaqError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faqs`);
      const data = await res.json();
      setFaqs(data);
    } catch (err) {
      setFaqError("Failed to fetch FAQs");
    } finally {
      setFaqLoading(false);
    }
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    setFaqError("");
    setFaqSuccess("");
    if (!question.trim() || !answer.trim()) {
      setFaqError("Both question and answer are required.");
      return;
    }
    setFaqLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });
      if (!res.ok) throw new Error("Failed to add FAQ");
      setQuestion("");
      setAnswer("");
      setFaqSuccess("FAQ added successfully!");
      fetchFaqs();
    } catch (err) {
      setFaqError("Failed to add FAQ");
    } finally {
      setFaqLoading(false);
    }
  };

  const handleFaqDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    setFaqLoading(true);
    setFaqError("");
    setFaqSuccess("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/faqs/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete FAQ");
      setFaqSuccess("FAQ deleted successfully!");
      fetchFaqs();
    } catch (err) {
      setFaqError("Failed to delete FAQ");
    } finally {
      setFaqLoading(false);
    }
  };

  const startFaqEdit = (faq) => {
    setEditId(faq._id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setFaqError("");
    setFaqSuccess("");
  };

  const handleFaqEdit = async (e) => {
    e.preventDefault();
    setFaqError("");
    setFaqSuccess("");
    if (!editQuestion.trim() || !editAnswer.trim()) {
      setFaqError("Both question and answer are required.");
      return;
    }
    setFaqLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/faqs/${editId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: editQuestion, answer: editAnswer }),
        }
      );
      if (!res.ok) throw new Error("Failed to update FAQ");
      setFaqSuccess("FAQ updated successfully!");
      setEditId(null);
      setEditQuestion("");
      setEditAnswer("");
      fetchFaqs();
    } catch (err) {
      setFaqError("Failed to update FAQ");
    } finally {
      setFaqLoading(false);
    }
  };

  // Testimonial state and logic
  const [testimonials, setTestimonials] = useState([]);
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState("");
  const [earned, setEarned] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [testimonialError, setTestimonialError] = useState("");
  const [testimonialSuccess, setTestimonialSuccess] = useState("");
  const [testimonialEditId, setTestimonialEditId] = useState(null);
  const [editFields, setEditFields] = useState({});

  const fetchTestimonials = async () => {
    setTestimonialLoading(true);
    setTestimonialError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonials`
      );
      const data = await res.json();
      setTestimonials(data);
    } catch (err) {
      setTestimonialError("Failed to fetch testimonials");
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    setTestimonialError("");
    setTestimonialSuccess("");
    if (!name.trim() || !registered.trim() || !earned.trim() || !text.trim()) {
      setTestimonialError("All fields are required.");
      return;
    }
    setTestimonialLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, registered, earned, rating, text }),
        }
      );
      if (!res.ok) throw new Error("Failed to add testimonial");
      setName("");
      setRegistered("");
      setEarned("");
      setRating(5);
      setText("");
      setTestimonialSuccess("Testimonial added successfully!");
      fetchTestimonials();
    } catch (err) {
      setTestimonialError("Failed to add testimonial");
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleTestimonialDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?"))
      return;
    setTestimonialLoading(true);
    setTestimonialError("");
    setTestimonialSuccess("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonials/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete testimonial");
      setTestimonialSuccess("Testimonial deleted successfully!");
      fetchTestimonials();
    } catch (err) {
      setTestimonialError("Failed to delete testimonial");
    } finally {
      setTestimonialLoading(false);
    }
  };

  const startTestimonialEdit = (t) => {
    setTestimonialEditId(t._id);
    setEditFields({ ...t });
    setTestimonialError("");
    setTestimonialSuccess("");
  };

  const handleTestimonialEdit = async (e) => {
    e.preventDefault();
    setTestimonialError("");
    setTestimonialSuccess("");
    const { name, registered, earned, rating, text } = editFields;
    if (!name.trim() || !registered.trim() || !earned.trim() || !text.trim()) {
      setTestimonialError("All fields are required.");
      return;
    }
    setTestimonialLoading(true);
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/testimonials/${testimonialEditId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, registered, earned, rating, text }),
        }
      );
      if (!res.ok) throw new Error("Failed to update testimonial");
      setTestimonialSuccess("Testimonial updated successfully!");
      setTestimonialEditId(null);
      setEditFields({});
      fetchTestimonials();
    } catch (err) {
      setTestimonialError("Failed to update testimonial");
    } finally {
      setTestimonialLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button className={s.button} onClick={() => setTab("faq")}>
          FAQ
        </button>
        <button className={s.button} onClick={() => setTab("testimonials")}>
          Testimonials
        </button>
      </div>
      {tab === "faq" ? (
        <div className={s.container}>
          <h2>Add FAQ</h2>
          <form onSubmit={handleFaqSubmit} className={s.faqForm}>
            <div className={s.formGroup}>
              <label>Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className={s.input}
                disabled={faqLoading}
              />
            </div>
            <div className={s.formGroup}>
              <label>Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className={s.textarea}
                disabled={faqLoading}
              />
            </div>
            <button type="submit" className={s.button} disabled={faqLoading}>
              {faqLoading ? "Adding..." : "Add FAQ"}
            </button>
            {faqError && <div className={s.error}>{faqError}</div>}
            {faqSuccess && <div className={s.success}>{faqSuccess}</div>}
          </form>
          <h3>Current FAQs</h3>
          <ul className={s.faqList}>
            {faqs.map((faq) => (
              <li key={faq._id} className={s.faqItem}>
                {editId === faq._id ? (
                  <form onSubmit={handleFaqEdit} className={s.editForm}>
                    <input
                      type="text"
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className={s.input}
                      disabled={faqLoading}
                    />
                    <textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className={s.textarea}
                      disabled={faqLoading}
                    />
                    <button
                      type="submit"
                      className={s.button}
                      disabled={faqLoading}
                    >
                      {faqLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className={s.button}
                      onClick={() => setEditId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>Q:</strong> {faq.question}
                    <br />
                    <strong>A:</strong> {faq.answer}
                    <div className={s.faqActions}>
                      <button
                        className={s.button}
                        onClick={() => startFaqEdit(faq)}
                        disabled={faqLoading}
                      >
                        Edit
                      </button>
                      <button
                        className={s.button}
                        onClick={() => handleFaqDelete(faq._id)}
                        disabled={faqLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={s.container}>
          <h2>Add Testimonial</h2>
          <form onSubmit={handleTestimonialSubmit} className={s.faqForm}>
            <div className={s.formGroup}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={s.input}
                disabled={testimonialLoading}
              />
            </div>
            <div className={s.formGroup}>
              <label>Registered</label>
              <input
                type="date"
                value={registered}
                onChange={(e) => setRegistered(e.target.value)}
                className={s.input}
                disabled={testimonialLoading}
              />
            </div>
            <div className={s.formGroup}>
              <label>Earned</label>
              <input
                type="text"
                value={earned}
                onChange={(e) => setEarned(e.target.value)}
                className={s.input}
                disabled={testimonialLoading}
              />
            </div>
            <div className={s.formGroup}>
              <label>Rating</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={s.input}
                disabled={testimonialLoading}
              />
            </div>
            <div className={s.formGroup}>
              <label>Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={s.textarea}
                disabled={testimonialLoading}
              />
            </div>
            <button
              type="submit"
              className={s.button}
              disabled={testimonialLoading}
            >
              {testimonialLoading ? "Adding..." : "Add Testimonial"}
            </button>
            {testimonialError && (
              <div className={s.error}>{testimonialError}</div>
            )}
            {testimonialSuccess && (
              <div className={s.success}>{testimonialSuccess}</div>
            )}
          </form>
          <h3>Current Testimonials</h3>
          <ul className={s.faqList}>
            {testimonials.map((t) => (
              <li key={t._id} className={s.faqItem}>
                {testimonialEditId === t._id ? (
                  <form onSubmit={handleTestimonialEdit} className={s.editForm}>
                    <input
                      type="text"
                      value={editFields.name || ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, name: e.target.value }))
                      }
                      className={s.input}
                      disabled={testimonialLoading}
                    />
                    <input
                      type="date"
                      value={editFields.registered || ""}
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          registered: e.target.value,
                        }))
                      }
                      className={s.input}
                      disabled={testimonialLoading}
                    />
                    <input
                      type="text"
                      value={editFields.earned || ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, earned: e.target.value }))
                      }
                      className={s.input}
                      disabled={testimonialLoading}
                    />
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editFields.rating || 5}
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          rating: Number(e.target.value),
                        }))
                      }
                      className={s.input}
                      disabled={testimonialLoading}
                    />
                    <textarea
                      value={editFields.text || ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, text: e.target.value }))
                      }
                      className={s.textarea}
                      disabled={testimonialLoading}
                    />
                    <button
                      type="submit"
                      className={s.button}
                      disabled={testimonialLoading}
                    >
                      {testimonialLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className={s.button}
                      onClick={() => setTestimonialEditId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>{t.name}</strong> (Registered: {t.registered},
                    Earned: {t.earned}, Rating: {t.rating})<br />
                    <span>{t.text}</span>
                    <div className={s.faqActions}>
                      <button
                        className={s.button}
                        onClick={() => startTestimonialEdit(t)}
                        disabled={testimonialLoading}
                      >
                        Edit
                      </button>
                      <button
                        className={s.button}
                        onClick={() => handleTestimonialDelete(t._id)}
                        disabled={testimonialLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Content;
