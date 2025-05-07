import ChartModel from "../models/ChartModel.js";
import { generateCandle } from "../utils/candleUtils.js";

const CANDLE_UPDATE_INTERVAL = 1000; // Check every second
const MAX_CANDLES_PER_COIN = 200;

class CandleGenerator {
  constructor() {
    this.activeCoins = new Map(); // coinName -> { lastCandle }
    this.subscribers = new Set();
  }

  async initialize() {
    const coins = await ChartModel.find({});
    coins.forEach((coin) => {
      if (coin.candles.length > 0) {
        this.activeCoins.set(coin.coinName, {
          lastCandle: coin.candles[coin.candles.length - 1],
          duration: coin.currentDuration,
        });
      }
    });
    this.startGeneration();
  }

  startGeneration() {
    setInterval(() => this.generateCandles(), CANDLE_UPDATE_INTERVAL);
  }

  async generateCandles() {
    const now = Date.now();
    const updates = [];

    for (const [coinName, data] of this.activeCoins) {
      try {
        if (now - data.lastCandle.x >= data.duration) {
          const newCandle = {
            x: data.lastCandle.x + data.duration,
            y: generateCandle(data.lastCandle.y[3], data.trend),
            trend: data.trend,
            duration: data.duration,
          };

          // Update in memory
          this.activeCoins.set(coinName, {
            ...data,
            lastCandle: newCandle,
          });

          // Prepare DB update
          updates.push({
            updateOne: {
              filter: { coinName },
              update: {
                $push: {
                  candles: {
                    $each: [newCandle],
                    $slice: -MAX_CANDLES_PER_COIN,
                  },
                },
                currentTrend: data.trend,
                lastUpdated: now,
              },
            },
          });

          // Notify subscribers
          this.notifySubscribers(coinName, newCandle);
        }
      } catch (err) {
        console.error(`Error generating candle for ${coinName}:`, err);
      }
    }

    if (updates.length > 0) {
      await ChartModel.bulkWrite(updates);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(coinName, candle) {
    this.subscribers.forEach((cb) => cb(coinName, candle));
  }

  async addCoin(coinName) {
    const initialCandle = {
      x: Date.now(),
      y: [100, 101, 99, 100],
      trend: "Normal",
      duration: 30000,
    };

    this.activeCoins.set(coinName, {
      lastCandle: initialCandle,
      duration: 30000,
      trend: "Normal",
    });

    await ChartModel.create({
      coinName,
      candles: [initialCandle],
      currentTrend: "Normal",
      currentDuration: 30000,
    });
  }
}

export const candleGenerator = new CandleGenerator();
