/** Deterministic avatar gradient class (g2-g5, or none for the default) from a stable id — purely cosmetic variety, same conversation always gets the same color. */
const GRADIENT_CLASSES = ["", "rad-g2", "rad-g3", "rad-g4", "rad-g5"];

export function avatarGradientClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return GRADIENT_CLASSES[hash % GRADIENT_CLASSES.length]!;
}

export function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}
