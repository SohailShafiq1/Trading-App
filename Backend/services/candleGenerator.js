import Coin from "../models/Coin.js";

let io = null;
const INTERVAL_MS = 30000;
const lastPrices = {};
const scenarioCounters = {};
const lastDirections = {};

// Track burst state for each coin
const burstState = {};
// Track momentum and smoothing for each coin
const momentumState = {};

const round = (val) => {
  if (isNaN(val) || val == null) {
    return 1.0; // Default fallback value
  }
  return parseFloat(val.toFixed(4));
};

const generatePrice = (open, trend, lastTick = open, coinName = "") => {
  const base = lastTick;
  const counter = scenarioCounters[coinName] ?? 0;
  let direction = 1;
  let delta;

  if (trend === "Random") {
    // --- Completely random, realistic price action ---
    // Remove persistent momentum/microtrend/mean reversion for true randomness
    // Use a random walk with realistic volatility and rare big moves
    let volatility = 0.05 + Math.random() * 0.15; // 0.05-0.2 typical move
    let surprise = 1;
    if (Math.random() < 0.01) {
      // 1% chance of a big move (surprise event)
      surprise = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1.5 + 0.5); // -2.0 to 2.0
    }
    let move =
      (Math.random() - 0.5) * 2 * volatility +
      surprise * (Math.random() < 0.01 ? 1 : 0);
    // Clamp move to ±2
    move = Math.max(-2, Math.min(2, move));
    let newPrice = round(Math.max(0.01, base + move));
    // Prevent unrealistic jumps (e.g., negative or zero price)
    if (isNaN(newPrice) || newPrice <= 0) newPrice = 1.0;
    return newPrice;
  }

  // --- All other trends: increased volatility for bigger candles ---
  delta = Math.random() * 2.5 + 1.5; // Increased from 0.9+0.9 to 1.5+2.5 for up to 2 price change
  switch (trend) {
    case "Up":
      return round(Math.max(open, base + delta));
    case "Down":
      return round(Math.min(open, base - delta));
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

const getValidStartingPrice = (coin) => {
  let price = Number(coin.startingPrice);
  if (!price || isNaN(price) || price <= 0) {
    console.warn(
      `[candleGenerator] WARNING: Coin '${coin.name}' has missing/invalid startingPrice ('${coin.startingPrice}'). Using fallback value 1.`
    );
    price = 1;
  }
  return round(price);
};

const updateCandles = async () => {
  try {
    // Only fetch coins with type OTC
    const coins = await Coin.find({ type: "OTC" });

    for (const coin of coins) {
      const roundedTime = new Date(
        Math.floor(Date.now() / INTERVAL_MS) * INTERVAL_MS
      );
      const lastCandle = coin.candles
        .filter((c) => c.interval === "30s")
        .at(-1);

      // --- Robust open price initialization ---
      let open;
      if (!lastCandle) {
        open = getValidStartingPrice(coin);
      } else {
        open = round(lastCandle.close);
      }
      // --- Robust lastTick initialization ---
      let lastTick = lastPrices[coin.name];
      if (lastTick === undefined) {
        lastTick = open;
        lastPrices[coin.name] = open;
      }
      const close = generatePrice(open, coin.trend, lastTick, coin.name);
      lastPrices[coin.name] = close;

      // --- Realistic wick logic: more variability ---
      let prev1 = coin.candles.filter((c) => c.interval === "30s").at(-1);
      let prev2 = coin.candles.filter((c) => c.interval === "30s").at(-2);
      let consecutiveUp = false,
        consecutiveDown = false;
      if (prev1 && prev2) {
        consecutiveUp = prev1.close > prev1.open && prev2.close > prev2.open;
        consecutiveDown = prev1.close < prev1.open && prev2.close < prev2.open;
      }
      // --- Enhanced wick logic for Random trend ---
      let minWick, wiggle;
      if (coin.trend === "Random") {
        minWick = 0.01 + Math.random() * 0.03; // 0.01-0.04
        wiggle = 0.01 + Math.random() * 0.03; // 0.01-0.04
        if (Math.random() < 0.05) {
          // Rarely allow a slightly larger wick
          minWick *= 2 + Math.random();
          wiggle *= 2 + Math.random();
        }
      } else {
        minWick = 0.01 + Math.random() * 0.02;
        wiggle = Math.random() * 0.03;
        if (consecutiveUp || consecutiveDown) {
          minWick = 0.03 + Math.random() * 0.04;
          wiggle = Math.random() * 0.04 + 0.01;
        }
        if (Math.random() < 0.1) {
          minWick *= 2 + Math.random();
          wiggle *= 2 + Math.random();
        }
      }
      let high = Math.max(open, close) + wiggle + minWick;
      let low = Math.max(0.01, Math.min(open, close) - wiggle - minWick);
      if (high - Math.max(open, close) < minWick)
        high = Math.max(open, close) + minWick;
      if (Math.min(open, close) - low < minWick)
        low = Math.max(0.01, Math.min(open, close) - minWick);
      high = round(high);
      low = round(low);

      // --- Prevent NaN/invalid prices ---
      if ([open, close, high, low].some((v) => isNaN(v) || v <= 0)) {
        console.error(
          `[candleGenerator] ERROR: Invalid candle values for coin '${coin.name}': open=${open}, close=${close}, high=${high}, low=${low}`
        );
        continue;
      }

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
      coin.candles = coin.candles;
      await coin.save();

      if (io) io.emit(`candle:${coin.name}`, { ...candle, trend: coin.trend });
    }
  } catch (err) {
    console.error("Error in updateCandles:", err);
  }
};

const emitTicks = async () => {
  try {
    // Only fetch coins with type OTC
    const coins = await Coin.find({ type: "OTC" });

    for (const coin of coins) {
      const intervalSec = 30;
      const now = Date.now();
      const bucket = Math.floor(now / (intervalSec * 1000)) * intervalSec;
      const roundedTime = new Date(bucket * 1000).toISOString();

      let last = coin.candles.find(
        (c) => c.interval === "30s" && c.time === roundedTime
      );

      // --- Robust tick initialization ---
      if (!last) {
        const prev = coin.candles.filter((c) => c.interval === "30s").at(-1);
        let open;
        if (!prev) {
          open = getValidStartingPrice(coin);
        } else {
          open = round(prev.close);
        }
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
      let price = lastPrices[coin.name];
      if (price === undefined) {
        price = open;
        lastPrices[coin.name] = open;
      }

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
      if (isNaN(price) || price <= 0) {
        console.error(
          `[candleGenerator] ERROR: Invalid tick price for coin '${coin.name}': price=${price}. Using open=${open}`
        );
        price = open;
      }
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

// Wait for the next 00 seconds mark (only once when server starts)
const waitForNextCandleTime = () => {
  return new Promise((resolve) => {
    const now = new Date();
    const seconds = now.getUTCSeconds();
    const milliseconds = now.getUTCMilliseconds();

    if (seconds === 0 && milliseconds < 100) {
      // We're already at 00 seconds, resolve immediately
      resolve();
    } else {
      // Calculate time until next 00 seconds
      const timeUntilNext = (60 - seconds) * 1000 - milliseconds;
      console.log(
        `⏱️  Waiting ${timeUntilNext}ms until next 00 seconds to start candle generation...`
      );
      setTimeout(resolve, timeUntilNext);
    }
  });
};

export const initSocket = async (ioInstance) => {
  io = ioInstance;

  // Wait for 00 seconds before starting candle generation
  await waitForNextCandleTime();
  console.log(`🕐 Starting candle generation at ${new Date().toISOString()}`);

  // These functions will now only generate and emit data for OTC coins
  startEmitTicks();
  startUpdateCandles();
};

export default { initSocket };
