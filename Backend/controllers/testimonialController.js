import Testimonial from "../models/Testimonial.js";

export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
};

export const createTestimonial = async (req, res) => {
  try {
    const { name, registered, earned, rating, text } = req.body;
    if (!name || !registered || !earned || !rating || !text) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const testimonial = new Testimonial({
      name,
      registered,
      earned,
      rating,
      text,
      createdBy: req.user?._id || null,
    });
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (err) {
    res.status(500).json({ message: "Failed to create testimonial" });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete testimonial" });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { name, registered, earned, rating, text } = req.body;
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { name, registered, earned, rating, text },
      { new: true }
    );
    if (!testimonial)
      return res.status(404).json({ message: "Testimonial not found" });
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ message: "Failed to update testimonial" });
  }
};
