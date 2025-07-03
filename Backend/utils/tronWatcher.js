// import axios from "axios";
// import Deposit from "../models/Deposit.js";
// import User from "../models/User.js";

// export const checkTrc20Deposits = async () => {
//   const wallet = process.env.ADMIN_TRON_WALLET;

//   try {
//     const res = await axios.get(`https://apilist.tronscanapi.com/api/token_trc20/transfers`, {
//       params: {
//         limit: 20,
//         start: 0,
//         sort: "-timestamp",
//         toAddress: wallet
//       }
//     });

//     const transactions = res.data?.token_transfers || [];

//     for (let tx of transactions) {
//       const txId = tx.transaction_id;
//       const amount = parseFloat(tx.amount_str) / 1e6; // USDT has 6 decimals

//       // Look for a pending deposit that matches amount and not already verified
//       const deposit = await Deposit.findOne({ amount, txId: null, status: "pending" });

//       if (deposit) {
//         deposit.status = "verified";
//         deposit.txId = txId;
//         await deposit.save();

//         // Credit the user's wallet
//         const user = await User.findOne({ email: deposit.userEmail });
//         user.assets += amount;

//         user.transactions.push({
//           orderId: Math.floor(100000 + Math.random() * 900000).toString(),
//           type: "deposit",
//           amount,
//           paymentMethod: "USDT (TRC20)",
//           status: "success"
//         });

//         await user.save();

//         console.log(`✅ Deposit verified for ${user.email}, amount: $${amount}`);
//       }
//     }
//   } catch (err) {
//     console.error("❌ Error checking TRC20 deposits:", err.message);
//   }
// };
