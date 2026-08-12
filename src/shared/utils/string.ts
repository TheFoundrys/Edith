export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
