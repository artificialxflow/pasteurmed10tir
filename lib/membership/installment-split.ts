/** Split total across N installments; remainder on the last. */
export function splitInstallmentAmounts(total: number, count: number): number[] {
  const n = Math.max(1, count);
  const base = Math.floor(total / n);
  const amounts = Array.from({ length: n }, () => base);
  const remainder = total - base * n;
  amounts[n - 1] += remainder;
  return amounts;
}
