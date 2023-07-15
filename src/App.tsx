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

function App() {
  const [pics, setPics] = useState<Pic[]>([]);

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
      {pics.map((pic) => (
        <img src={`/pics/${pic.path}`} alt={pic.path} />
      ))}
    </div>
  );
}

export default App;
