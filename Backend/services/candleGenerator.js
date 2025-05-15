import Coin from "../models/Coin.js";

let io = null;
const INTERVAL_MS = 30000;
const lastPrices = {};
const round = (val) => parseFloat(val.toFixed(4));

const generatePrice = (open, trend, lastTick = open) => {
  const delta = Math.random() * 0.6;
  const base = lastTick;

  switch (trend) {
    case "Up":
      return round(Math.max(open, base + delta));
    case "Down":
      return round(Math.min(open, base - delta));
    case "Random":
      return round(base + (Math.random() < 0.5 ? -delta : delta));
    default:
      return round(base + (Math.random() < 0.7 ? delta : -delta));
  }
};

const updateCandles = async () => {
  const coins = await Coin.find();

  for (const coin of coins) {
    const roundedTime = new Date(Math.floor(Date.now() / 30000) * 30000);
    const lastCandle = coin.candles.filter((c) => c.interval === "30s").at(-1);

    const open = round(lastCandle?.close ?? coin.currentPrice);
    const lastTick = lastPrices[coin.name];
    const close = generatePrice(open, coin.trend, lastTick);

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
    coin.candles = coin.candles.slice(-1000);
    await coin.save();

    if (io) io.emit(`candle:${coin.name}`, candle);
  }
};

const emitTicks = async () => {
  const coins = await Coin.find();

  for (const coin of coins) {
    const last = coin.candles.filter((c) => c.interval === "30s").at(-1);
    if (!last) continue;

    const open = last.open;
    let price = lastPrices[coin.name] ?? last.close;

    const delta = Math.random() * 0.2;

    if (coin.trend === "Up") {
      price = Math.max(open, price + Math.abs(delta));
    } else if (coin.trend === "Down") {
      price = Math.min(open, price - Math.abs(delta));
    } else {
      price += Math.random() < 0.5 ? -delta : delta;
    }

    price = parseFloat(price.toFixed(4));
    price = Math.max(0.01, price); // safety

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

export default { initSocket };
