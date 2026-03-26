/**
 * Maps issue category to the appropriate trade professional name.
 */
const TRADE_MAP: Record<string, string> = {
  plumbing: "Plumber",
  electrical: "Electrician",
  structural: "Builder",
  hvac: "Heating Engineer",
  appliance: "Appliance Repair Specialist",
  roofing: "Roofer",
  glazing: "Glazier",
  carpentry: "Carpenter",
  painting: "Decorator",
  gas: "Gas Safe Engineer",
  damp: "Damp Specialist",
  pest: "Pest Control Specialist",
  drainage: "Drainage Engineer",
  locksmith: "Locksmith",
  other: "Specialist",
};

export function getTradeNameForCategory(category?: string): string {
  if (!category) return "Specialist";
  const lower = category.toLowerCase().trim();
  return TRADE_MAP[lower] || "Specialist";
}
