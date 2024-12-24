const express = require('express');
const cors = require('cors'); 
const WebSocket = require('ws');
const rpms = require('./robot_parameters.json');
const path = require('path');
const app = express();
const port = 5000; 
app.use(express.json());
app.use(cors());
app.use(express.static(path.join('/robot_parameters.json','public'))); // JSON file storing the robot configuration
const wss = new WebSocket.Server({ port: 7004 });
var updateInProgress = false; // Flag for robot state updates
var originInProgress = false; // Flag for robot origin updates
var currentUpdateTimeout;

var robot_state = {
    'tower_lift':0, 
    'tower_swing':0, 
    'elbow_rotation':0, 
    'wrist_rotation':0,
    'ox': 0, // tower origin X coordinate
    'oy': 0, // tower origin Y coordinate
    'oz': 0, // tower origin Z coordinate
    'o_swing': 0, // tower origin rotation about Z axis
    'cmd_ox': 0, // commanded origin X coordinate
    'cmd_oy': 0, // commanded origin  Y coordinate
    'cmd_oz': 0, // commanded origin Z coordinate
    'cmd_o_swing': 0 // commanded origin rotation about Z axis
};

// Websocket setup
wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify(robot_state));
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});

// Function to update robot states during forward kinematics/inverse kinematics
function updaterobotState(newState,res) {

    if (!updateInProgress) { // Check if update is not already in progress
        
        function updateStates() { 
            if ( Math.abs(robot_state.tower_lift - newState.tower_lift) > 0.001 || // Check if update is needed
                 Math.abs(robot_state.tower_swing - newState.tower_swing) > 0.001 ||
                 Math.abs(robot_state.elbow_rotation - newState.elbow_rotation) > 0.001 ||
                 Math.abs(robot_state.wrist_rotation - newState.wrist_rotation) > 0.001) {
                
                updateInProgress = true; // Set flag to indicate update is in progress

                // Forward Euler discretized, kinematic, proportional control for the states: x(k+1) = x(k) + x_dot * dt 
                robot_state.tower_lift += ((newState.tower_lift - robot_state.tower_lift) / 2.5) * 0.1;
                robot_state.tower_swing += ((newState.tower_swing - robot_state.tower_swing) / 2.5) * 0.1;
                robot_state.elbow_rotation += ((newState.elbow_rotation - robot_state.elbow_rotation) / 2.5) * 0.1;
                robot_state.wrist_rotation += ((newState.wrist_rotation - robot_state.wrist_rotation) / 2.5) * 0.1;

                wss.clients.forEach(client => { // Communicate changes over the websocket
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(robot_state));
                    }
                });
                currentUpdateTimeout = setTimeout(updateStates, 100); // Recursive call to function till targeted states are achieved

            } else {
                updateInProgress = false; // Reset flag when update is completed
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(robot_state));
                    }
                });
            }
        };
        updateStates();
        res.json({ message: 'Update request received' });
    }

    else {
        res.status(400).json({ message: 'Previous update canceled. Post a new request' });
        clearTimeout(currentUpdateTimeout); // Cancel the current update process
        updateInProgress = false;
    }
}

// Function to change the robot origin and regulate end effector position (if possible)
function updateOrigin(current_eff_x,current_eff_y,current_eff_z,current_eff_pose,data,res) {

    if (!originInProgress) {

        function originUpdate() {
            if ( Math.abs(robot_state.ox - data.ox) > 0.001 ||
                Math.abs(robot_state.oy - data.oy) > 0.001 ||
                Math.abs(robot_state.oz - data.oz) > 0.001 ||
                Math.abs(robot_state.o_swing - data.o_swing) > 0.001) {

                originInProgress = true;
                robot_state.ox += ((data.ox - robot_state.ox) / 2.5) * 0.1;
                robot_state.oy += ((data.oy - robot_state.oy) / 2.5) * 0.1;
                robot_state.oz += ((data.oz - robot_state.oz) / 2.5) * 0.1;
                robot_state.o_swing += ((data.o_swing - robot_state.o_swing) / 2.5) * 0.1;

                track_x = current_eff_x - robot_state.ox; // Tracking error
                track_y = current_eff_y - robot_state.oy;
                track_z = current_eff_z - robot_state.oz;

                robot_state.tower_lift += ((track_z - robot_state.tower_lift) / 1.5) * 0.1; 

                theta = invkinematics(track_x,track_y,current_eff_pose);

                if (theta.valid) { // If the previous EE position is still in the new workspace, move the EE to that location, otherwise let the robot move

                    robot_state.tower_swing += ((theta.th1 - robot_state.tower_swing) / 1.5) * 0.1;
                    robot_state.elbow_rotation += ((theta.th2 - robot_state.elbow_rotation) / 1.5) * 0.1;
                    robot_state.wrist_rotation += ((theta.th3 - robot_state.wrist_rotation) / 1.5) * 0.1;

                }

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(robot_state));
                    }
                });
                currentUpdateTimeout = setTimeout(originUpdate, 100); 

            } else {
                originInProgress = false; 
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(robot_state));
                    }
                });
            }
        }
        originUpdate();
        res.json({ message: 'Update request received' });

    } else {
        res.status(400).json({ message: 'Previous update canceled. Post a new request. Note that the robot will track the current end effector position.' });
        clearTimeout(currentUpdateTimeout);
        originInProgress = false;
    }
}

