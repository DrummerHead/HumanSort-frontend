import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

import type { RankMeta } from './types';
import type { RankingResponseSuccess } from './shared/types';
import { today, setFreshRankMeta, rankingInProcess } from './tinyFunctions';
import { getOneNoneRanked } from './apiCalls';
import { defaultRank } from './defaultObjects';
import './App.css';

import CompareMode from './CompareMode';
import GalleryMode from './GalleryMode';

const App = () => {
  const [ranking, setRanking] = useState<RankMeta[]>([defaultRank]);
  const [rankedAmount, setRankedAmount] = useState<number>(0);
  const [unrankedAmount, setUnrankedAmount] = useState<number>(0);
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [theme, setTheme] = useState<'neutral' | 'hs' | 'hsdark'>('neutral');
  const [finalState, setFinalState] = useState<boolean>(false);

  // Get all rankings,
  // if no picture has been ranked (initial never used state)
  // then get one non ranked picture and set it as ranked first
  // after first comparison we will have ranking of 1 and 2
  useEffect(() => {
    axios
      .get<RankingResponseSuccess>('/api/v1/ranking')
      .then(function (response) {
        setRankedAmount(response.data.meta);

        if (response.data.meta > 0) {
          setRanking(setFreshRankMeta(response.data.payload));
        } else {
          getOneNoneRanked((respData) => {
            setRanking(
              setFreshRankMeta([
                { ...respData.payload, rank: 1, rankedOn: today() },
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

  const changeTheme = () => {
    setTheme((theme) => {
      switch (theme) {
        case 'neutral':
          return 'hs';
        case 'hs':
          return 'hsdark';
        case 'hsdark':
          return 'neutral';
      }
    });
  };

  return (
    <div className={`humanSort ${theme}Theme`}>
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
        <GalleryMode ranking={ranking} setRanking={setRanking} />
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
        <button
          className="smaller separated"
          onClick={() => setRanking((r) => setFreshRankMeta(r))}
          disabled={!compareMode}
        >
          🔄
        </button>
        <button className="smaller" onClick={changeTheme}>
          💡
        </button>
      </div>

      <Toaster />
    </div>
  );
};

export default App;
