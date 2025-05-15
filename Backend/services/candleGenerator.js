import Coin from "../models/Coin.js";

let io = null;
const INTERVAL_MS = 30000;
const lastPrices = {};
const round = (val) => parseFloat(val.toFixed(4));

const generatePrice = (open, trend, lastTick = open) => {
  const delta = Math.random() * 0.03 + 0.01;
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
  try {
    const coins = await Coin.find();

    for (const coin of coins) {
      const roundedTime = new Date(
        Math.floor(Date.now() / INTERVAL_MS) * INTERVAL_MS
      );
      const lastCandle = coin.candles
        .filter((c) => c.interval === "30s")
        .at(-1);

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
  } catch (err) {
    console.error("Error in updateCandles:", err);
  }
};

const emitTicks = async () => {
  try {
    const coins = await Coin.find();

    for (const coin of coins) {
      const intervalSec = 30;
      const now = Date.now();
      const bucket = Math.floor(now / (intervalSec * 1000)) * intervalSec;
      const roundedTime = new Date(bucket * 1000).toISOString();

      let last = coin.candles.find(
        (c) => c.interval === "30s" && c.time === roundedTime
      );

      if (!last) {
        const prev = coin.candles.filter((c) => c.interval === "30s").at(-1);
        const open = round(prev?.close ?? coin.currentPrice);
        last = {
          time: roundedTime,
          open,
          high: open,
          low: open,
          close: open,
          interval: "30s",
        };
      }

      const open = last.open;
      let price = lastPrices[coin.name] ?? last.close;

      const delta = Math.random() * 0.079 + 0.001;
      const randomChance = Math.random();
      let direction = 1;

      if (randomChance < 0.1) {
        direction = Math.random() < 0.5 ? -1 : 1;
      } else {
        if (coin.trend === "Up") direction = 1;
        else if (coin.trend === "Down") direction = -1;
        else direction = Math.random() < 0.5 ? -1 : 1;
      }

      price = round(Math.max(0.01, price + direction * delta));
      lastPrices[coin.name] = price;

      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      last.close = price;

      if (io) {
        io.emit(`price:${coin.name}`, { time: new Date(), price });
      }
    }
  } catch (err) {
    console.error("Error in emitTicks:", err);
  }
};

const startEmitTicks = async () => {
  await emitTicks();
  setTimeout(startEmitTicks, 2000);
};

const startUpdateCandles = async () => {
  await updateCandles();
  setTimeout(startUpdateCandles, INTERVAL_MS);
};

export const initSocket = (ioInstance) => {
  io = ioInstance;
  startEmitTicks();
  startUpdateCandles();
};

export default { initSocket };
