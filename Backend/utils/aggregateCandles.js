// utils/aggregateCandles.js
export const groupCandles = (candles, interval) => {
  const intervalToSec = {
    "30s": 30,
    "1m": 60,
    "2m": 120,
    "3m": 180,
    "5m": 300,
  };

  const intervalSec = intervalToSec[interval];
  if (!intervalSec) return candles;

  const grouped = [];
  const sorted = [...candles]
    .filter((c) => c?.time && c?.open != null)
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  for (const c of sorted) {
    const timeSec = Math.floor(new Date(c.time).getTime() / 1000);
    const bucket = Math.floor(timeSec / intervalSec) * intervalSec;

    const last = grouped[grouped.length - 1];
    if (last && last.time === bucket) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
    } else {
      grouped.push({
        time: bucket,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
    }
  }

  return grouped;
};
