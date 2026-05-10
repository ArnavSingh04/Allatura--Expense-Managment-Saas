import type { Money } from '@/lib/money';

export type CostLedgerRow = {
  departmentId: string;
  name: string;
  budget: Money;
  committed: Money;
  invoiced: Money;
  paid: Money;
};

export type NormalizedCostLedger = {
  currency: string;
  perDepartment: CostLedgerRow[];
};

function toMoney(value: unknown, currency: string): Money {
  if (
    value &&
    typeof value === 'object' &&
    'amount' in value &&
    typeof (value as Money).amount === 'number'
  ) {
    const m = value as Money;
    return {
      amount: m.amount,
      currency: m.currency ?? currency,
    };
  }
  if (typeof value === 'number') {
    return { amount: value, currency };
  }
  return { amount: 0, currency };
}

/**
 * BE returns `{ departments: [...], currency }` with numeric amounts;
 * older FE types expected `perDepartment` with `Money` fields.
 */
export function normalizeCostLedger(data: unknown): NormalizedCostLedger | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const currency =
    typeof o.currency === 'string' && o.currency ? o.currency : 'AUD';

  const rawRows: unknown[] = Array.isArray(o.perDepartment)
    ? o.perDepartment
    : Array.isArray(o.departments)
      ? o.departments
      : [];

  const perDepartment: CostLedgerRow[] = rawRows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      departmentId: String(row.departmentId ?? ''),
      name: String(row.name ?? ''),
      budget: toMoney(row.budget, currency),
      committed: toMoney(row.committed, currency),
      invoiced: toMoney(row.invoiced, currency),
      paid: toMoney(row.paid, currency),
    };
  });

  return { currency, perDepartment };
}
