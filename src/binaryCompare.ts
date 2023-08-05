import type { Pic } from './shared/types';
import type { RankMeta } from './types';
import {
  findPivotIndex,
  today,
  setFreshRankMeta,
  pathToName,
} from './tinyFunctions';
import { defaultRank } from './defaultObjects';

interface BinaryCompareReturnWithoutNew {
  rankings: RankMeta[];
  newPicInserted: false;
}
interface BinaryCompareReturnWithNew {
  rankings: RankMeta[];
  newPicInserted: true;
  newPicWithMeta: RankMeta;
}
type BinaryCompareReturn =
  | BinaryCompareReturnWithoutNew
  | BinaryCompareReturnWithNew;

export const binaryCompare = (
  picToCompare: Pic,
  ranking: RankMeta[],
  isPicToCompareBetterThanPivot: boolean
): BinaryCompareReturn => {
  const incast: RankMeta[] = ranking.filter((rank) => !rank.outcast) || [
    defaultRank,
  ];
  const pivot: RankMeta = incast.find((rank) => rank.pivot) || defaultRank;
  const newIncast: RankMeta[] = incast.filter((rank) =>
    isPicToCompareBetterThanPivot
      ? rank.rank < pivot.rank
      : rank.rank > pivot.rank
  );

  if (newIncast.length === 0) {
    const newPicWithMeta: RankMeta = {
      ...picToCompare,
      name: pathToName(picToCompare.path),
      rank: isPicToCompareBetterThanPivot ? pivot.rank : pivot.rank + 1,
      rankedOn: today(),
      outcast: false,
      pivot: false,
    };
    const newPivot: RankMeta = {
      ...pivot,
      rank: isPicToCompareBetterThanPivot ? pivot.rank + 1 : pivot.rank,
    };

    const rankingsWithNewPic: RankMeta[] = ranking.reduce<RankMeta[]>(
      (acc, curr) => {
        if (curr.rank < pivot.rank) {
          return [...acc, curr];
        }
        if (curr.rank === pivot.rank) {
          return isPicToCompareBetterThanPivot
            ? [...acc, newPicWithMeta, newPivot]
            : [...acc, newPivot, newPicWithMeta];
        }
        if (curr.rank > pivot.rank) {
          return [
            ...acc,
            {
              ...curr,
              rank: curr.rank + 1,
            },
          ];
        }
        return acc;
      },
      []
    );

    return {
      rankings: setFreshRankMeta(rankingsWithNewPic),
      newPicInserted: true,
      newPicWithMeta,
    };
  }

  const newPivotIndex: number = findPivotIndex(newIncast);
  const newPivot: RankMeta = newIncast[newPivotIndex];
  const rankingsWithMetadata: RankMeta[] = ranking.map((rank) => {
    if (rank.outcast) {
      return rank;
    }
    if (rank.pivot) {
      return {
        ...rank,
        pivot: false,
        outcast: true,
      };
    }
    if (rank.rank === newPivot.rank) {
      return {
        ...rank,
        pivot: true,
        outcast: false,
      };
    }
    if (rank.rank > pivot.rank) {
      return isPicToCompareBetterThanPivot
        ? {
            ...rank,
            outcast: true,
          }
        : rank;
    }
    if (rank.rank < pivot.rank) {
      return isPicToCompareBetterThanPivot
        ? rank
        : {
            ...rank,
            outcast: true,
          };
    }
    return rank;
  });

  return {
    rankings: rankingsWithMetadata,
    newPicInserted: false,
  };
};
