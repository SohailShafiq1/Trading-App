export const generateCandle = (lastClose, trend = "Normal") => {
  let close = lastClose;

  switch (trend) {
    case "Scenario1":
      close = lastClose + (Math.random() > 0.5 ? 2 : -2);
      break;
    case "Scenario2":
      close = lastClose + (Math.random() - 0.7) * 4;
      break;
    case "Up":
      close = lastClose + Math.abs(Math.random() * 3);
      break;
    case "Down":
      close = lastClose - Math.abs(Math.random() * 3);
      break;
    default: // Normal
      close = lastClose + (Math.random() - 0.5) * 2;
  }

  const open = lastClose;
  const high = Math.max(open, close) + Math.random();
  const low = Math.min(open, close) - Math.random();

  return [open, high, low, close];
};
