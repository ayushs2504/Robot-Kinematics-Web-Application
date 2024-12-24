import React, { useState } from 'react';

function ForwardKinematics() {
  const [tower_lift, settower_lift] = useState('');
  const [tower_swing, settower_swing] = useState('');
  const [elbow_rotation, setelbow_rotation] = useState('');
  const [wrist_rotation, setwrist_rotation] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    
    fetch('http://localhost:5000/update_robot_state', {
      method: 'POST',
      headers: {
        "access-control-allow-origin" : "*",
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tower_lift: tower_lift * 1.0,
        tower_swing: tower_swing * Math.PI/180,
        elbow_rotation: elbow_rotation * Math.PI/180,
        wrist_rotation: wrist_rotation * Math.PI/180,
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
      <h2>Forward Kinematics</h2>
      <form onSubmit={handleSubmit}>
        <div>
        <label>
          Tower lift:
          <input type="number" value={tower_lift} onChange={(e) => settower_lift(e.target.value)} />
        </label>
        </div>
        <div>
        <label>
          Tower swing (deg):
          <input type="number" value={tower_swing} onChange={(e) => settower_swing(e.target.value)} />
        </label>
        </div>
        <div>
        <label>
          Elbow rotation (deg):
          <input type="number" value={elbow_rotation} onChange={(e) => setelbow_rotation(e.target.value)} />
        </label>
        </div>
        <div>
        <label>
          Wrist rotation (deg):
          <input type="number" value={wrist_rotation} onChange={(e) => setwrist_rotation(e.target.value)} />
        </label>
        </div>
        {responseMessage && <p>{responseMessage}</p>}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ForwardKinematics;