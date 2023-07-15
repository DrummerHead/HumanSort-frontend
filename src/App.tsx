import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Pic {
  picId: number;
  path: string;
}
interface PicResponse {
  data: [Pic, ...Pic[]];
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
  const a: Pic = getRandItem(pics);
  let b: Pic = getRandItem(pics);
  while (a === b) {
    b = getRandItem(pics);
  }

  useEffect(() => {
    axios
      .get<PicResponse>('/api/v1/pics')
      .then(function (response) {
        setPics(response.data.data);
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  return (
    <div>
      <div className="mainCompare">
        <img src={`/pics/${a.path}`} className="a" alt={a.path} />
        <img src={`/pics/${b.path}`} className="b" alt={b.path} />
      </div>
    </div>
  );
}

export default App;
