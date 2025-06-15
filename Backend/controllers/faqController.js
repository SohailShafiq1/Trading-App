import FAQ from "../models/FAQ.js";

export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res
        .status(400)
        .json({ message: "Question and answer are required" });
    }
    const faq = new FAQ({
      question,
      answer,
      createdBy: req.user?._id || null,
    });
    await faq.save();
    res.status(201).json(faq);
  } catch (err) {
    res.status(500).json({ message: "Failed to create FAQ" });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete FAQ" });
  }
};
export const updateFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer },
      { new: true }
    );
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ message: "Failed to update FAQ" });
  }
};