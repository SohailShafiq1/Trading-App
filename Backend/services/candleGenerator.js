import Coin from "../models/Coin.js";
import Trend from "../models/Trend.js";

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
  }

  async initialize() {
    console.log("Initializing candle generation...");
    const coins = await Coin.find({});
    coins.forEach((coin) => {
      this.setupCoinGeneration(coin);
    });
    setInterval(() => this.checkTrend(), 5000);
  }

  async setupCoinGeneration(coin) {
    const identifier = coin.name || `${coin.firstName}_${coin.lastName}`;
    console.log(`Setting up generation for ${identifier}`);

    // Clear existing interval if it exists
    if (this.activeIntervals.has(identifier)) {
      clearInterval(this.activeIntervals.get(identifier));
    }

    this.priceHistory.set(identifier, coin.currentPrice);
    this.scenarioState.set(identifier, {
      counter: 0,
      phase: 0,
      direction: 1,
      step: 0,
    });

    // Start generation with the coin's selected interval
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
    return trend ? trend.mode : "Random";
  }

  async startGeneration(coin) {
    const identifier = coin.name || `${coin.firstName}_${coin.lastName}`;
    const interval = coin.selectedInterval || "30s";
    const intervalSeconds = this.intervals[interval];

    // Generate initial candle
    await this.generateCandle(coin, intervalSeconds);

    // Set up interval for regular generation
    const intervalId = setInterval(
      () => this.generateCandle(coin, intervalSeconds),
      intervalSeconds * 1000
    );

    this.activeIntervals.set(identifier, intervalId);
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

      let lastPrice = this.priceHistory.get(identifier) || coin.currentPrice;
      const currentTrend = await this.getCurrentTrend();
      const state = this.scenarioState.get(identifier);

      // Generate price path with scenario effects
      const steps = 10;
      const pricePath = [lastPrice];

      for (let i = 0; i < steps; i++) {
        const newPrice = this.generatePrice(pricePath[i], currentTrend, state);
        pricePath.push(newPrice);
      }

      const openPrice = pricePath[0];
      const highPrice = Math.max(...pricePath);
      const lowPrice = Math.min(...pricePath);
      const closePrice = pricePath[pricePath.length - 1];

      // Update state
      this.priceHistory.set(identifier, closePrice);
      state.step++;
      if (state.step >= steps) state.step = 0;

      await Coin.findOneAndUpdate(
        { _id: coin._id },
        {
          $set: { currentPrice: closePrice, lastUpdated: now },
          $push: {
            candles: {
              time: intervalStart,
              open: openPrice,
              high: highPrice,
              low: lowPrice,
              close: closePrice,
              interval: intervalLabel,
            },
          },
        }
      );

      console.log(`Generated ${intervalLabel} candle for ${identifier}`);
    } catch (err) {
      console.error(`Error generating candle for ${coin._id}:`, err);
    }
  }

  generatePrice(currentPrice, trend, state) {
    if (currentPrice === undefined || currentPrice === null) {
      currentPrice = 100;
    }

    const baseVolatility = 0.5;
    let volatility = baseVolatility;
    let trendFactor = 0;
    let scenarioEffect = 0;

    switch (trend) {
      case "Up":
        volatility = baseVolatility * 0.8;
        trendFactor = 0.3;
        break;
      case "Down":
        volatility = baseVolatility * 0.8;
        trendFactor = -0.3;
        break;
      default:
        volatility = baseVolatility;
    }

    switch (trend) {
      case "Scenario1":
        state.counter = (state.counter + 1) % 4;
        scenarioEffect = state.counter === 3 ? 5 : -1.5;
        break;
      case "Scenario2":
        state.counter = (state.counter + 1) % 10;
        scenarioEffect = state.counter < 5 ? 4 : -4;
        break;
      case "Scenario3":
        state.phase = (state.phase + 0.2) % (2 * Math.PI);
        scenarioEffect = Math.sin(state.phase) * 3;
        break;
      case "Scenario4":
        scenarioEffect = 2 + Math.random() * 0.5;
        if (state.step % 3 === 0) scenarioEffect *= -0.7;
        break;
      case "Scenario5":
        scenarioEffect = -2 - Math.random() * 0.5;
        if (state.step % 4 === 0) scenarioEffect *= -0.5;
        break;
      default:
        scenarioEffect = (Math.random() - 0.5) * 2;
    }

    const randomFactor = (Math.random() - 0.5) * 2;
    const priceChange =
      randomFactor * volatility + trendFactor + scenarioEffect;

    const newPrice = Math.max(0.01, currentPrice * (1 + priceChange / 100));
    return parseFloat(newPrice.toFixed(4));
  }

  async checkTrend() {
    try {
      const currentTrend = await this.getCurrentTrend();
      const coins = await Coin.find({ trend: { $ne: currentTrend } });

      if (coins.length > 0) {
        await Coin.updateMany({}, { trend: currentTrend });
        this.scenarioState.forEach((state) => {
          state.counter = 0;
          state.phase = 0;
          state.step = 0;
        });
        console.log(`Trend updated to ${currentTrend}`);
      }
    } catch (err) {
      console.error("Error checking trend:", err);
    }
  }
}

const candleGenerator = new CandleGenerator();
export default candleGenerator;
