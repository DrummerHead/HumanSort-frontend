import type { Dispatch, SetStateAction } from 'react';
import type { Pic, RankRow } from './shared/types';

export type SetState<T> = Dispatch<SetStateAction<T>>;

export type Rank = Pic & RankRow;

export interface RankMeta extends Rank {
  name: string;
  outcast: boolean;
  pivot: boolean;
}

export interface RankGallery extends Pic {
  originalRank: number;
  newRank: number;
  name: string;
  rankedOn: string;
  focused: boolean;
  selected: boolean;
}

export type Direction = 'up' | 'right' | 'down' | 'left' | null;
