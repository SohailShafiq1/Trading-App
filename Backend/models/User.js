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
      default: false,
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
          enum: ["pending", "approved", "rejected"],
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
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password; // Never send password in responses
        return ret;
      },
    },
  }
);

// Simplified password hashing middleware
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
