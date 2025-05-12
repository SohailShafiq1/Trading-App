import Coin from "../models/Coin.js";
import Trend from "../models/Trend.js";

class CandleGenerator {
  constructor() {
    this.scenarioCounter = 0;
    this.fluctuationCounter = 0;
    this.oscillationPhase = 0;
    this.intervals = [30, 60, 120, 180, 300]; // 30s, 1m, 2m, 3m, 5m
    this.activeIntervals = new Map();
  }

  async initialize() {
    console.log("Initializing candle generation...");
    const coins = await Coin.find({});
    coins.forEach((coin) => this.startGeneration(coin));
    setInterval(() => this.checkTrend(), 5000);
  }

  async getCurrentTrend() {
    const trend = await Trend.findOne().sort({ updatedAt: -1 });
    return trend ? trend.mode : "Random";
  }

  async startGeneration(coin) {
    const identifier = coin.name || `${coin.firstName}_${coin.lastName}`;
    console.log(`Starting generation for ${identifier}`);

    // Clear any existing intervals for this coin
    if (this.activeIntervals.has(identifier)) {
      this.activeIntervals.get(identifier).forEach(clearInterval);
    }

    const intervals = new Set();

    this.intervals.forEach((interval) => {
      const intervalId = setInterval(
        () => this.generateCandle(coin, interval),
        interval * 1000
      );
      intervals.add(intervalId);
      // Initial generation
      this.generateCandle(coin, interval);
    });

    this.activeIntervals.set(identifier, intervals);
  }

  async generateCandle(coin, intervalSeconds) {
    try {
      const identifier = coin.name || `${coin.firstName}_${coin.lastName}`;
      const intervalLabel = this.getIntervalLabel(intervalSeconds);
      const now = new Date();
      const intervalStart = new Date(
        Math.floor(now.getTime() / (intervalSeconds * 1000)) *
          (intervalSeconds * 1000)
      );

      const currentTrend = await this.getCurrentTrend();

      // Simulate realistic price fluctuations during the interval
      const openPrice = coin.currentPrice;
      let highPrice = openPrice;
      let lowPrice = openPrice;
      let closePrice = openPrice;

      for (let i = 0; i < intervalSeconds; i++) {
        const simulatedPrice = this.generatePrice(closePrice, currentTrend);
        highPrice = Math.max(highPrice, simulatedPrice);
        lowPrice = Math.min(lowPrice, simulatedPrice);
        closePrice = simulatedPrice;
      }

      // Update the coin's price and candles
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
        },
        { new: true }
      );

      console.log(
        `Generated ${intervalLabel} candle for ${identifier} at ${new Date()} - Open: ${openPrice.toFixed(
          4
        )}, High: ${highPrice.toFixed(4)}, Low: ${lowPrice.toFixed(
          4
        )}, Close: ${closePrice.toFixed(4)}`
      );
    } catch (err) {
      console.error(`Error generating candle for ${coin._id}:`, err);
    }
  }

  generatePrice(currentPrice, trend) {
    if (currentPrice === undefined || currentPrice === null) {
      currentPrice = 100;
    }

    let priceChange = 0;
    const baseChange = (Math.random() - 0.5) * 2;

    switch (trend) {
      case "Up":
        priceChange = Math.abs(baseChange) + 0.5;
        break;
      case "Down":
        priceChange = -Math.abs(baseChange) - 0.5;
        break;
      case "Scenario1":
        this.scenarioCounter = (this.scenarioCounter + 1) % 4;
        priceChange = this.scenarioCounter === 3 ? -3 : 3;
        break;
      case "Scenario2":
        this.scenarioCounter = (this.scenarioCounter + 1) % 10;
        priceChange = this.scenarioCounter < 5 ? -3 : 3;
        break;
      case "Scenario3":
        priceChange = this.scenarioCounter++ % 2 === 0 ? 3 : -3;
        break;
      case "Scenario4":
        priceChange = 4 + Math.random() * 0.5;
        break;
      case "Scenario5":
        priceChange = -4 - Math.random() * 0.5;
        break;
      default: // Random
        priceChange = baseChange;
    }

    const newPrice = currentPrice + priceChange;
    return parseFloat(newPrice.toFixed(4));
  }

  getIntervalLabel(seconds) {
    const labels = {
      30: "30s",
      60: "1m",
      120: "2m",
      180: "3m",
      300: "5m",
    };
    return labels[seconds] || "30s";
  }

  async checkTrend() {
    try {
      const currentTrend = await this.getCurrentTrend();
      const coins = await Coin.find({ trend: { $ne: currentTrend } });

      if (coins.length > 0) {
        await Coin.updateMany({}, { trend: currentTrend });
        this.scenarioCounter = 0;
        this.fluctuationCounter = 0;
        console.log(`Trend updated to ${currentTrend}`);
      }
    } catch (err) {
      console.error("Error checking trend:", err);
    }
  }
}

const candleGenerator = new CandleGenerator();
export default candleGenerator;
