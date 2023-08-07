import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { AxiosResponse } from 'axios';

import { binaryCompare } from './binaryCompare';
import { constrainRank } from './constrainRank';
import {
  getPivot,
  rankClass,
  leftPressed,
  rightPressed,
} from '../tinyFunctions';
import { getOneNoneRanked } from '../apiCalls';
import { defaultPic } from '../defaultObjects';
import type { RankMeta, SetState } from '../types';
import type {
  Pic,
  OneRankingResponseSuccess,
  OneRankingRequestBody,
} from '../shared/types';

interface CompareModeProps {
  ranking: RankMeta[];
  rankedAmount: number;
  setRanking: SetState<RankMeta[]>;
  setRankedAmount: SetState<number>;
  setFinalState: SetState<boolean>;
  setUnrankedAmount: SetState<number>;
  setCompareMode: SetState<boolean>;
}
const CompareMode = ({
  ranking,
  rankedAmount,
  setRanking,
  setRankedAmount,
  setFinalState,
  setUnrankedAmount,
  setCompareMode,
}: CompareModeProps) => {
  const [newPic, setNewPic] = useState<Pic>(defaultPic);
  const [leftHighlight, setLeftHighlight] = useState<boolean>(false);
  const [rightHighlight, setRightHighlight] = useState<boolean>(false);
  const pivot: RankMeta = getPivot(ranking);

  // Get the first one non ranked pic on load
  // In case there are no unraked pictures left to rank,
  // reach final state of all pics ranked and only allow access to gallery
  useEffect(() => {
    getOneNoneRanked((respData) => {
      setNewPic(respData.payload);
      setUnrankedAmount(respData.meta);
      if (respData.meta === 0) {
        setFinalState(true);
        toast.success('All of the images are ranked! You did it!');
        setCompareMode(false);
      }
    });
  }, [setCompareMode, setFinalState, setUnrankedAmount]);

  // Determine whether new non ranked pic or ranked pic is better
  const choose = useCallback(
    (newPicIsBetter: boolean): void => {
      const bc = binaryCompare(newPic, ranking, newPicIsBetter);
      // Set the rankings according to position of pic
      setRanking(bc.rankings);

      // At some point the final position of pic is determined
      if (bc.newPicInserted) {
        // In special case of empty initial state, also have to post ranking pic
        if (rankedAmount === 0) {
          axios.post<
            OneRankingResponseSuccess,
            AxiosResponse<OneRankingResponseSuccess>,
            OneRankingRequestBody
          >('/api/v1/one-ranking', ranking[0]);
        }
        // Post newPicWithMeta to backend
        axios
          .post<
            OneRankingResponseSuccess,
            AxiosResponse<OneRankingResponseSuccess>,
            OneRankingRequestBody
          >('/api/v1/one-ranking', bc.newPicWithMeta)
          .then(function (response) {
            setRankedAmount(response.data.meta);
            console.log('POST /api/v1/one-ranking response:');
            console.log(response.data);
          })
          // And get a new pic to compare
          // In case there are no unraked pictures left to rank,
          // reach final state of all pics ranked and only allow access to gallery
          .then(function () {
            getOneNoneRanked((respData) => {
              setNewPic(respData.payload);
              setUnrankedAmount(respData.meta);
              if (respData.meta === 0) {
                toast.success('All of the images are ranked! You did it!');
                setFinalState(true);
                setCompareMode(false);
              }
            });
          })
          .catch(function (error) {
            toast.error(error.response.data.error);
            console.log(error);
          });
      }
    },
    [
      newPic,
      rankedAmount,
      ranking,
      setCompareMode,
      setFinalState,
      setRankedAmount,
      setRanking,
      setUnrankedAmount,
    ]
  );

  // On key down set highlight on either left or right
  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      if (leftPressed(ev)) {
        setLeftHighlight(true);
      } else if (rightPressed(ev)) {
        setRightHighlight(true);
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  // On key up choose picture and remove higlight
  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      if (leftPressed(ev)) {
        choose(true);
        setLeftHighlight(false);
      } else if (rightPressed(ev)) {
        choose(false);
        setRightHighlight(false);
      }
    };
    document.addEventListener('keyup', keyHandler);
    return () => {
      document.removeEventListener('keyup', keyHandler);
    };
  }, [choose]);

  return (
    <div id="compareMode">
      <div
        className={`mainCompare ${
          leftHighlight
            ? 'leftHighlight'
            : rightHighlight
            ? 'rightHighlight'
            : ''
        }`}
      >
        <img
          src={newPic.path}
          onClick={() => choose(true)}
          onMouseEnter={() => setLeftHighlight(true)}
          onMouseLeave={() => setLeftHighlight(false)}
          alt={newPic.path}
        />
        <img
          src={pivot.path}
          onClick={() => choose(false)}
          onMouseEnter={() => setRightHighlight(true)}
          onMouseLeave={() => setRightHighlight(false)}
          alt={pivot.name}
        />
      </div>
      <ol className={`ranking visualization ${rankClass(ranking)}`}>
        {ranking.length > 0
          ? ranking.map((rank) => (
              <li
                key={rank.rank}
                className={
                  rank.outcast ? 'outcast' : rank.pivot ? 'pivot' : undefined
                }
              >
                {rank.rank}
              </li>
            ))
          : null}
      </ol>
      <ol className="ranking">
        {ranking.length > 0
          ? constrainRank(ranking).map((rank) => (
              <li
                key={rank.rank}
                className={
                  rank.outcast ? 'outcast' : rank.pivot ? 'pivot' : undefined
                }
              >
                <span>{rank.rank}</span>
                <img src={rank.path} alt={rank.name} title={rank.name} />
              </li>
            ))
          : null}
      </ol>
    </div>
  );
};

export default CompareMode;
