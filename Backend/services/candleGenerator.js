import Coin from "../models/Coin.js";

let io = null;
const INTERVAL_MS = 30000;
const lastPrices = {};

const round = (val) => parseFloat(val.toFixed(4));

const generateClosePrice = (open, trend) => {
  const delta = round(Math.random() * 0.6);

  switch (trend) {
    case "Up":
      return round(open + delta);
    case "Down":
      return round(Math.max(0.1, open - delta));
    case "Random":
      return round(open + (Math.random() < 0.5 ? -delta : delta));
    default: // Scenario1–5
      return round(open + (Math.random() < 0.7 ? delta : -delta));
  }
};

const updateCandles = async () => {
  const coins = await Coin.find();

  for (const coin of coins) {
    const roundedTime = new Date(Math.floor(Date.now() / 30000) * 30000);
    const lastCandle = coin.candles.filter((c) => c.interval === "30s").at(-1);

    const open = round(lastCandle?.close ?? coin.currentPrice);
    const close = generateClosePrice(open, coin.trend);

    // ✅ Smaller and stable tails
    const wiggle = Math.random() * 0.05;
    const high = round(Math.max(open, close) + wiggle);
    const low = round(Math.max(0.01, Math.min(open, close) - wiggle));

    const candle = {
      time: roundedTime.toISOString(),
      open,
      close,
      high,
      low,
      interval: "30s",
    };

    coin.candles.push(candle);
    coin.currentPrice = close;
    coin.candles = coin.candles.slice(-1000); // limit to recent
    await coin.save();

    if (io) {
      io.emit(`candle:${coin.name}`, candle);
    }
  }
};

const emitTicks = async () => {
  const coins = await Coin.find();

  for (const coin of coins) {
    const last = coin.candles.filter((c) => c.interval === "30s").at(-1);
    if (!last) continue;

    let price = lastPrices[coin.name] || last.close;

    // ✅ Reduced oscillation range (±0.1)
    const oscillation = Math.random() * 0.2 - 0.1;
    price = round(price + oscillation);
    price = Math.max(0.1, price); // prevent below zero
    lastPrices[coin.name] = price;

    if (io) {
      io.emit(`price:${coin.name}`, { time: new Date(), price });
    }
  }
};

export const initSocket = (ioInstance) => {
  io = ioInstance;
  setInterval(updateCandles, INTERVAL_MS);
  setInterval(emitTicks, 1000);
};

export default {
  initSocket,
};
