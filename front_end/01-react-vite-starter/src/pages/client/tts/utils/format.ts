export const formatDistance = (d: number | null) => {
  if (d == null) return "—";
  if (d < 1000) return `${d}m`;
  return `${(d / 1000).toFixed(1)}km`;
};
