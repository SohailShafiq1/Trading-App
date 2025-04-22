import bcrypt from "bcryptjs";

const testPassword = async () => {
  const plainPassword = "israr";
  const hash = await bcrypt.hash(plainPassword, 10);

  console.log("Test hash:", hash);

  const isMatch = await bcrypt.compare(plainPassword, hash);
  console.log("Password match result:", isMatch); // Should return true
};

export default testPassword;
