import Coin from "../models/Coin.js";
import Trend from "../models/Trend.js";
import webSocketService from "./websocket.js";

class CandleGenerator {
  constructor() {
    this.intervals = {
      "30s": 30,
      "1m": 60,
      "2m": 120,
      "3m": 180,
      "5m": 300,
    };
    this.activeIntervals = new Map();
    this.priceHistory = new Map();
    this.scenarioState = new Map();
    this.volatilityState = new Map();
    this.basePrice = new Map();
  }

  async initialize() {
    console.log("Initializing candle generation...");
    const coins = await Coin.find({});
    coins.forEach((coin) => this.setupCoinGeneration(coin));
    setInterval(() => this.checkTrend(), 5000);
  }

  async setupCoinGeneration(coin) {
    const identifier = coin.name || `${coin.firstName}_${coin.lastName}`;
    console.log(`Setting up generation for ${identifier}`);

    if (this.activeIntervals.has(identifier)) {
      clearInterval(this.activeIntervals.get(identifier));
    }

    this.basePrice.set(identifier, coin.currentPrice || 100);
    this.priceHistory.set(identifier, this.basePrice.get(identifier));

    this.scenarioState.set(identifier, {
      counter: 0,
      phase: 0,
      direction: 1,
      step: 0,
      lastMajorMove: Date.now(),
    });

    this.volatilityState.set(identifier, {
      base: 0.3 + Math.random() * 0.2,
      lastChange: Date.now(),
    });

    const intervalSeconds = this.intervals[coin.selectedInterval] || 30;
    await this.generateCandle(coin, intervalSeconds);

    const intervalId = setInterval(
      () => this.generateCandle(coin, intervalSeconds),
      intervalSeconds * 1000
    );

    this.activeIntervals.set(identifier, intervalId);
  }

  async getCurrentTrend() {
    const trend = await Trend.findOne().sort({ updatedAt: -1 });
    return trend?.mode || "Random";
  }

  async generateCandle(coin, intervalSeconds) {
    try {
      const identifier = coin.name || `${coin.firstName}_${coin.lastName}`;
      const intervalLabel =
        Object.keys(this.intervals).find(
          (key) => this.intervals[key] === intervalSeconds
        ) || "30s";

      const now = new Date();
      const intervalStart = new Date(
        Math.floor(now.getTime() / (intervalSeconds * 1000)) *
          (intervalSeconds * 1000)
      );

      // Get previous candle's close or use base price
      const prevCandle = coin.candles[coin.candles.length - 1];
      const openPrice = prevCandle
        ? prevCandle.close
        : this.basePrice.get(identifier);

      const currentTrend = await this.getCurrentTrend();
      const state = this.scenarioState.get(identifier);
      const volatility = this.volatilityState.get(identifier);

      // Generate price movement
      const priceChange = this.generatePriceChange(
        currentTrend,
        state,
        volatility.base
      );

      const closePrice = openPrice * (1 + priceChange);
      const highPrice =
        Math.max(openPrice, closePrice) * (1 + Math.random() * 0.005);
      const lowPrice =
        Math.min(openPrice, closePrice) * (1 - Math.random() * 0.005);

      // Update base price occasionally
      if (Math.random() < 0.1) {
        this.basePrice.set(identifier, closePrice);
      }

      const newCandle = {
        time: intervalStart,
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
        interval: intervalLabel,
      };

      // Update database
      await Coin.findOneAndUpdate(
        { _id: coin._id },
        {
          $set: { currentPrice: closePrice, lastUpdated: now },
          $push: { candles: { $each: [newCandle], $slice: -500 } },
        }
      );

      this.priceHistory.set(identifier, closePrice);
      this.broadcastUpdates(identifier, closePrice, newCandle);
    } catch (err) {
      console.error(`Error generating candle:`, err);
    }
  }

  generatePriceChange(trend, state, baseVolatility) {
    let trendFactor = 0;
    let scenarioEffect = 0;

    // Apply trend effects
    switch (trend) {
      case "Up":
        trendFactor = 0.1 + Math.random() * 0.1;
        break;
      case "Down":
        trendFactor = -0.1 - Math.random() * 0.1;
        break;
      case "Scenario1": // Gradual rise with small corrections
        scenarioEffect = Math.sin(state.counter / 10) * 0.5;
        state.counter++;
        break;
      case "Scenario2": // Sawtooth pattern
        scenarioEffect = state.counter % 10 < 7 ? 0.3 : -0.7;
        state.counter++;
        break;
      case "Scenario3": // Sine wave pattern
        scenarioEffect = Math.sin(state.phase) * 0.8;
        state.phase += 0.2;
        break;
      case "Scenario4": // Spike and gradual decline
        scenarioEffect = 2 + Math.random() * 0.5;
        if (state.step % 3 === 0) scenarioEffect *= -0.7;
        break;
      case "Scenario5": // Gradual decline with spikes
        scenarioEffect = -2 - Math.random() * 0.5;
        if (state.step % 4 === 0) scenarioEffect *= -0.5;
        break;
      default: // Random
        trendFactor = (Math.random() - 0.5) * 0.1;
    }

    // Random noise with normal distribution
    const randNormal = () => {
      let u = 0,
        v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const noise = randNormal() * baseVolatility;

    // Calculate final price change
    return (trendFactor + scenarioEffect + noise) / 100;
  }

  broadcastUpdates(identifier, price, candle) {
    try {
      webSocketService.broadcastTo("price", identifier, price.toString());
      if (candle) {
        webSocketService.broadcastTo(
          "candles",
          identifier,
          JSON.stringify([candle]),
          candle.interval
        );
      }
    } catch (err) {
      console.error("Error broadcasting updates:", err);
    }
  }

  async checkTrend() {
    try {
      const currentTrend = await this.getCurrentTrend();
      const coins = await Coin.find({ trend: { $ne: currentTrend } });

      if (coins.length > 0) {
        await Coin.updateMany({}, { trend: currentTrend });
        // Reset scenario states
        this.scenarioState.forEach((state) => {
          state.counter = 0;
          state.phase = 0;
          state.step = 0;
          state.lastMajorMove = Date.now();
        });
        console.log(`Trend updated to ${currentTrend}`);
      }
    } catch (err) {
      console.error("Error checking trend:", err);
    }
  }

  async updateCoinInterval(coinName, newInterval) {
    const identifier = coinName;
    if (this.activeIntervals.has(identifier)) {
      clearInterval(this.activeIntervals.get(identifier));
    }

    const coin = await Coin.findOne({ name: coinName });
    if (!coin) return;

    const intervalSeconds = this.intervals[newInterval] || 30;
    await this.generateCandle(coin, intervalSeconds);

    const intervalId = setInterval(
      () => this.generateCandle(coin, intervalSeconds),
      intervalSeconds * 1000
    );

    this.activeIntervals.set(identifier, intervalId);
  }
}

const candleGenerator = new CandleGenerator();
export default candleGenerator;
