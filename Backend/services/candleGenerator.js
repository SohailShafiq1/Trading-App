import Coin from "../models/Coin.js";

let io = null;
const INTERVAL_MS = 30000;
const lastPrices = {};
const scenarioCounters = {};

const round = (val) => parseFloat(val.toFixed(4));

const generatePrice = (open, trend, lastTick = open, coinName = "") => {
  const delta = Math.random() * 0.9 + 0.9;
  const base = lastTick;
  const counter = scenarioCounters[coinName] ?? 0;



  switch (trend) {
    case "Up":
      return round(Math.max(open, base + delta));
    case "Down":
      return round(Math.min(open, base - delta));
    case "Random":
      return round(base + (Math.random() < 0.5 ? -delta : delta));
    case "Scenario1": {
      const cycle = counter % 4;
      scenarioCounters[coinName] = counter + 1;
      return cycle < 3
        ? round(Math.max(open, base + delta))
        : round(Math.min(open, base - delta));
    }
    case "Scenario2": {
      const cycle = counter % 10;
      scenarioCounters[coinName] = counter + 1;
      return cycle < 5
        ? round(Math.min(open, base - delta))
        : round(Math.max(open, base + delta));
    }
    case "Scenario3": {
      const cycle = counter % 2;
      scenarioCounters[coinName] = counter + 1;
      return cycle === 0
        ? round(Math.max(open, base + delta))
        : round(Math.min(open, base - delta));
    }
    case "Scenario4":
      scenarioCounters[coinName] = counter + 1;
      return round(base + delta);
    case "Scenario5":
      scenarioCounters[coinName] = counter + 1;
      return round(Math.max(0.01, base - delta));
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
      const close = generatePrice(open, coin.trend, lastTick, coin.name);

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

      if (io) io.emit(`candle:${coin.name}`, { ...candle, trend: coin.trend });
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
      let direction = 1;
      const counter = scenarioCounters[coin.name] ?? 0;

      switch (coin.trend) {
        case "Up":
          direction = 1;
          break;
        case "Down":
          direction = -1;
          break;
        case "Random":
          direction = Math.random() < 0.5 ? -1 : 1;
          break;
        case "Scenario1":
          direction = counter % 4 < 3 ? 1 : -1;
          break;
        case "Scenario2":
          direction = counter % 10 < 5 ? -1 : 1;
          break;
        case "Scenario3":
          direction = counter % 2 === 0 ? 1 : -1;
          break;
        case "Scenario4":
          direction = 1;
          break;
        case "Scenario5":
          direction = -1;
          break;
        default:
          direction = Math.random() < 0.5 ? -1 : 1;
          break;
      }

      price = round(Math.max(0.01, price + direction * delta));
      lastPrices[coin.name] = price;

      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      last.close = price;

      if (io) {
        io.emit(`price:${coin.name}`, {
          time: new Date(),
          price,
          trend: coin.trend,
          counter: counter,
        });
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
