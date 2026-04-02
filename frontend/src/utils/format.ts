export function getTrendIcon(predicted: number, avg: number | undefined, thresholdPercent: number = 0.05): string {
  if (avg === undefined || avg === 0) return '→';
  const diff = predicted - avg;
  const threshold = avg * thresholdPercent;
  if (diff > threshold) return '↑';
  if (diff < -threshold) return '↓';
  return '→';
}

export function getTrendClass(predicted: number, avg: number | undefined, thresholdPercent: number = 0.05): string {
  if (avg === undefined || avg === 0) return 'trend-neutral';
  const diff = predicted - avg;
  const threshold = avg * thresholdPercent;
  if (diff > threshold) return 'trend-up';
  if (diff < -threshold) return 'trend-down';
  return 'trend-neutral';
}

export function getDiffPercent(predicted: number, avg: number | undefined): string {
  if (avg === undefined || avg === 0) return '—';
  const diff = ((predicted - avg) / avg) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}
