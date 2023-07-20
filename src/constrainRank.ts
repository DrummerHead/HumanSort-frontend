import type { RankMeta } from './types';
import { getPivot } from './tinyFunctions';

export const constrainRank = (ranking: RankMeta[]): RankMeta[] => {
  // How many pics to the left and right of centered pivot
  const padding = 5;

  if (ranking.length < padding * 2 + 1) {
    // Not enough to trigger constrain
    return ranking;
  }

  const pivot = getPivot(ranking);

  if (pivot.rank <= padding) {
    // Pivot on high edge
    return ranking.slice(0, padding * 2 + 1);
  }
  if (pivot.rank >= ranking.length - padding) {
    // Pivot on low edge
    return ranking.slice(-(padding * 2 + 1));
  }

  // Pivot in the middle of the pack
  return ranking.slice(pivot.rank - padding - 1, pivot.rank + padding);
};
