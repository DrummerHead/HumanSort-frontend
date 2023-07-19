import React, { useState, useEffect } from 'react';
import loading from './images/loading.png';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

interface Response<T> {
  data: T[];
  message: 'success';
}

interface Pic {
  picId: number;
  path: string;
}

interface Rank extends Pic {
  rank: number;
  rankedOn: string;
}
type RankResponse = Response<Rank>;

interface RankMeta extends Rank {
  outcast: boolean;
  comparing: boolean;
}

const defaultPic: Pic = { picId: 0, path: loading };
const defaultRank: RankMeta = {
  picId: 1,
  path: loading,
  rank: 1,
  rankedOn: '2023-07-17',
  outcast: false,
  comparing: true,
};

const getPivot = (ranks: RankMeta[]): RankMeta =>
  ranks.find((r) => r.comparing) || defaultRank;

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
    comparing: rank.rank === pivot + 1,
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
  const pivot: RankMeta = incast.find((rank) => rank.comparing) || defaultRank;
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
          const picWithMeta = {
            ...picToCompare,
            rank: isPicToCompareBetterThanPivot ? pivot.rank : pivot.rank + 1,
            rankedOn: today,
            outcast: false,
            comparing: false,
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
    if (rank.comparing) {
      return {
        ...rank,
        comparing: false,
        outcast: true,
      };
    }
    if (rank.rank === newPivot.rank) {
      return {
        ...rank,
        comparing: true,
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
  const pivot: Pic = getPivot(ranking);

  useEffect(() => {
    // Get one non ranked pic
    axios
      .get('/api/v1/one-non-ranked')
      .then(function (response) {
        setNewPic(response.data.data);
        console.log('/api/v1/one-non-ranked return:');
        console.log(response.data.data);
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
        console.log(response.data.data.length);

        if (response.data.data.length > 0) {
          setRanking(setFreshRankMeta(response.data.data));
        } else {
          axios
            .get('/api/v1/one-non-ranked')
            .then(function (response) {
              setRanking(
                setFreshRankMeta([
                  { ...response.data.data, rank: 1, rankedOn: today },
                ])
              );
              console.log('/api/v1/one-non-ranked return:');
              console.log(response.data.data);
            })
            .catch(function (error) {
              toast.error(error.response.data.error);
              console.log(error);
            });
        }

        console.log('/api/v1/ranking return:');
        console.log(response.data.data);
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
          .post('/api/v1/ranking', rankings)
          .then(function (response) {
            console.log(response);
          })
          .then(function () {
            axios
              .get('/api/v1/one-non-ranked')
              .then(function (response) {
                setNewPic(response.data.data);
                console.log('/api/v1/one-non-ranked return:');
                console.log(response.data.data);
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
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, [newPic, ranking]);

  return (
    <div>
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
                    : rank.comparing
                    ? 'comparing'
                    : undefined
                }
              >
                <span>{rank.rank}</span>
                <img src={rank.path} alt={rank.path} title={rank.path} />
              </li>
            ))
          : null}
      </ol>
      <Toaster />
    </div>
  );
}

export default App;
