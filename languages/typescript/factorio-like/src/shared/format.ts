import type { Ms } from "./common";

/**
 * A duration for a label, as coarse as reads naturally
 *
 *   formatDuration(42_000)     # "42 s"
 *   formatDuration(720_000)    # "12 min"
 *   formatDuration(4_320_000)  # "1 h 12 min"
 */
export const formatDuration = (ms: Ms): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 === 0 ? `${h} h` : `${h} h ${min % 60} min`;
};

/**
 *   ordinal(1)   # "1st"
 *   ordinal(12)  # "12th"
 *   ordinal(23)  # "23rd"
 */
export const ordinal = (n: number): string => {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th");
  return `${n}${suffix}`;
};
