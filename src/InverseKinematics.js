import React, { useState } from 'react';

function InverseKinematics() {
    const [x, setx] = useState('');
    const [y, sety] = useState('');
    const [z, setz] = useState('');
    const [pose, setpose] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
  
    const handleSubmit = (event) => {
      event.preventDefault();
      
      fetch('http://localhost:5000/inverse_kinematics', {
        method: 'POST',
        headers: {
          "access-control-allow-origin" : "*",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x: x * 1.0,
          y: y * 1.0,
          z: z * 1.0,
          pose: pose * Math.PI/180,
        }),
      })
      .then(response => response.json())
      .then(data => {
        setResponseMessage(data.message);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    };
  
    return (
      <div>
        <h2>Inverse Kinematics (Relative Coordinates)</h2>
        <form onSubmit={handleSubmit}>
          <div>
          <label>
            X:
            <input type="number" value={x} onChange={(e) => setx(e.target.value)} />
          </label>
          </div>
          <div>
          <label>
            Y:
            <input type="number" value={y} onChange={(e) => sety(e.target.value)} />
          </label>
          </div>
          <div>
          <label>
            Z:
            <input type="number" value={z} onChange={(e) => setz(e.target.value)} />
          </label>
          </div>
          <div>
          <label>
            Pose (deg):
            <input type="number" value={pose} onChange={(e) => setpose(e.target.value)} />
          </label>
          </div>
          {responseMessage && <p>{responseMessage}</p>}
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }
  
  export default InverseKinematics;
  
  