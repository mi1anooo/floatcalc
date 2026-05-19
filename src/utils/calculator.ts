/**
 * Safely evaluates a math expression string.
 *
 * Supported syntax:
 *   Numbers, +, -, ×, ÷, *, /, ^, %, √, (, )
 *
 * Implementation: validates characters on the original expression,
 * then transforms operators to JS equivalents before using Function().
 * This avoids eval() and keeps the surface area small.
 */
export function evaluate(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return '';

  // --- 1. Validate original expression characters ---
  // Only allow: digits, operators, parentheses, decimal, whitespace, and our special chars
  const validPattern = /^[0-9\+\-×÷\*\/\.\(\)%\^√\s]+$/;
  if (!validPattern.test(trimmed)) {
    throw new Error('Invalid expression');
  }

  // --- 2. Transform visual operators to JS equivalents ---
  let expr = trimmed
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    // √(expr) form
    .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
    // √number form (no parens)
    .replace(/√(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)')
    // percentage: number% → (number/100)
    .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

  // --- 3. Evaluate safely ---
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
    if (result === Infinity || result === -Infinity) {
      throw new Error('Cannot divide by zero');
    }
    throw new Error('Not a number');
  }

  // --- 4. Clean up floating-point precision artifacts ---
  // e.g. 0.1 + 0.2 → 0.30000000000000004 → 0.3
  const cleaned = parseFloat(result.toPrecision(12));
  return String(cleaned);
}

/** Format a result string for display (scientific notation for huge/tiny numbers) */
export function formatResult(value: string): string {
  if (!value || value === 'Error') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (Math.abs(num) >= 1e15 || (num !== 0 && Math.abs(num) < 1e-9)) {
    return num.toExponential(6);
  }
  return value;
}

/** Format a timestamp to a human-readable relative time */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
