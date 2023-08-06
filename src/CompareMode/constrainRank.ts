import { getPivot } from '../tinyFunctions';
import type { RankMeta } from '../types';

/*
 * Get a n length RankMeta[] and return a constrained length
 * RankMeta[] where the "center" is the pivot and there is
 * padding amount of RankMeta to either side.
 *
 * Used in the display of thumbnail previews
 *
 */
export const constrainRank = (
  ranking: RankMeta[],
  padding: number = 5
): RankMeta[] => {
  const maxConstrainedLength = padding * 2 + 1;

  if (ranking.length < maxConstrainedLength) {
    // Not enough to trigger constrain
    return ranking;
  }

  const pivot = getPivot(ranking);

  if (pivot.rank <= padding) {
    // Pivot on high edge
    return ranking.slice(0, maxConstrainedLength);
  }
  if (pivot.rank >= ranking.length - padding) {
    // Pivot on low edge
    return ranking.slice(-maxConstrainedLength);
  }

  // Pivot in the middle of the pack
  return ranking.slice(pivot.rank - padding - 1, pivot.rank + padding);
};
