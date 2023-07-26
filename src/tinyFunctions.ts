import type { Rank, RankMeta, DBRank, RankGallery } from './types';
import { defaultRank } from './defaultObjects';

export const getPivot = (ranks: RankMeta[]): RankMeta =>
  ranks.find((r) => r.pivot) || defaultRank;

export const findPivotIndex = <T>(array: T[]): number =>
  Math.ceil(array.length / 2) - 1;

export const today = () => new Date().toISOString();

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

export const setFreshRankGallery = (ranks: RankMeta[]): RankGallery[] => {
  return ranks.map((rank) => ({
    picId: rank.picId,
    path: rank.path,
    originalRank: rank.rank,
    newRank: rank.rank,
    name: rank.name,
    focused: rank.rank === 1,
    selected: false,
  }));
};

// Marked for deletion
export const leanRankings = (rankings: RankMeta[]): DBRank[] =>
  rankings.map(({ rank, picId, rankedOn }) => ({ rank, picId, rankedOn }));

export const upPressed = (ev: KeyboardEvent) =>
  ev.key === 'ArrowUp' || ev.key === 'w';

export const rightPressed = (ev: KeyboardEvent) =>
  ev.key === 'ArrowRight' || ev.key === 'd';

export const downPressed = (ev: KeyboardEvent) =>
  ev.key === 'ArrowDown' || ev.key === 's';

export const leftPressed = (ev: KeyboardEvent) =>
  ev.key === 'ArrowLeft' || ev.key === 'a';

export const rankingInProcess = (ranking: RankMeta[]) =>
  ranking.some((r) => r.outcast);
