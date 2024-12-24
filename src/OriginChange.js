import React, { useState } from 'react';

function OriginChange() {
    const [ox, setox] = useState('');
    const [oy, setoy] = useState('');
    const [oz, setoz] = useState('');
    const [o_swing, seto_swing] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
  
    const handleSubmit = (event) => {
      event.preventDefault();
      
      fetch('http://localhost:5000/origin_update', {
        method: 'POST',
        headers: {
          "access-control-allow-origin" : "*",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ox: ox * 1.0,
          oy: oy * 1.0,
          oz: oz * 1.0,
          o_swing: o_swing * Math.PI/180,
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
        <h2>Origin Control</h2>
        <form onSubmit={handleSubmit}>
          <div>
          <label>
            Origin X:
            <input type="number" value={ox} onChange={(e) => setox(e.target.value)} />
          </label>
          </div>
          <div>
          <label>
            Origin Y:
            <input type="number" value={oy} onChange={(e) => setoy(e.target.value)} />
          </label>
          </div>
          <div>
          <label>
            Origin Z:
            <input type="number" value={oz} onChange={(e) => setoz(e.target.value)} />
          </label>
          </div>
          <div>
          <label>
            Swing (deg):
            <input type="number" value={o_swing} onChange={(e) => seto_swing(e.target.value)} />
          </label>
          </div>
          {responseMessage && <p>{responseMessage}</p>}
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }
  
  export default OriginChange;
  
  