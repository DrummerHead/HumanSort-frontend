import type { Rank, RankMeta } from './types';
import { defaultRank } from './defaultObjects';

export const getPivot = (ranks: RankMeta[]): RankMeta =>
  ranks.find((r) => r.pivot) || defaultRank;

export const findPivotIndex = <T>(array: T[]): number =>
  Math.ceil(array.length / 2) - 1;

// not even a fn lol
export const today = new Date().toISOString().split('T')[0];

export const pathToName = (path: string): string =>
  path
    .replace(/^\/pics\//, '')
    .replace(/-/g, ' ')
    .replace(/.png$/, '');

export const setFreshRankMeta = (ranks: Rank[]): RankMeta[] => {
  // We assume that all ranks exist from 1 to n and in this case
  // length maps to minimum rank so we can find the ranked pic
  // in the middle of the pack
  const pivot = findPivotIndex(ranks);
  return ranks.map((rank) => ({
    ...rank,
    outcast: false,
    pivot: rank.rank === pivot + 1,
    name: pathToName(rank.path),
  }));
};
