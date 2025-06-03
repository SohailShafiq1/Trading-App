import mongoose from "mongoose";
import User from "../models/User.js"; // Adjust path if needed

// Connect to your MongoDB
await mongoose.connect("mongodb://localhost:27017/trading-app"); // Change to your DB name

const users = await User.find({ "complaints.screenshots.0": /uploads/ });

for (const user of users) {
  let changed = false;
  for (const complaint of user.complaints) {
    if (complaint.screenshots && complaint.screenshots.length > 0) {
      const newScreenshots = complaint.screenshots.map(ss => {
        // Only fix if it contains a path
        if (ss.includes("/") || ss.includes("\\")) {
          return ss.split(/[/\\]/).pop();
        }
        return ss;
      });
      if (JSON.stringify(newScreenshots) !== JSON.stringify(complaint.screenshots)) {
        complaint.screenshots = newScreenshots;
        changed = true;
      }
    }
  }
  if (changed) {
    await user.save();
    console.log(`Fixed user: ${user.email}`);
  }
}

console.log("Done!");
process.exit();