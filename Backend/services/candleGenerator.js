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
        volatility: 0.15,
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
      momentum.microTrend = (Math.random() - 0.5) * 2; // -1 to 1
      momentum.microTrendCount = Math.floor(Math.random() * 8) + 2; // 2-9 candles
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
    
    // Only start burst if not in cooldown (10% chance per candle after threshold)
    if (!state.burstActive && state.cooldownCount <= 0 && 
        state.candleCount >= state.nextBurst && Math.random() < 0.1) {
      state.burstActive = true;
      state.burstDirection = Math.random() < 0.5 ? 1 : -1;
      state.burstLen = Math.floor(Math.random() * 6) + 3; // 3-8 candles
      state.burstLeft = state.burstLen;
      state.burstTarget = (Math.random() * 15 + 5) * state.burstDirection; // 5-20 total move (massively increased for up to 2 price change)
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
        const variance = (Math.random() - 0.5) * 0.6;
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
      return round(Math.max(0.01, base + move));
    }
    
    // --- Normal random walk with realistic patterns ---
    // Base volatility varies dynamically (massively increased for bigger candles)
    const baseVolatility = 0.25 + Math.random() * 0.75; // 0.25-1.00 range (massively increased for up to 2 price change)
    
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
    let totalMove = randomComponent + momentumComponent + microTrendComponent + meanReversionComponent;
    
    // Add some noise to prevent predictability
    totalMove += (Math.random() - 0.5) * 0.02;
    
    // Prevent consecutive large moves in same direction
    if (Math.abs(totalMove) > 0.15 && Math.abs(momentum.lastMove) > 0.1) {
      if (totalMove * momentum.lastMove > 0) { // Same direction
        totalMove *= 0.6; // Reduce magnitude
      }
    }
    
    // Anti-whipsaw logic: prevent large up followed immediately by large down
    if (Math.abs(totalMove) > 0.2 && Math.abs(momentum.lastMove) > 0.15) {
      if (totalMove * momentum.lastMove < 0) { // Opposite directions
        totalMove *= 0.4; // Severely reduce whipsaw
      }
    }
    
    // Dynamic max move based on recent volatility (massively increased for bigger candles up to 2)
    const recentMoves = momentum.priceHistory.slice(-5);
    const avgRecentMove = recentMoves.length > 1 ? 
      recentMoves.slice(1).reduce((sum, price, i) => sum + Math.abs(price - recentMoves[i]), 0) / (recentMoves.length - 1) : 0.15;
    const dynamicMaxMove = Math.max(0.8, Math.min(2.0, avgRecentMove * 5)); // Up to 2.0 max move (massively increased)
    
    // Limit the move
    totalMove = Math.max(-dynamicMaxMove, Math.min(dynamicMaxMove, totalMove));
    
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

      const open = round(lastCandle?.close ?? coin.currentPrice ?? 1.0);
      const lastTick = lastPrices[coin.name] ?? open;
      
      // Validate that open is a valid number
      if (isNaN(open) || open <= 0) {
        console.warn(`Invalid open price for ${coin.name}: ${open}, skipping...`);
        continue;
      }
      
      const close = generatePrice(open, coin.trend, lastTick, coin.name);
      
      // Validate that close is a valid number
      if (isNaN(close) || close <= 0) {
        console.warn(`Invalid close price for ${coin.name}: ${close}, skipping...`);
        continue;
      }

      // --- Enhanced realistic wick logic ---
      let prev1 = coin.candles.filter((c) => c.interval === "30s").at(-1);
      let prev2 = coin.candles.filter((c) => c.interval === "30s").at(-2);
      let consecutiveUp = false,
        consecutiveDown = false;
      if (prev1 && prev2) {
        consecutiveUp = prev1.close > prev1.open && prev2.close > prev2.open;
        consecutiveDown = prev1.close < prev1.open && prev2.close < prev2.open;
      }
      
      // Calculate body size for proportional wick sizing
      const bodySize = Math.abs(close - open);
      const isSmallBody = bodySize < 0.03;
      const isLargeBody = bodySize > 0.15;
      
      let baseWickSize, wickVariance;
      
      if (coin.trend === "Random") {
        // Random trend: Much smaller wicks to emphasize candle bodies
        if (isSmallBody) {
          // Small body candles (doji-like) with very small wicks
          baseWickSize = 0.015 + Math.random() * 0.025; // 0.015-0.04 (significantly reduced)
          wickVariance = 0.01 + Math.random() * 0.02; // 0.01-0.03
        } else if (isLargeBody) {
          // Large body candles with tiny proportional wicks
          baseWickSize = bodySize * 0.05 + Math.random() * 0.015; // 5% of body + variance (significantly reduced)
          wickVariance = bodySize * 0.04 + Math.random() * 0.01;
        } else {
          // Normal body candles with very small wick size
          baseWickSize = bodySize * 0.08 + Math.random() * 0.02; // 8% of body + variance (significantly reduced)
          wickVariance = bodySize * 0.06 + Math.random() * 0.015;
        }
        
        // 10% chance for rejection wicks (reduced frequency and size)
        if (Math.random() < 0.1) {
          baseWickSize *= 1.2 + Math.random() * 0.5; // 1.2x to 1.7x larger (significantly reduced)
          wickVariance *= 1.1 + Math.random() * 0.4;
        }
        
        // 30% chance for very tiny wicks (tight price action)
        if (Math.random() < 0.3) {
          baseWickSize *= 0.3 + Math.random() * 0.2; // 30%-50% of normal
          wickVariance *= 0.4 + Math.random() * 0.2;
        }
      } else {
        // Non-random trends: Very conservative wick generation
        baseWickSize = 0.008 + Math.random() * 0.015; // Significantly reduced base size
        wickVariance = Math.random() * 0.01; // Significantly reduced variance
        
        if (consecutiveUp || consecutiveDown) {
          baseWickSize = 0.015 + Math.random() * 0.02; // Much smaller
          wickVariance = Math.random() * 0.02 + 0.01;
        }
        
        // 5% chance for larger wicks in trending scenarios (significantly reduced)
        if (Math.random() < 0.05) {
          baseWickSize *= 1.3 + Math.random() * 0.4; // 1.3x to 1.7x larger (significantly reduced)
          wickVariance *= 1.2 + Math.random() * 0.3;
        }
      }
      
      // Generate asymmetric wicks based on candle characteristics
      let upperWick = baseWickSize + wickVariance * Math.random();
      let lowerWick = baseWickSize + wickVariance * Math.random();
      
      // Realistic wick distribution based on candle direction
      const candle_direction = close > open ? 1 : (close < open ? -1 : 0);
      
      if (candle_direction === 1) {
        // Bullish candle: typically much smaller upper wick, moderate lower wick
        upperWick *= 0.3 + Math.random() * 0.3; // 30%-60% of base (reduced)
        lowerWick *= 0.5 + Math.random() * 0.4; // 50%-90% of base (reduced)
      } else if (candle_direction === -1) {
        // Bearish candle: typically moderate upper wick, much smaller lower wick
        upperWick *= 0.5 + Math.random() * 0.4; // 50%-90% of base (reduced)
        lowerWick *= 0.3 + Math.random() * 0.3; // 30%-60% of base (reduced)
      } else {
        // Doji candle: can have moderate wicks in either direction
        const wickMultiplier = 0.8 + Math.random() * 0.4; // 80%-120% (reduced)
        upperWick *= wickMultiplier;
        lowerWick *= wickMultiplier;
      }
      
      // Ensure minimum wick presence (significantly reduced minimum)
      const minWickSize = 0.003; // Significantly reduced minimum wick size
      upperWick = Math.max(minWickSize, upperWick);
      lowerWick = Math.max(minWickSize, lowerWick);
      
      // Calculate high and low with validation
      let high = Math.max(open, close) + upperWick;
      let low = Math.max(0.01, Math.min(open, close) - lowerWick);
      
      // Ensure realistic price bounds (tighter bounds for bigger bodies)
      const maxPrice = Math.max(open, close) * 1.2; // Max 20% above body (reduced)
      const minPrice = Math.min(open, close) * 0.85; // Min 15% below body (reduced)
      
      high = Math.min(high, maxPrice);
      low = Math.max(low, minPrice);
      low = Math.max(0.01, low); // Absolute minimum price
      
      // Final validation
      if (isNaN(high) || isNaN(low) || high <= 0 || low <= 0 || high < low) {
        console.warn(`Invalid wick prices for ${coin.name}: high=${high}, low=${low}, skipping...`);
        continue;
      }
      
      high = round(high);
      low = round(low);

      const candle = {
        time: roundedTime.toISOString(),
        open: round(open),
        close: round(close),
        high: round(high),
        low: round(low),
        interval: "30s",
      };

      // Final validation before saving
      if (isNaN(candle.open) || isNaN(candle.close) || isNaN(candle.high) || isNaN(candle.low) ||
          candle.open <= 0 || candle.close <= 0 || candle.high <= 0 || candle.low <= 0) {
        console.warn(`Invalid candle data for ${coin.name}:`, candle, 'skipping...');
        continue;
      }

      coin.candles.push(candle);
      coin.currentPrice = round(close);
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
      const counter = scenarioCounters[coin.name] ?? 0;

      // Initialize momentum for tick smoothing with oscillation support
      if (!momentumState[coin.name]) {
        momentumState[coin.name] = {
          momentum: 0,
          lastMove: 0,
          tickCount: 0,
          targetClose: open,
          progressToTarget: 0,
          microTrend: 0,
          microTrendCount: 0,
          lastPrice: open,
          oscillationPhase: 0, // 0=up, 1=down, 2=up, 3=down
          oscillationCount: 0,
          oscillationTarget: 0,
          candleOpenPrice: open,
        };
      }

      const momentum = momentumState[coin.name];
      momentum.tickCount++;

      // Reset oscillation when new candle starts
      if (momentum.candleOpenPrice !== open) {
        momentum.candleOpenPrice = open;
        momentum.oscillationPhase = 0;
        momentum.oscillationCount = 0;
        momentum.oscillationTarget = 0;
      }

      // Calculate time progress within the 30-second candle
      const timePct = ((now - bucket * 1000) / (intervalSec * 1000));
      
      // Generate realistic tick movement based on trend
      let tickMove = 0;
      
      if (coin.trend === "Random") {
        // Add oscillation pattern: up-down-up-down within the candle
        const oscillationIntensity = 0.15 + Math.random() * 0.25; // 15-40% oscillation range (massively increased for up to 2 price change)
        
        // Create 4 phases of oscillation within the 30-second candle
        const phaseProgress = (timePct * 4) % 1; // 0-1 within each phase
        const currentPhase = Math.floor(timePct * 4);
        
        // Generate oscillation target for each phase
        if (currentPhase !== momentum.oscillationPhase) {
          momentum.oscillationPhase = currentPhase;
          
          switch (currentPhase) {
            case 0: // First up movement
              momentum.oscillationTarget = price + oscillationIntensity * (0.5 + Math.random() * 0.5);
              break;
            case 1: // Down movement
              momentum.oscillationTarget = price - oscillationIntensity * (0.5 + Math.random() * 0.5);
              break;
            case 2: // Second up movement
              momentum.oscillationTarget = price + oscillationIntensity * (0.3 + Math.random() * 0.4);
              break;
            case 3: // Final adjustment toward close
              // Move toward the intended candle close price
              const intendedClose = generatePrice(open, coin.trend, price, coin.name);
              momentum.oscillationTarget = intendedClose;
              break;
          }
        }
        
        // Move toward oscillation target
        const remaining = momentum.oscillationTarget - price;
        const stepSize = remaining * (0.15 + Math.random() * 0.15); // 15-30% of remaining
        
        // Add some randomness to prevent predictable patterns
        const randomNoise = (Math.random() - 0.5) * 0.015; // Increased random noise
        
        // Combine oscillation movement with noise
        tickMove = stepSize + randomNoise;
        
        // Limit tick size for bigger movements
        const maxTickMove = 0.08; // 8% max per tick (massively increased for up to 2 price change)
        tickMove = Math.max(-maxTickMove, Math.min(maxTickMove, tickMove));
        
      } else {
        // For other trends, add bigger oscillation with directional bias
        let direction = 1;
        const baseTickVolatility = 0.03 + Math.random() * 0.07; // 3.0%-10.0% (massively increased for bigger candles)
        
        switch (coin.trend) {
          case "Up":
            direction = 0.7 + Math.random() * 0.6; // 70%-130% upward bias
            break;
          case "Down":
            direction = -0.7 - Math.random() * 0.6; // 70%-130% downward bias
            break;
          case "Scenario1":
            direction = (counter % 4 < 3 ? 1 : -1) * (0.6 + Math.random() * 0.4);
            break;
          case "Scenario2":
            direction = (counter % 10 < 5 ? -1 : 1) * (0.6 + Math.random() * 0.4);
            break;
          case "Scenario3":
            direction = (counter % 2 === 0 ? 1 : -1) * (0.6 + Math.random() * 0.4);
            break;
          case "Scenario4":
            direction = 0.6 + Math.random() * 0.4;
            break;
          case "Scenario5":
            direction = -0.6 - Math.random() * 0.4;
            break;
          default:
            direction = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
            break;
        }
        
        // Add oscillation pattern to trending movements
        const oscillationFactor = Math.sin(timePct * Math.PI * 6) * 0.3; // 3 full oscillations per candle
        
        // Apply direction with oscillation and some counter-trend moves for realism
        const counterTrendChance = 0.2; // 20% chance for counter-trend tick
        if (Math.random() < counterTrendChance) {
          direction *= -0.4; // Counter-trend move
        }
        
        tickMove = direction * baseTickVolatility * (1 + oscillationFactor);
      }

      // Apply momentum smoothing to prevent jerky movements
      const smoothingFactor = 0.4;
      const smoothedMove = momentum.lastMove * smoothingFactor + tickMove * (1 - smoothingFactor);
      momentum.lastMove = smoothedMove;
      
      // Calculate new price with validation
      const newPrice = price + smoothedMove;
      if (isNaN(newPrice) || newPrice <= 0) {
        console.warn(`Invalid tick price for ${coin.name}: ${newPrice}, using previous price`);
        price = lastPrices[coin.name] ?? open ?? 1.0;
      } else {
        price = round(Math.max(0.01, newPrice));
      }
      
      lastPrices[coin.name] = price;

      // Update candle data
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      last.close = price;

      if (io) {
        io.emit(`price:${coin.name}`, {
          time: new Date(),
          price,
          trend: coin.trend,
          counter: counter,
          candleData: {
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            time: last.time,
          },
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
      console.log(`⏱️  Waiting ${timeUntilNext}ms until next 00 seconds to start candle generation...`);
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
