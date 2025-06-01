import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./News.module.css";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-modal";

const News = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/news");
        setNewsList(res.data);
        toast.success("News fetched successfully!");
      } catch (err) {
        toast.error("Error fetching news.");
      }
    };
    fetchNews();
  }, []);

  const handleAddNews = async () => {
    if (!title || !content) {
      toast.warn("Title and content are required.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/news",
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNewsList((prev) => [...prev, res.data]);
      setTitle("");
      setContent("");
      toast.success("News added successfully!");
    } catch (err) {
      toast.error("Failed to add news.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (news) => {
    setNewsToDelete(news);
    setDeleteModalIsOpen(true);
  };

  const closeDeleteModal = () => {
    setNewsToDelete(null);
    setDeleteModalIsOpen(false);
  };

  const handleDeleteNews = async () => {
    if (!newsToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/news/${newsToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setNewsList((prev) =>
        prev.filter((news) => news._id !== newsToDelete._id)
      );
      toast.success("News deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete news.");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Manage News</h2>
      <button className="backButton" onClick={() => navigate(-1)}>
        Back
      </button>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Add News</h3>
        <div className={styles.inputGroup}>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter news title"
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter news content"
          />
        </div>
        <button
          className={styles.addButton}
          onClick={handleAddNews}
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : "Add News"}
        </button>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Existing News</h3>
        {newsList.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((news) => (
                <tr key={news._id}>
                  <td>{news.title}</td>
                  <td>{news.content}</td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => openDeleteModal(news)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noNews}>No news available.</p>
        )}
      </div>

      <Modal
        isOpen={deleteModalIsOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Confirmation"
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this news?</p>
        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={closeDeleteModal}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={handleDeleteNews}>
            Delete
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default News;
