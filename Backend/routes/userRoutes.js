// routes/userRoutes.js
import express from "express";
import {
  healthCheck,
  createDeposit,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUserAssets,
  createWithdrawal,
  getUserTransactions,
  saveUserTrade,
  updateTradeResult,
  getUserTrades,
  updateUserProfile,
  verifyUser,
  unverifyUser,
  checkVerificationStatus,
  validateCNIC,
  upload,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/health", healthCheck);
router.post("/deposit", createDeposit);
router.get("/", getAllUsers);
router.get("/email/:email", getUserByEmail);
router.get("/:id", getUserById);
router.put("/update-assets", updateUserAssets);
router.post("/withdraw", createWithdrawal);
router.get("/transactions/:email", getUserTransactions);
router.post("/trade", saveUserTrade);
router.put("/trade/result", updateTradeResult);
router.get("/trades/:email", getUserTrades);
router.put(
  "/update-profile",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "cnicPicture", maxCount: 1 },
  ]),
  updateUserProfile
);
router.put("/verify/:id", verifyUser);
router.put("/unverify/:id", unverifyUser);
router.get("/is-verified/:id", checkVerificationStatus);
router.post("/validate-cnic", validateCNIC);

// Block user by admin
router.put("/block/:id", async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { blocked: true, blockReason: reason },
    { new: true }
  );
  if (user) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Only for testing with self-signed certs
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Account Has Been Blocked",
      text: `Dear ${
        user.firstName || "User"
      },\n\nYour account has been blocked by the admin.\nReason: ${reason}\n\nIf you believe this is a mistake, please contact support.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Block email sent to", user.email);
      // Add this to track successful sends
      if (user) {
        user.lastEmailSent = new Date();
        await user.save();
      }
    } catch (error) {
      console.error("Error sending block email:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      // Consider storing the error for debugging
      if (user) {
        user.emailError = error.message;
        await user.save();
      }
    }
  }
  res.json({ success: true });
});

router.put("/unblock/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      blocked: false,
      blockReason: "",
    },
    { new: true }
  );
  if (user) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Congratulations! Your Account Has Been Unblocked",
      text: `Dear ${
        user.firstName || "User"
      },\n\nCongratulations! Our team has reviewed your account and it has been unblocked. You can now log in and continue using our services.\n\nIf you have any questions, please contact support.\n\nBest regards,\nSupport Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Unblock email sent to", user.email);
    } catch (error) {
      console.error("Error sending unblock email:", error);
    }
  }
  res.json({ success: true });
});

router.post("/test-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "Test Email",
      text: "This is a test email from your server.",
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response,
    });
  }
});
export default router;
