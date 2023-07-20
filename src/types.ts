interface Success {
  message: 'success';
}

interface RankedAmount {
  rankedAmount: number;
}

export interface Pic {
  picId: number;
  path: string;
}

export interface Rank extends Pic {
  rank: number;
  rankedOn: string;
}

export interface RankResponse extends Success, RankedAmount {
  ranks: Rank[];
}

export interface PostRankResponse extends Success, RankedAmount {}

export interface RankMeta extends Rank {
  name: string;
  outcast: boolean;
  pivot: boolean;
}

export interface OneNonRankedReponse extends Success {
  newPic: Pic;
  unrankedAmount: number;
}
