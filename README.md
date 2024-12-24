# Robot-Kinematics-Web-Application
This repository provides code (Javascript, backend on Node, frontend on React) for simulating the kinematics of a SCARA over a web application. The backend stores the robot states and performs the kinematic calculations, while the front end provides a visualization of the robot state and offers tools to interact with or command the robot.

# Getting Started with the Application(s)

This project has been written on Javascript, both for backend and frontend. The backend utilizes Node, while the frontend utilizes React and Three.js. 
To get started, run `npm install` in the parent directory and in `./Node_Backend` to install the necessary node modules.
To start the backend, navigate to `./Node_Backend` and execute `node app.js` on the terminal. You should receive the message `Server is running on http://localhost:5000`.
To start the frontend, execute `npm start` on the terminal in the parent directory. The web application should launch after a few seconds of delay.

# Frontend Application Description

1. On the left hand side, you will see the following information:
    - Robot States describes the different states of the robot - the elevation of arm on the tower (Tower Lift) and the rotation angle of the tower, elbow, and wrist - in the tower frame of reference (the location of the tower origin does not affect these state values). Note that the gripper on/off state has been excluded at the moment.
    - The table beneath this information presents three additional pieces of information:
        - The XYZ location and rotation of the robot origin.
        - The XYZ coordinates and pose of the end-effector (gripper) in the absolute/world reference frame.
        - The XYZ coordinates and pose of the end-effector (gripper) in the tower reference frame.
    - This information updates in real time as the robot links/origin moves, as a websocket has been used to communicate to/with the backend.
2. At the center you will see the visualization of the robot rendered at the frontend using Three.js. You can hold the mouse left click and orbit around the scene. You can also zoom using the middle mouse button. To pan, hold the right click and move the mouse. Two sets of origin axes also appear at the tower base. The coordinate system is setup in a way such that the tower is along the Z-axis, and when all the joint angles are 0 the robot arm is aligned with X-axis. Using the right-hand-thumb rule, the Y-axis will appear to the 'left' of the robot arm.
3. On the right hand side, you will see the following three interfaces:
    - Forward kinematics: allows you to command the robot states in the tower reference frame. Note that pressing the submit button while the states are updating will cancel the previous request, and you need to press the submit button again. 
    - Inverse kinematics: allows you to command an end-effector (gripper) position and pose in the tower reference frame. Pressing the submit button will commence robot motion to position the end-effector at the commanded point. But if the point is unreachable, you will receive an error. Posting new (reachable) coordinates will cancel the previous execution and you will need to press the submit button again.
    - Origin control: allows you to specify an origin and orientation for the robot. Posting the coordinates and orientation will cause the robot to travel to the new origin and rotate. In the meantime, the robot will try to retain the absolute position of the end-effector where it previously was before pressing the submit command. If the positioning becomes infeasible at some point, the robot will disable the tracking control.
    - Note that blank inputs are treated as an input of '0'. So any input that is left as blank will be interpreted as that input value being set to zero when you press the submit button.

# Backend Description

1. The robot geometric parameters are stored in the `robot_parameters.json` file in `/Node_Backend/`. These parameters are used for kinematic calculations at the backend, and are also parsed to the frontend for visualization. You will also see a similar file in the `src`, but that is for parsing structure, not the values.
2. The forward kinematics, inverse kinematics, and origin control all use a simple kinematic proportional controller for controlling the robot motion. That is, the position/rotation of the links are updated using a velocity input that in turn is calculated based on the position/rotation error. A dynamic state-space model with masses and moment of inertias can also be used and would be more accurate, but a kinematic model has been used for simplicity.
3. The equations of motion have been sampled at 10 Hz.

Note that the motion of the robot is entirely unconstrained at the moment, meaning that you can position the robot (or its origin) to any height and rotate the links to any angle. There are also no limits to the actuation velocity, meaning the larger the position/rotation error, the faster will the robot move/rotate. These limits have been excluded solely for simplicity, but can be easily added as a next step. The limits themselves can be stored in the accompanying JSON file.

# Other technical details

-  If the origin sensor is noisy or has some jitter, at least in the setup that I have created, may mislead the control algorithm into believing that the end-effector is moving while it is not. This can be taken care of with some post-processing filtering, though that may induce a delay of a few samples. If the sensor has significant transport lag the controller actuation would have to made slow enough such that the robot does not keep moving around excessively. 

# Side Notes

- This repository has been forked from an old private repository of mine, with the aim to make my code open source and allow further improvements.
- This project was my first attempt at web development. Consequently, some of my choices may not be fully rational. Additionally, I have kept the frontend UI complexity to a minimum, partly due to simplicity but also because of my limited familiarity with UI design.
