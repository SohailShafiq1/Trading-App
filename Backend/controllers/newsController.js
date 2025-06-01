import News from "../models/News.js";

export const getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.status(200).json(news);
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
