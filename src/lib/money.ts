export type Money = {
  amount: number;
  currency: string;
};

export const ZERO: Money = { amount: 0, currency: 'AUD' };

/** API stores monetary amount in minor units (cents). */
export function toMinor(major: number | string): number {
  const n = typeof major === 'number' ? major : Number(major);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function toMajor(minor: number | undefined | null): number {
  if (!minor) return 0;
  return minor / 100;
}

const formatters = new Map<string, Intl.NumberFormat>();
function fmtFor(currency: string, minimumFractionDigits = 0): Intl.NumberFormat {
  const key = `${currency}-${minimumFractionDigits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'AUD',
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    });
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(
  m: Money | undefined | null,
  opts: { decimals?: number; fallback?: string } = {},
): string {
  if (!m) return opts.fallback ?? '—';
  const decimals = opts.decimals ?? 0;
  return fmtFor(m.currency || 'AUD', decimals).format(toMajor(m.amount));
}

/** Compact currency, e.g. $1.2M, $145K. */
export function formatMoneyCompact(m: Money | undefined | null): string {
  if (!m) return '—';
  const major = toMajor(m.amount);
  const sign = major < 0 ? '-' : '';
  const abs = Math.abs(major);
  const cur = m.currency || 'AUD';
  const symbol = (() => {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: cur,
      }).formatToParts(0);
      return parts.find((p) => p.type === 'currency')?.value ?? '$';
    } catch {
      return '$';
    }
  })();
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

export function addMoney(a: Money, b: Money): Money {
  if (a.amount === 0) return { ...b };
  if (b.amount === 0) return { ...a };
  return {
    amount: a.amount + b.amount,
    currency: a.currency || b.currency || 'AUD',
  };
}

export function percent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