// Inverse kinematics calculator
function invkinematics(x_tgt, y_tgt, pose_tgt) {

    l12 = rpms.tower[0].tower_arm_length;
    l23 = rpms.forearm[0].forearm_length;
    l34 = rpms.wrist[0].wrist_length;
    x3 = x_tgt - (l34 * Math.cos(pose_tgt));
    y3 = y_tgt - (l34 * Math.sin(pose_tgt));
    c = Math.sqrt(x3**2 + y3**2);

    if ((l12 + l23) > c) {

        a = Math.acos((l12**2 + l23**2 - c**2 )/(2*l12*l23));
        b = Math.acos((l12**2 + c**2 - l23**2 )/(2*l12*c));
        th1a = Math.atan2(y3, x3) - b;
        th2a = Math.PI - a;
        th3a = pose_tgt - th1a - th2a;
        th1b = Math.atan2(y3, x3) + b;
        th2b = -(Math.PI - a);
        th3b = pose_tgt - th1b - th2b;
        valid = true;
    }   else {

        th1a = null;
        th2a = null;
        th3a = null;
        th1b = null;
        th2b = null;
        th3b = null;
        valid = false;
    }

    return { th1: th1a, 
             th2: th2a, 
             th3: th3a,
             valid: valid }
}

// Forward kinematics handler
app.post('/update_robot_state', (req, res) => {
    const requestBody = req.body;
    console.log(requestBody);
    updaterobotState(requestBody, res);
});

// Inverse kinematics handler
app.post('/inverse_kinematics', (req, res) => {
    const data = req.body;
    console.log(data);

    z_tgt = data.z;
    theta = invkinematics(data.x,data.y,data.pose);

    if (theta.valid) {

        const newState = {
            tower_lift: z_tgt,
            tower_swing: theta.th1,
            elbow_rotation: theta.th2, 
            wrist_rotation: theta.th3 
        };

        updaterobotState(newState, res);

    } else {  
        res.status(400).json({ message: 'Dimension error! Request point not in workspace' });
    }
});

app.post('/origin_update', (req, res) => {
    const data = req.body;
    console.log(data);
    
    // Calculate the current EE position so that it may be tracked by the kinematic controller
    current_eff_x = robot_state.ox + rpms.tower[0].tower_arm_length*Math.cos(robot_state.tower_swing+robot_state.o_swing)
                                   + rpms.forearm[0].forearm_length*Math.cos(robot_state.tower_swing+robot_state.elbow_rotation+robot_state.o_swing)
                                   + rpms.wrist[0].wrist_length*Math.cos(robot_state.tower_swing+robot_state.elbow_rotation+robot_state.wrist_rotation+robot_state.o_swing);
    current_eff_y = robot_state.oy + rpms.tower[0].tower_arm_length*Math.sin(robot_state.tower_swing+robot_state.o_swing)
                                   + rpms.forearm[0].forearm_length*Math.sin(robot_state.tower_swing+robot_state.elbow_rotation+robot_state.o_swing)
                                   + rpms.wrist[0].wrist_length*Math.sin(robot_state.tower_swing+robot_state.elbow_rotation+robot_state.wrist_rotation+robot_state.o_swing);
    current_eff_z = robot_state.tower_lift + robot_state.oz;
    current_eff_pose = robot_state.tower_swing+robot_state.elbow_rotation+robot_state.wrist_rotation+robot_state.o_swing;

    robot_state.cmd_ox = data.ox;
    robot_state.cmd_oy = data.oy;
    robot_state.cmd_oz = data.oz;
    robot_state.cmd_o_swing = data.o_swing;
    updateOrigin(current_eff_x,current_eff_y,current_eff_z,current_eff_pose,data,res);
});

// Send the JSON file to the front end for rendering
app.get('/robot-parameters', (req, res) => {
    const robotParameters = require('./robot_parameters.json');
    res.json(robotParameters);
  });

// Starting the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});