import News from "../models/News.js";
import User from "../models/User.js";

export const getAllNews = async (req, res) => {
  try {
    const { email } = req.query;
    const news = await News.find();
    let newsRead = [];
    if (email) {
      const user = await User.findOne({ email });
      if (user) newsRead = user.newsRead || [];
    }
    const newsWithRead = news.map((n) => ({
      ...n.toObject(),
      read: newsRead.map(String).includes(String(n._id)),
    }));
    const unreadCount = newsWithRead.filter((n) => !n.read).length;
    res.status(200).json({ news: newsWithRead, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching news", error });
  }
};

export const createNews = async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const news = new News({ title, content });
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ message: "Error creating news", error });
  }
};

export const updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const news = await News.findByIdAndUpdate(
      id,
      { title, content },
      { new: true }
    );
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: "Error updating news", error });
  }
};

export const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findByIdAndDelete(id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting news", error });
  }
};

export const markAllNewsRead = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const allNews = await News.find();
    const allIds = allNews.map((n) => n._id);
    user.newsRead = allIds;
    await user.save();
    res.status(200).json({ message: "All news marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark news as read", error });
  }
};
