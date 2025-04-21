import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";

const register = async (req, res) => {
  const { email, password, country, currency } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      country,
      currency,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Error Registering User" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = generateToken(user._id);
    res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error Logging In" });
  }
};

export { register, login };
