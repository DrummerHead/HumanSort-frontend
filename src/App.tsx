import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

import type {
  Pic,
  RankResponse,
  PostRankResponse,
  RankMeta,
  OneNonRankedReponse,
} from './types';
import {
  getPivot,
  today,
  setFreshRankMeta,
  rankClass,
  leftPressed,
  rightPressed,
} from './tinyFunctions';
import { defaultPic, defaultRank } from './defaultObjects';
import { binaryCompare } from './binaryCompare';
import { constrainRank } from './constrainRank';
import './App.css';

function App() {
  const [ranking, setRanking] = useState<RankMeta[]>([defaultRank]);
  const [newPic, setNewPic] = useState<Pic>(defaultPic);
  const [rankedAmount, setRankedAmount] = useState<number>();
  const [unrankedAmount, setUnrankedAmount] = useState<number>();
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [leftHighlight, setLeftHighlight] = useState<boolean>(false);
  const [rightHighlight, setrightHighlight] = useState<boolean>(false);
  const [finalState, setFinalState] = useState<boolean>(false);
  const pivot: RankMeta = getPivot(ranking);

  const getOneNoneRanked = (
    fn: (respData: OneNonRankedReponse) => void
  ): void => {
    // Get one non ranked pic
    axios
      .get<OneNonRankedReponse>('/api/v1/one-non-ranked')
      .then(function (response) {
        fn(response.data);
        console.log('/api/v1/one-non-ranked return:');
        console.log(response.data);
      })
      .catch(function (error) {
        toast.error(error.response.data.error);
        console.log(error);
      });
  };

  // Get the first one non ranked pic on load
  // In case there are no unraked pictures left to rank,
  // reach final state of all pics ranked and only allow access to gallery
  useEffect(() => {
    getOneNoneRanked((respData) => {
      setNewPic(respData.newPic);
      setUnrankedAmount(respData.unrankedAmount);
      if (respData.unrankedAmount === 0) {
        setFinalState(true);
        setCompareMode(false);
        toast.success('All of the images are ranked! You did it!');
      }
    });
  }, []);

  // Get all rankings,
  // if no picture has been ranked (initial never used state)
  // then get one non ranked picture and set it as ranked first
  // after first comparison we will have ranking of 1 and 2
  useEffect(() => {
    axios
      .get<RankResponse>('/api/v1/ranking')
      .then(function (response) {
        setRankedAmount(response.data.rankedAmount);

        if (response.data.rankedAmount > 0) {
          setRanking(setFreshRankMeta(response.data.ranks));
        } else {
          getOneNoneRanked((respData) => {
            setRanking(
              setFreshRankMeta([
                { ...respData.newPic, rank: 1, rankedOn: today },
              ])
            );
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

  // On key down set highlight on either left or right
  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      if (leftPressed(ev)) {
        setLeftHighlight(true);
      } else if (rightPressed(ev)) {
        setrightHighlight(true);
      }
    };
    compareMode && document.addEventListener('keydown', keyHandler);
    return () => {
      compareMode && document.removeEventListener('keydown', keyHandler);
    };
  }, [compareMode]);

  // On key up choose picture and remove higlight
  useEffect(() => {
    // Determine whether new non ranked pic or ranked pic is better
    const choose = (newPicIsBetter: boolean): void => {
      const bc = binaryCompare(newPic, ranking, newPicIsBetter);
      // Set the rankings according to position of pic
      setRanking(bc.rankings);

      // At some point the final position of pic is determined
      if (bc.newPicInserted) {
        // Post it to backend
        axios
          .post<PostRankResponse>('/api/v1/one-ranking', bc.newPicWithMeta)
          .then(function (response) {
            setRankedAmount(response.data.rankedAmount);
            console.log('POST /api/v1/ranking response:');
            console.log(response.data);
          })
          // And get a new pic to compare
          // In case there are no unraked pictures left to rank,
          // reach final state of all pics ranked and only allow access to gallery
          .then(function () {
            getOneNoneRanked((respData) => {
              setNewPic(respData.newPic);
              setUnrankedAmount(respData.unrankedAmount);
              if (respData.unrankedAmount === 0) {
                setFinalState(true);
                setCompareMode(false);
                toast.success('All of the images are ranked! You did it!');
              }
            });
          })
          .catch(function (error) {
            toast.error(error.response.data.error);
            console.log(error);
          });
      }
    };

    const keyHandler = (ev: KeyboardEvent): void => {
      if (leftPressed(ev)) {
        choose(true);
        setLeftHighlight(false);
      } else if (rightPressed(ev)) {
        choose(false);
        setrightHighlight(false);
      }
    };
    compareMode && document.addEventListener('keyup', keyHandler);
    return () => {
      compareMode && document.removeEventListener('keyup', keyHandler);
    };
  }, [newPic, ranking, compareMode]);

  return (
    <div>
      {compareMode ? (
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
            <img src={newPic.path} alt={newPic.path} title={newPic.path} />
            <img src={pivot.path} alt={pivot.name} title={pivot.name} />
          </div>
          <ol className={`ranking visualization ${rankClass(ranking)}`}>
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
                      rank.outcast
                        ? 'outcast'
                        : rank.pivot
                        ? 'pivot'
                        : undefined
                    }
                  >
                    <span>{rank.rank}</span>
                    <img src={rank.path} alt={rank.name} title={rank.name} />
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
                <p>{rank.name}</p>
                <img src={rank.path} alt={rank.name} />
              </li>
            ))}
          </ol>
          <nav>
            <a href={`#rank${ranking.length}`}>last</a>
            <a href={`#rank${pivot.rank}`}>pivot</a>
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
        <button
          onClick={() => setCompareMode(true)}
          disabled={compareMode || finalState}
        >
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
