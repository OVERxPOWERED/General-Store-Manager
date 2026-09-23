const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

// Change the locale/currency above if your store isn't in India.
export function formatMoney(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return formatter.format(num);
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
