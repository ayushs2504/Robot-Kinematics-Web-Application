import React, { useState, useEffect } from 'react';
const rpms = require('./robot_parameters.json');

function RobotState() {
  const [robotState, setRobotState] = useState({
    tower_lift: 0,
    tower_swing: 0,
    elbow_rotation: 0,
    wrist_rotation: 0,
    ox: 0,
    oy: 0,
    oz: 0,
    o_swing: 0,
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:7004'); 

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRobotState(data); 
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [robotState]);

  return (
    <div>
        <div>
        <h2>Robot States</h2>
        <p>Tower Lift: {parseFloat(robotState.tower_lift).toFixed(3)}</p>
        <p>Tower Swing (deg): {(parseFloat(robotState.tower_swing) * (180 / Math.PI)).toFixed(3) }</p>
        <p>Elbow Rotation(deg): {(parseFloat(robotState.elbow_rotation) * (180 / Math.PI)).toFixed(3) }</p>
        <p>Wrist Rotation(deg): {(parseFloat(robotState.wrist_rotation) * (180 / Math.PI)).toFixed(3) }</p>
        <table>
          <tr>
            <td>
              <p>Robot Origin</p>
              <p>X: {parseFloat(robotState.ox).toFixed(3) }</p>
              <p>Y: {parseFloat(robotState.oy).toFixed(3)  }</p>
              <p>Z: {parseFloat(robotState.oz).toFixed(3) }</p>
              <p>Swing (deg): {(parseFloat(robotState.o_swing) * (180 / Math.PI)).toFixed(3) }</p>
            </td>
            <td>
              <p>End Effector (abs)</p>
              <p>X: {parseFloat(robotState.ox + rpms.tower[0].tower_arm_length*Math.cos(robotState.tower_swing+robotState.o_swing)
                                              + rpms.forearm[0].forearm_length*Math.cos(robotState.tower_swing+robotState.elbow_rotation+robotState.o_swing)
                                              + rpms.wrist[0].wrist_length*Math.cos(robotState.tower_swing+robotState.elbow_rotation+robotState.wrist_rotation+robotState.o_swing)).toFixed(3) }</p>
              <p>Y: {parseFloat(robotState.oy + rpms.tower[0].tower_arm_length*Math.sin(robotState.tower_swing+robotState.o_swing)
                                              + rpms.forearm[0].forearm_length*Math.sin(robotState.tower_swing+robotState.elbow_rotation+robotState.o_swing)
                                              + rpms.wrist[0].wrist_length*Math.sin(robotState.tower_swing+robotState.elbow_rotation+robotState.wrist_rotation+robotState.o_swing)).toFixed(3)  }</p>
              <p>Z: {parseFloat(robotState.oz + robotState.tower_lift).toFixed(3) }</p>
              <p>Pose (deg): {(parseFloat(robotState.o_swing + robotState.tower_swing + robotState.elbow_rotation + robotState.wrist_rotation) * (180 / Math.PI)).toFixed(3) }</p>
            </td>
            <td>
              <p>End Effector (rel)</p>
              <p>X: {parseFloat(rpms.tower[0].tower_arm_length*Math.cos(robotState.tower_swing+robotState.o_swing)
                              + rpms.forearm[0].forearm_length*Math.cos(robotState.tower_swing+robotState.elbow_rotation+robotState.o_swing)
                              + rpms.wrist[0].wrist_length*Math.cos(robotState.tower_swing+robotState.elbow_rotation+robotState.wrist_rotation+robotState.o_swing)).toFixed(3) }</p>
              <p>Y: {parseFloat(rpms.tower[0].tower_arm_length*Math.sin(robotState.tower_swing+robotState.o_swing)
                              + rpms.forearm[0].forearm_length*Math.sin(robotState.tower_swing+robotState.elbow_rotation+robotState.o_swing)
                              + rpms.wrist[0].wrist_length*Math.sin(robotState.tower_swing+robotState.elbow_rotation+robotState.wrist_rotation+robotState.o_swing)).toFixed(3)  }</p>
              <p>Z: {parseFloat(robotState.tower_lift).toFixed(3) }</p>
              <p>Pose (deg): {(parseFloat(robotState.tower_swing + robotState.elbow_rotation + robotState.wrist_rotation) * (180 / Math.PI)).toFixed(3) }</p>
            </td>
          </tr>
        </table>
        </div>
    </div>
  );
}

export default RobotState;