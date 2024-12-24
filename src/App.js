import React from 'react';
import RobotState from './RobotState';
import ForwardKinematics from './ForwardKinematics';
import InverseKinematics from './InverseKinematics';
import RobotRenderer from './RobotVisualization';
import OriginChange from './OriginChange';

function App() {
  return (
    <div> 
      <table>
        <tr>
          <td>
            <RobotState />
          </td>
          <td><RobotRenderer /></td>
          <td><ForwardKinematics />
            <InverseKinematics />
            <OriginChange /></td>
          
        </tr>
      </table>
    </div>
  );
}

export default App;