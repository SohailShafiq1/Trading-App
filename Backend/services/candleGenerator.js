import Coin from "../models/Coin.js";

let io = null;
const INTERVAL_MS = 30000;
const lastPrices = {};
const scenarioCounters = {};
const lastDirections = {};

// Track burst state for each coin
const burstState = {};

const round = (val) => parseFloat(val.toFixed(4));

const generatePrice = (open, trend, lastTick = open, coinName = "") => {
  const base = lastTick;
  const counter = scenarioCounters[coinName] ?? 0;
  let direction = 1;
  let delta;

  if (trend === "Random") {
    // --- Realistic burst logic ---
    if (!burstState[coinName]) {
      burstState[coinName] = {
        nextBurst: Math.floor(Math.random() * 21) + 30, // 30-50 candles
        burstActive: false,
        burstDirection: 1,
        burstLeft: 0,
        burstMagnitude: 0.0,
        candleCount: 0,
        burstTarget: 0.0,
        burstAccum: 0.0,
        burstLen: 0,
      };
    }
    const state = burstState[coinName];
    state.candleCount++;
    // Start burst if time
    if (!state.burstActive && state.candleCount >= state.nextBurst) {
      state.burstActive = true;
      state.burstDirection = Math.random() < 0.5 ? 1 : -1;
      state.burstLen = Math.floor(Math.random() * 6) + 5; // 5-10 candles
      state.burstLeft = state.burstLen;
      state.burstTarget = (Math.random() * 10 + 8) * state.burstDirection; // total burst move: 8-18 up or down
      state.burstAccum = 0.0;
      state.candleCount = 0;
      state.nextBurst = Math.floor(Math.random() * 21) + 30;
    }
    // If in burst, apply realistic burst
    if (state.burstActive && state.burstLeft > 0) {
      // For all but last burst candle, random move, but keep track
      let move;
      if (state.burstLeft === 1) {
        // Last burst candle: force to hit target
        move = state.burstTarget - state.burstAccum;
      } else {
        // Larger random move, but not always in burst direction
        move =
          Math.random() * 2.2 -
          1.1 +
          (state.burstTarget / state.burstLen) * 0.7;
        // Clamp so we don't overshoot
        if (Math.abs(state.burstAccum + move) > Math.abs(state.burstTarget)) {
          move = state.burstTarget - state.burstAccum;
        }
      }
      state.burstAccum += move;
      state.burstLeft--;
      if (state.burstLeft === 0) {
        state.burstActive = false;
      }
      return round(Math.max(0.01, base + move));
    }
    // --- Normal random walk for 'Random' trend ---
    const bodyDelta =
      Math.random() < 0.8
        ? Math.random() * 0.35 + 0.08
        : Math.random() * 0.7 + 0.15;
    if (lastDirections[coinName] === undefined)
      lastDirections[coinName] = Math.random() < 0.5 ? 1 : -1;
    if (Math.random() < 0.7) {
      direction = lastDirections[coinName];
    } else {
      direction = -lastDirections[coinName];
    }
    lastDirections[coinName] = direction;
    if (Math.random() < 0.1) {
      direction = lastDirections[coinName];
      lastDirections[coinName + "_streak"] =
        (lastDirections[coinName + "_streak"] || 0) + 1;
      if (lastDirections[coinName + "_streak"] > 3)
        lastDirections[coinName + "_streak"] = 0;
    } else {
      lastDirections[coinName + "_streak"] = 0;
    }
    delta = bodyDelta * (Math.random() * 0.5 + 0.75);
    return round(Math.max(0.01, base + direction * delta));
  }

  // --- All other trends: original logic ---
  delta = Math.random() * 0.9 + 0.9;
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

      const open = round(lastCandle?.close ?? coin.currentPrice);
      const lastTick = lastPrices[coin.name];
      const close = generatePrice(open, coin.trend, lastTick, coin.name);

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
        // Large wicks for random, but small body
        minWick = 0.08 + Math.random() * 0.08; // bigger minimum wick
        wiggle = 0.05 + Math.random() * 0.08;
        // 15% chance for a very large wick
        if (Math.random() < 0.15) {
          minWick *= 2 + Math.random();
          wiggle *= 2 + Math.random();
        }
      } else {
        minWick = 0.01 + Math.random() * 0.02;
        wiggle = Math.random() * 0.03;
        if (consecutiveUp || consecutiveDown) {
          minWick = 0.03 + Math.random() * 0.04; // bigger wick
          wiggle = Math.random() * 0.04 + 0.01;
        }
        // 10% chance for a very large wick
        if (Math.random() < 0.1) {
          minWick *= 2 + Math.random();
          wiggle *= 2 + Math.random();
        }
      }
      let high = Math.max(open, close) + wiggle + minWick;
      let low = Math.max(0.01, Math.min(open, close) - wiggle - minWick);
      // Enforce minimum wick size
      if (high - Math.max(open, close) < minWick)
        high = Math.max(open, close) + minWick;
      if (Math.min(open, close) - low < minWick)
        low = Math.max(0.01, Math.min(open, close) - minWick);
      high = round(high);
      low = round(low);

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
  // These functions will now only generate and emit data for OTC coins
  startEmitTicks();
  startUpdateCandles();
};

export default { initSocket };
