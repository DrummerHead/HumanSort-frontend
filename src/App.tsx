import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Pic {
  picId: number;
  path: string;
}
interface PicResponse {
  data: Pic[];
  message: 'success';
}

interface Rank {
  rank: number;
  picId: number;
  path: string;
  rankedOn: string;
}

interface RankResponse {
  data: Rank[];
  message: 'success';
}

const randInt = (lessthan: number): number =>
  Math.floor(Math.random() * lessthan);
const getRandItem = <T,>(array: T[]): T => array[randInt(array.length)];

function App() {
  const [pics, setPics] = useState<Pic[]>([
    { picId: 0, path: '' },
    { picId: 1, path: '' },
  ]);
  const [ranking, setRanking] = useState<Rank[]>([]);
  const a: Pic = getRandItem(pics);
  let b: Pic = getRandItem(pics);
  while (a === b) {
    b = getRandItem(pics);
  }

  useEffect(() => {
    // Get all pics
    axios
      .get<PicResponse>('/api/v1/pics')
      .then(function (response) {
        setPics(response.data.data);
        console.log('/api/v1/pics return:');
        console.log(response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });

    // Get all rankings
    axios
      .get<RankResponse>('/api/v1/ranking')
      .then(function (response) {
        setRanking(response.data.data);
        console.log('/api/v1/ranking return:');
        console.log(response.data.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      if (ev.key === 'ArrowLeft') {
        console.log('a');
      } else if (ev.key === 'ArrowRight') {
        console.log('b');
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  return (
    <div>
      <div className="mainCompare">
        <img src={`/pics/${a.path}`} className="a" alt={a.path} />
        <img src={`/pics/${b.path}`} className="b" alt={b.path} />
      </div>
      <ol className="ranking">
        {ranking.length > 0
          ? ranking.map((rank) => (
              <li>
                <span>{rank.rank}</span>
                <img src={`/pics/${rank.path}`} alt={rank.path} />
              </li>
            ))
          : null}
      </ol>
    </div>
  );
}

export default App;
