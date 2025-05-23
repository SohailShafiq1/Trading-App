import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AffiliateSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    country: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },
    affiliateCode: {
      type: String,
      required: true,
      unique: true,
    },
    referralLink: {
      type: String,
      required: true,
    },
    team: [
      {
        type: String,
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalDeposit: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    levelStartTime: {
      type: Date,
      default: Date.now,
    },
    prize: {
      type: [String],
      default: [],
    },
    totalPrize: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

AffiliateSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

AffiliateSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Affiliate", AffiliateSchema);
