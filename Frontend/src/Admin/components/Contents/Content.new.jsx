import React, { useState, useEffect } from "react";
import styles from "./Content.module.css";
const s = styles;

const FAQForm = ({ faqs, setFaqs }) => {
  // ...existing FAQ logic from Content.jsx...
  // ...copy FAQ logic here...
};

const TestimonialForm = ({ testimonials, setTestimonials }) => {
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState("");
  const [earned, setEarned] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({});

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/testimonials");
      const data = await res.json();
      setTestimonials(data);
    } catch (err) {
      setError("Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !registered.trim() || !earned.trim() || !text.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, registered, earned, rating, text }),
      });
      if (!res.ok) throw new Error("Failed to add testimonial");
      setName("");
      setRegistered("");
      setEarned("");
      setRating(5);
      setText("");
      setSuccess("Testimonial added successfully!");
      fetchTestimonials();
    } catch (err) {
      setError("Failed to add testimonial");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?"))
      return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://localhost:5000/api/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete testimonial");
      setSuccess("Testimonial deleted successfully!");
      fetchTestimonials();
    } catch (err) {
      setError("Failed to delete testimonial");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (testimonial) => {
    setEditId(testimonial._id);
    setEditFields({ ...testimonial });
    setError("");
    setSuccess("");
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const { name, registered, earned, rating, text } = editFields;
    if (!name.trim() || !registered.trim() || !earned.trim() || !text.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/testimonials/${editId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, registered, earned, rating, text }),
        }
      );
      if (!res.ok) throw new Error("Failed to update testimonial");
      setSuccess("Testimonial updated successfully!");
      setEditId(null);
      setEditFields({});
      fetchTestimonials();
    } catch (err) {
      setError("Failed to update testimonial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <h2>Add Testimonial</h2>
      <form onSubmit={handleSubmit} className={s.faqForm}>
        <div className={s.formGroup}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={s.input}
            disabled={loading}
          />
        </div>
        <div className={s.formGroup}>
          <label>Registered</label>
          <input
            type="text"
            value={registered}
            onChange={(e) => setRegistered(e.target.value)}
            className={s.input}
            disabled={loading}
          />
        </div>
        <div className={s.formGroup}>
          <label>Earned</label>
          <input
            type="text"
            value={earned}
            onChange={(e) => setEarned(e.target.value)}
            className={s.input}
            disabled={loading}
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
            disabled={loading}
          />
        </div>
        <div className={s.formGroup}>
          <label>Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={s.textarea}
            disabled={loading}
          />
        </div>
        <button type="submit" className={s.button} disabled={loading}>
          {loading ? "Adding..." : "Add Testimonial"}
        </button>
        {error && <div className={s.error}>{error}</div>}
        {success && <div className={s.success}>{success}</div>}
      </form>
      <h3>Current Testimonials</h3>
      <ul className={s.faqList}>
        {testimonials.map((t) => (
          <li key={t._id} className={s.faqItem}>
            {editId === t._id ? (
              <form onSubmit={handleEdit} className={s.editForm}>
                <input
                  type="text"
                  value={editFields.name}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, name: e.target.value }))
                  }
                  className={s.input}
                  disabled={loading}
                />
                <input
                  type="text"
                  value={editFields.registered}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, registered: e.target.value }))
                  }
                  className={s.input}
                  disabled={loading}
                />
                <input
                  type="text"
                  value={editFields.earned}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, earned: e.target.value }))
                  }
                  className={s.input}
                  disabled={loading}
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editFields.rating}
                  onChange={(e) =>
                    setEditFields((f) => ({
                      ...f,
                      rating: Number(e.target.value),
                    }))
                  }
                  className={s.input}
                  disabled={loading}
                />
                <textarea
                  value={editFields.text}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, text: e.target.value }))
                  }
                  className={s.textarea}
                  disabled={loading}
                />
                <button type="submit" className={s.button} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
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
                <strong>{t.name}</strong> (Registered: {t.registered}, Earned:{" "}
                {t.earned}, Rating: {t.rating})
                <br />
                <span>{t.text}</span>
                <div className={s.faqActions}>
                  <button
                    className={s.button}
                    onClick={() => startEdit(t)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className={s.button}
                    onClick={() => handleDelete(t._id)}
                    disabled={loading}
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
  );
};

const Content = () => {
  const [tab, setTab] = useState("faq");
  const [faqs, setFaqs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

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
        <FAQForm faqs={faqs} setFaqs={setFaqs} />
      ) : (
        <TestimonialForm
          testimonials={testimonials}
          setTestimonials={setTestimonials}
        />
      )}
    </div>
  );
};

export default Content;
