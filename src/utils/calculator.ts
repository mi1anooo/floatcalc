/**
 * FloatCalc – Safe expression evaluator
 * Supports: +, -, ×, ÷, ^, %, √, (, ), Math functions, bitwise ops
 */
export function evaluate(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return '';

  // Allow all valid characters including Math. functions and bitwise
  const validPattern = /^[0-9\+\-×÷\*\/\.\(\)%\^√\s\&\|\~\<\>a-zA-Z\._]+$/;
  if (!validPattern.test(trimmed)) throw new Error('Invalid expression');

  let expr = trimmed
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
    .replace(/√(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)')
    .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
    // Programmer: -1×( shorthand
    .replace(/-1\*\(/g, '-(');

  let result: number;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${expr})`);
    result = fn() as number;
  } catch {
    throw new Error('Invalid expression');
  }

  if (typeof result !== 'number') throw new Error('Invalid result');
  if (!isFinite(result)) {
    if (!isNaN(result)) throw new Error('Cannot divide by zero');
    throw new Error('Not a number');
  }

  const cleaned = parseFloat(result.toPrecision(12));
  return String(cleaned);
}

/** Format a result string for display */
export function formatResult(value: string): string {
  if (!value || value === 'Error') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (Math.abs(num) >= 1e15 || (num !== 0 && Math.abs(num) < 1e-9)) {
    return num.toExponential(6);
  }
  return value;
}

/** Return hex and binary representations for programmer mode */
export function getProgrammerInfo(value: string): { hex: string; bin: string; oct: string } | null {
  const num = parseInt(value, 10);
  if (isNaN(num)) return null;
  return {
    hex: '0x' + Math.abs(num).toString(16).toUpperCase(),
    bin: '0b' + Math.abs(num).toString(2),
    oct: '0o' + Math.abs(num).toString(8),
  };
}

/** Format a timestamp to a human-readable relative time */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (seconds < 60)  return 'just now';
  if (minutes < 60)  return `${minutes}m ago`;
  if (hours < 24)    return `${hours}h ago`;
  if (days < 7)      return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
