import type { Rank, RankMeta, DBRank } from './types';
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

export const rankClass = <T>(arr: T[]): string => {
  const l = arr.length;
  if (l >= 500) {
    return 'rHide';
  }
  if (l >= 300) {
    return 'r0em rNoOutline';
  }
  if (l >= 177) {
    return 'r0em';
  }
  if (l >= 150) {
    return 'rd2em';
  }
  if (l >= 120) {
    return 'rd5em';
  }
  if (l >= 77) {
    return 'rd77em';
  }
  return '';
};

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

export const leanRankings = (rankings: RankMeta[]): DBRank[] =>
  rankings.map(({ rank, picId, rankedOn }) => ({ rank, picId, rankedOn }));
