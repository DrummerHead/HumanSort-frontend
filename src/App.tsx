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
import { getPivot, today, setFreshRankMeta } from './tinyFunctions';
import { defaultPic, defaultRank } from './defaultObjects';
import { binaryCompare } from './binaryCompare';
import './App.css';

function App() {
  const [ranking, setRanking] = useState<RankMeta[]>([defaultRank]);
  const [newPic, setNewPic] = useState<Pic>(defaultPic);
  const [rankedAmount, setRankedAmount] = useState<number>();
  const [unrankedAmount, setUnrankedAmount] = useState<number>();
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [finalState, setFinalState] = useState<boolean>(false);
  const pivot: RankMeta = getPivot(ranking);

  const getOneRanked = (fn: (respData: OneNonRankedReponse) => void): void => {
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

  useEffect(() => {
    getOneRanked((respData) => {
      setNewPic(respData.newPic);
      setUnrankedAmount(respData.unrankedAmount);
      if (respData.unrankedAmount === 0) {
        setFinalState(true);
        setCompareMode(false);
        toast.success('All of the images are ranked! You did it!');
      }
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
          getOneRanked((respData) => {
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
            getOneRanked((respData) => {
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
