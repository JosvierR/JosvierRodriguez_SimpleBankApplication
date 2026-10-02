export function cents(value) {
  const text = typeof value === "number" ? value.toFixed(2) : String(value).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error("Money value is not a 2-decimal amount");
  }
  const negative = text.startsWith("-");
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ""] = unsigned.split(".");
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -amount : amount;
}

export function formatCents(amount) {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}
