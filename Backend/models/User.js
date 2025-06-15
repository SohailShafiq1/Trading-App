import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    userId: {
      type: Number,
      unique: true,
      required: true,
      default: () => Math.floor(10000000 + Math.random() * 90000000).toString(),
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      enum: ["USD", "EUR", "GBP"],
    },
    firstName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },
    dateOfBirth: {
      type: Date,
      default: null,
      validate: {
        validator: function (dob) {
          return !dob || dob < new Date();
        },
        message: "Date of birth must be in the past",
      },
    },
    profilePicture: {
      type: String,
      default: "",
      validate: {
        validator: function (url) {
          return url === "" || url.match(/\.(jpeg|jpg|gif|png)$/) != null;
        },
        message: "Please provide a valid image URL",
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    assets: {
      type: Number,
      default: 10000,
      min: 0,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    totalBonus: {
      type: Number,
      default: 0,
    },
    usedBonuses: {
      type: [mongoose.Schema.Types.ObjectId], // Now stores bonus IDs
      default: [],
    },

    transactions: [
      {
        orderId: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["deposit", "withdrawal"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0.01,
        },
        paymentMethod: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "success", "failed"],
          default: "pending",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    withdrawals: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0.01,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "autoapproved", "rejected"],
          default: "pending",
        },
        purse: {
          type: String,
          required: true,
          trim: true,
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
        type: {
          type: String,
          enum: ["Buy", "Sell"],
          required: true,
        },
        coin: {
          type: String,
          required: true,
          uppercase: true,
        },
        investment: {
          type: Number,
          required: true,
          min: 0.01,
        },
        entryPrice: {
          type: Number,
          required: true,
          min: 0.00000001,
        },
        exitPrice: {
          type: Number,
          min: 0.00000001,
        },
        result: {
          type: String,
        },
        reward: {
          type: Number,
          default: 0,
        },
        startedAt: {
          type: Date,
        },
        duration: {
          type: Number,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    dailyProfits: [
      {
        date: {
          type: String,
          required: true,
          match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
        },
        profit: {
          type: Number,
          default: 0,
        },
      },
    ],
    cnicNumber: {
      type: String,
      default: "",
    },
    cnicPicture: {
      type: String,
      default: "",
    },
    imgCNIC: {
      type: String,
      default: "",
    },
    cnicBackPicture: {
      type: String,
      default: "",
    },
    passportNumber: {
      type: String,
      default: "",
      match: [/^[A-Za-z0-9]{9}$/, "Passport number must be 9 letters/digits"],
    },
    passportImage: {
      type: String,
      default: "",
    },
    blocked: { type: Boolean, default: false },
    blockReason: { type: String, default: "" },
    tips: {
      type: [
        {
          text: { type: String, required: true },
          status: { type: Boolean, default: true },
        },
      ],
      default: () => [
        { text: "tip1", status: true },
        { text: "tip2", status: true },
        { text: "tip3", status: true },
        { text: "tip4", status: true },
        { text: "tip5", status: true },
        { text: "tip6", status: true },
        { text: "tip7", status: true },
        { text: "tip8", status: true },
        { text: "tip9", status: true },
        { text: "tip10", status: true },
      ],
    },
    unReadNotification: {
      type: Number,
      default: 0,
    },
    notifications: [
      {
        type: {
          type: String,
          required: false,
        },
        message: {
          type: String,
          required: true,
        },
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    complaints: [
      {
        subject: String,
        issue: String,
        screenshots: [String],
        status: { type: String, default: "pending" }, // "pending", "reviewed", "succeed"
        reviewed: { type: Boolean, default: false },
        succeed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    newsRead: {
      type: [mongoose.Schema.Types.ObjectId], // Array of News IDs the user has read
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);

// Additional methods for updating profile pictures
UserSchema.methods.updateProfilePictures = function (req) {
  const update = {};
  if (req.files && req.files.profilePicture) {
    update.profilePicture =
      "/uploads/profile/" + req.files.profilePicture[0].filename;
  }
  if (req.files && req.files.cnicPicture) {
    update.cnicPicture = "/uploads/cnic/" + req.files.cnicPicture[0].filename;
  }
  return this.updateOne(update);
};
