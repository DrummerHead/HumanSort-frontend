import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

import type { RankResponse, RankMeta } from './types';
import {
  getPivot,
  today,
  setFreshRankMeta,
  rankingInProcess,
} from './tinyFunctions';
import { getOneNoneRanked } from './apiCalls';
import { defaultRank } from './defaultObjects';
import './App.css';

import CompareMode from './CompareMode';

const App = () => {
  const [ranking, setRanking] = useState<RankMeta[]>([defaultRank]);
  const [rankedAmount, setRankedAmount] = useState<number>(0);
  const [unrankedAmount, setUnrankedAmount] = useState<number>(0);
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [finalState, setFinalState] = useState<boolean>(false);
  const pivot: RankMeta = getPivot(ranking);

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

  return (
    <div>
      {compareMode ? (
        <CompareMode
          ranking={ranking}
          rankedAmount={rankedAmount}
          setRanking={setRanking}
          setRankedAmount={setRankedAmount}
          setFinalState={setFinalState}
          setUnrankedAmount={setUnrankedAmount}
          setCompareMode={setCompareMode}
        />
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
        <button
          onClick={() => setCompareMode(false)}
          disabled={!compareMode || rankingInProcess(ranking)}
        >
          Gallery
        </button>
      </div>

      <Toaster />
    </div>
  );
};

export default App;
