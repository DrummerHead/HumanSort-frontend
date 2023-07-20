import React, { useState, useEffect } from 'react';
import loading from './images/loading.png';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

interface Success {
  message: 'success';
}
interface RankedAmount {
  rankedAmount: number;
}

interface Pic {
  picId: number;
  path: string;
}

interface Rank extends Pic {
  rank: number;
  rankedOn: string;
}
interface RankResponse extends Success, RankedAmount {
  ranks: Rank[];
}
interface PostRankResponse extends Success, RankedAmount {}

interface RankMeta extends Rank {
  outcast: boolean;
  pivot: boolean;
}
interface OneRankedReponse extends Success {
  newPic: Pic;
  unrankedAmount: number;
}

const defaultPic: Pic = { picId: 0, path: loading };
const defaultRank: RankMeta = {
  picId: 1,
  path: loading,
  rank: 1,
  rankedOn: '2023-07-17',
  outcast: false,
  pivot: true,
};

const getPivot = (ranks: RankMeta[]): RankMeta =>
  ranks.find((r) => r.pivot) || defaultRank;

const findPivotIndex = <T,>(array: T[]): number =>
  Math.ceil(array.length / 2) - 1;

const today = new Date().toISOString().split('T')[0];

const setFreshRankMeta = (ranks: Rank[]): RankMeta[] => {
  // We assume that all ranks exist from 1 to n and in this case
  // length maps to minimum rank so we can find the ranked pic
  // in the middle of the pack
  const pivot = findPivotIndex(ranks);
  return ranks.map((rank) => ({
    ...rank,
    outcast: false,
    pivot: rank.rank === pivot + 1,
  }));
};

interface BinaryCompareReturn {
  rankings: RankMeta[];
  newPicInserted: boolean;
}
const binaryCompare = (
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
    const rankingsWithNewPic: RankMeta[] = ranking.reduce<RankMeta[]>(
      (acc, curr) => {
        if (curr.rank < pivot.rank) {
          return [...acc, curr];
        }
        if (curr.rank === pivot.rank) {
          const picWithMeta: RankMeta = {
            ...picToCompare,
            rank: isPicToCompareBetterThanPivot ? pivot.rank : pivot.rank + 1,
            rankedOn: today,
            outcast: false,
            pivot: false,
          };
          const newPivot = {
            ...pivot,
            rank: isPicToCompareBetterThanPivot ? pivot.rank + 1 : pivot.rank,
          };
          return isPicToCompareBetterThanPivot
            ? [...acc, picWithMeta, newPivot]
            : [...acc, newPivot, picWithMeta];
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

function App() {
  const [ranking, setRanking] = useState<RankMeta[]>([defaultRank]);
  const [newPic, setNewPic] = useState<Pic>(defaultPic);
  const [rankedAmount, setRankedAmount] = useState<number>();
  const [unrankedAmount, setUnrankedAmount] = useState<number>();
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const pivot: RankMeta = getPivot(ranking);

  useEffect(() => {
    // Get one non ranked pic
    axios
      .get<OneRankedReponse>('/api/v1/one-non-ranked')
      .then(function (response) {
        setNewPic(response.data.newPic);
        setUnrankedAmount(response.data.unrankedAmount);
        console.log('/api/v1/one-non-ranked return:');
        console.log(response.data);
      })
      .catch(function (error) {
        toast.error(error.response.data.error);
        console.log(error);
      });
  }, []);

  useEffect(() => {
    // Get all rankings
    axios
      .get<RankResponse>('/api/v1/ranking')
      .then(function (response) {
        setRankedAmount(response.data.rankedAmount);

        if (response.data.rankedAmount > 0) {
          setRanking(setFreshRankMeta(response.data.ranks));
        } else {
          axios
            .get<OneRankedReponse>('/api/v1/one-non-ranked')
            .then(function (response) {
              setRanking(
                setFreshRankMeta([
                  { ...response.data.newPic, rank: 1, rankedOn: today },
                ])
              );
              console.log('/api/v1/one-non-ranked return:');
              console.log(response.data);
            })
            .catch(function (error) {
              toast.error(error.response.data.error);
              console.log(error);
            });
        }

        console.log('/api/v1/ranking return:');
        console.log(response.data);
      })
      .catch(function (error) {
        toast.error(error.response.data.error);
        console.log(error);
      });
  }, []);

  useEffect(() => {
    const choose = (newPicIsBetter: boolean): void => {
      const { rankings, newPicInserted } = binaryCompare(
        newPic,
        ranking,
        newPicIsBetter
      );
      setRanking(rankings);
      if (newPicInserted) {
        axios
          .post<PostRankResponse>('/api/v1/ranking', rankings)
          .then(function (response) {
            setRankedAmount(response.data.rankedAmount);
            console.log('POST /api/v1/ranking response:');
            console.log(response.data);
          })
          .then(function () {
            axios
              .get<OneRankedReponse>('/api/v1/one-non-ranked')
              .then(function (response) {
                setNewPic(response.data.newPic);
                setUnrankedAmount(response.data.unrankedAmount);
                console.log('/api/v1/one-non-ranked return:');
                console.log(response.data);
              })
              .catch(function (error) {
                toast.error(error.response.data.error);
                console.log(error);
              });
          })
          .catch(function (error) {
            toast.error(error.response.data.error);
            console.log(error);
          });
      }
    };

    const keyHandler = (ev: KeyboardEvent): void => {
      if (ev.key === 'ArrowLeft') {
        choose(true);
      } else if (ev.key === 'ArrowRight') {
        choose(false);
      }
    };
    compareMode && document.addEventListener('keydown', keyHandler);
    return () => {
      compareMode && document.removeEventListener('keydown', keyHandler);
    };
  }, [newPic, ranking, compareMode]);

  return (
    <div>
      {compareMode ? (
        <div id="compareMode">
          <div className="mainCompare">
            <img src={newPic.path} alt={newPic.path} title={newPic.path} />
            <img src={pivot.path} alt={pivot.path} title={pivot.path} />
          </div>
          <ol className="ranking">
            {ranking.length > 0
              ? ranking.map((rank) => (
                  <li
                    key={rank.rank}
                    className={
                      rank.outcast
                        ? 'outcast'
                        : rank.pivot
                        ? 'pivot'
                        : undefined
                    }
                  >
                    <span>{rank.rank}</span>
                    <img src={rank.path} alt={rank.path} title={rank.path} />
                  </li>
                ))
              : null}
          </ol>
        </div>
      ) : (
        <div id="galleryMode">
          <ol className="gallery">
            {ranking.map((rank) => (
              <li key={rank.rank} id={`rank${rank.rank}`}>
                <span>{rank.rank}</span>
                <img src={rank.path} alt={rank.path} title={rank.path} />
              </li>
            ))}
          </ol>
          <nav>
            <a href={`#rank${ranking.length}`}>last</a>
            <a href={`#rank${pivot.rank}`}>center</a>
            <a href={`#rank1`}>first</a>
          </nav>
        </div>
      )}
      <div className="stats">
        <p>
          ranked: <strong>{rankedAmount}</strong>
        </p>
        <p>
          unranked: <strong>{unrankedAmount}</strong>
        </p>
      </div>
      <div className="controls">
        <button onClick={() => setCompareMode(true)} disabled={compareMode}>
          Compare
        </button>
        <button onClick={() => setCompareMode(false)} disabled={!compareMode}>
          Gallery
        </button>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
