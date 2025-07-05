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
    // Initialize momentum state for truly random price action
    if (!momentumState[coinName]) {
      momentumState[coinName] = {
        momentum: 0,
        lastMove: 0,
        consecutiveCount: 0,
        lastDirection: 0,
        priceHistory: [],
        meanReversion: 0,
        volatility: 0.08, // Lowered base volatility for realism
        trendStrength: 0,
        microTrend: 0,
        microTrendCount: 0,
        lastPrice: base,
      };
    }

    const momentum = momentumState[coinName];

    // Ensure priceHistory is initialized
    if (!momentum.priceHistory) {
      momentum.priceHistory = [];
    }

    // Track price history for mean reversion
    momentum.priceHistory.push(base);
    if (momentum.priceHistory.length > 20) {
      momentum.priceHistory.shift();
    }

    // Calculate mean reversion tendency
    if (momentum.priceHistory.length >= 10) {
      const recent = momentum.priceHistory.slice(-10);
      const avg = recent.reduce((sum, price) => sum + price, 0) / recent.length;
      momentum.meanReversion = (avg - base) * 0.03; // 3% reversion factor
    }

    // --- Micro trend logic: creates short-term directional bias ---
    if (momentum.microTrendCount <= 0) {
      // Start new micro trend
      momentum.microTrend = (Math.random() - 0.5) * 1.2; // -0.6 to 0.6
      momentum.microTrendCount = Math.floor(Math.random() * 6) + 2; // 2-7 candles
    }
    momentum.microTrendCount--;

    // --- Burst logic with proper randomness ---
    if (!burstState[coinName]) {
      burstState[coinName] = {
        nextBurst: Math.floor(Math.random() * 50) + 25, // 25-75 candles
        burstActive: false,
        burstDirection: 1,
        burstLeft: 0,
        candleCount: 0,
        burstTarget: 0.0,
        burstAccum: 0.0,
        burstLen: 0,
        cooldownCount: 0,
      };
    }
    const state = burstState[coinName];
    state.candleCount++;

    // Only start burst if not in cooldown (5% chance per candle after threshold)
    if (
      !state.burstActive &&
      state.cooldownCount <= 0 &&
      state.candleCount >= state.nextBurst &&
      Math.random() < 0.05
    ) {
      state.burstActive = true;
      state.burstDirection = Math.random() < 0.5 ? 1 : -1;
      state.burstLen = Math.floor(Math.random() * 3) + 2; // 2-4 candles
      state.burstLeft = state.burstLen;
      state.burstTarget = (Math.random() * 1.5 + 0.5) * state.burstDirection; // 0.5-2.0 total move
      state.burstAccum = 0.0;
      state.candleCount = 0;
      state.nextBurst = Math.floor(Math.random() * 50) + 25;
      state.cooldownCount = Math.floor(Math.random() * 15) + 10; // 10-25 candle cooldown
    }

    // Decrease cooldown
    if (state.cooldownCount > 0) {
      state.cooldownCount--;
    }

    // If in burst, apply stronger directional movement
    if (state.burstActive && state.burstLeft > 0) {
      let move;
      if (state.burstLeft === 1) {
        // Last burst candle: complete the target
        move = (state.burstTarget - state.burstAccum) * 0.9;
      } else {
        // Gradual build-up with variance
        const targetPerCandle = state.burstTarget / state.burstLen;
        const variance = (Math.random() - 0.5) * 0.3;
        move = targetPerCandle * (1 + variance);
        // Prevent overshoot
        if (Math.abs(state.burstAccum + move) > Math.abs(state.burstTarget)) {
          move = state.burstTarget - state.burstAccum;
        }
      }
      state.burstAccum += move;
      state.burstLeft--;
      if (state.burstLeft === 0) {
        state.burstActive = false;
      }
      // Update momentum
      momentum.momentum = momentum.momentum * 0.6 + move * 0.4;
      momentum.lastMove = move;
      // Clamp move to ±2
      return round(Math.max(0.01, Math.min(base + move, base + 2, base - 2)));
    }

    // --- Normal random walk with realistic patterns ---
    // Base volatility varies dynamically (smaller for realism)
    const baseVolatility = 0.05 + Math.random() * 0.15; // 0.05-0.2 range

    // Pure random component (50% weight)
    const randomComponent = (Math.random() - 0.5) * 2 * baseVolatility;

    // Momentum component (20% weight) - tendency to continue
    momentum.momentum *= 0.8; // decay momentum
    const momentumComponent = momentum.momentum * 0.2;

    // Micro trend component (20% weight) - short-term bias
    const microTrendComponent = momentum.microTrend * baseVolatility * 0.2;

    // Mean reversion component (10% weight)
    const meanReversionComponent = momentum.meanReversion * 0.1;

    // Combine all components
    let totalMove =
      randomComponent +
      momentumComponent +
      microTrendComponent +
      meanReversionComponent;

    // Add some noise to prevent predictability
    totalMove += (Math.random() - 0.5) * 0.01;

    // Prevent consecutive large moves in same direction
    if (Math.abs(totalMove) > 0.12 && Math.abs(momentum.lastMove) > 0.1) {
      if (totalMove * momentum.lastMove > 0) {
        // Same direction
        totalMove *= 0.6; // Reduce magnitude
      }
    }

    // Anti-whipsaw logic: prevent large up followed immediately by large down
    if (Math.abs(totalMove) > 0.15 && Math.abs(momentum.lastMove) > 0.12) {
      if (totalMove * momentum.lastMove < 0) {
        // Opposite directions
        totalMove *= 0.4; // Severely reduce whipsaw
      }
    }

    // Dynamic max move based on recent volatility (never more than 2.0)
    const recentMoves = momentum.priceHistory.slice(-5);
    const avgRecentMove =
      recentMoves.length > 1
        ? recentMoves
            .slice(1)
            .reduce(
              (sum, price, i) => sum + Math.abs(price - recentMoves[i]),
              0
            ) /
          (recentMoves.length - 1)
        : 0.08;
    const dynamicMaxMove = Math.max(0.2, Math.min(2.0, avgRecentMove * 5)); // Up to 2.0 max move

    // Limit the move
    totalMove = Math.max(-dynamicMaxMove, Math.min(dynamicMaxMove, totalMove));
    // Clamp to ±2
    totalMove = Math.max(-2, Math.min(2, totalMove));

    // Update momentum and tracking
    momentum.lastMove = totalMove;
    momentum.momentum = momentum.momentum * 0.7 + totalMove * 0.3;

    const newPrice = round(Math.max(0.01, base + totalMove));
    momentum.lastPrice = newPrice;

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
