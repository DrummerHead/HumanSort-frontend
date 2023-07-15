import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [pics, setPics] = useState([]);

  useEffect(() => {
    axios
      .get('/api/v1/pics')
      .then(function (response) {
        // handle success
        console.log(response);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }, []);

  return (
    <div>
      <p>meow</p>
    </div>
  );
}

export default App;
