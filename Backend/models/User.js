import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const UserSchema = new mongoose.Schema(
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
    userId: {
      type: String,
      unique: true,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    assets: {
      type: Number,
      default: 10000,
    },

    transactions: [
      {
        orderId: { type: String, required: true },
        type: { type: String, enum: ["deposit", "withdrawal"], required: true },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, required: true },
        status: {
          type: String,
          enum: ["pending", "success", "failed"],
          default: "pending",
        },
        date: { type: Date, default: Date.now },
      },
    ],
    withdrawals: [
      {
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        purse: {
          type: String,
          required: true,
        },
        network: {
          type: String,
          required: true,
        },
        paymentMethod: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        processedAt: {
          type: Date,
        },
      },
    ],
    trades: [
      {
        type: { type: String, enum: ["Buy", "Sell"], required: true },
        coin: { type: String, required: true },
        investment: { type: Number, required: true },
        entryPrice: { type: Number, required: true },
        exitPrice: { type: Number },
        result: {
          type: String,
          enum: ["win", "loss", "pending"],
          default: "pending",
        },
        reward: { type: Number, default: 0 },
        startedAt: { type: Date },
        duration: { type: Number },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    dailyProfits: [
      {
        date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
        profit: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);

  // Only assign userId if it's a new user and not set
  if (this.isNew && !this.userId) {
    let unique = false;
    while (!unique) {
      const randomId = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();
      const existing = await mongoose.models.User.findOne({ userId: randomId });
      if (!existing) {
        this.userId = randomId;
        unique = true;
      }
    }
  }

  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);
