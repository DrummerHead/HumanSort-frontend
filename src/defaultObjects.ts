import type { Pic, RankMeta, RankGallery } from './types';
import loading from './images/loading.png';

export const defaultPic: Pic = { picId: 0, path: loading };

export const defaultRank: RankMeta = {
  picId: 1,
  path: loading,
  name: 'loading',
  rank: 1,
  rankedOn: '2023-07-17',
  outcast: false,
  pivot: true,
};

export const defaultRankGallery: RankGallery = {
  picId: 0,
  path: loading,
  originalRank: 1,
  newRank: 1,
  name: 'loading',
  focused: false,
  selected: false,
};
