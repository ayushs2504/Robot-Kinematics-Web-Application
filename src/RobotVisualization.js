import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const rpms_template = require('./robot_parameters.json');

function RobotRenderer() {
  const [robotState, setRobotState] = useState({
    tower_lift: 0,
    tower_swing: 0,
    elbow_rotation: 0,
    wrist_rotation: 0, 
    ox: 0,
    oy: 0,
    oz: 0,
    o_swing: 0,
    cmd_ox: 0,
    cmd_oy: 0,
    cmd_oz: 0,
    cmd_o_swing: 0,
  });

  const [rpms, setRpms] = useState(rpms_template);

  const scene = useRef();
  const camera = useRef();
  const renderer = useRef();
  const link1 = useRef();
  const link2 = useRef();
  const link3 = useRef();
  const link4 = useRef();
  const link5 = useRef();
  const controls = useRef();
  const axisX = useRef();
  const axisY = useRef();
  const axisZ = useRef();
  const stn_axisX = useRef();
  const stn_axisY = useRef();
  const stn_axisZ = useRef();

  useEffect(() => {
    fetch('http://localhost:5000/robot-parameters')
      .then(response => response.json())
      .then(data => {
        setRpms(data);
      })
      .catch(error => {
        console.error('Error fetching robot parameters:', error);
      });
  }, []);

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

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!scene.current || !camera.current || !renderer.current || !link1.current || !link2.current || !link3.current || !link4.current || !link5.current) return;

    const renderScene = () => {

      link1.current.position.z = (robotState.ox);
      link1.current.position.y = rpms.tower[0].tower_height/2 + (robotState.oz); 
      link1.current.position.x = (robotState.oy);

      link2.current.position.y = robotState.tower_lift;
      link1.current.rotation.y = robotState.tower_swing + robotState.o_swing;
      link3.current.rotation.y = robotState.elbow_rotation;
      link4.current.rotation.y = robotState.wrist_rotation;

      axisX.current.position.z = (robotState.cmd_ox);
      axisX.current.position.y = (robotState.cmd_oz); 
      axisX.current.position.x = (robotState.cmd_oy);
      axisX.current.rotation.z = -(robotState.cmd_o_swing);
      
      renderer.current.render(scene.current, camera.current);
    };

    const renderLoop = () => {
      renderScene();
      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }, [robotState,rpms]);

  useEffect(() => {
    scene.current = new THREE.Scene();
    camera.current = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer.current = new THREE.WebGLRenderer();
    renderer.current.setSize(500, 500); 
    renderer.current.setClearColor(0x87ceeb); 
    controls.current = new OrbitControls(camera.current, renderer.current.domElement);

    // The axes that move with the tower base
    axisX.current = new THREE.Mesh( new THREE.CylinderGeometry(1, 1, 20), // radius,height,length
                                    new THREE.MeshBasicMaterial({ color: 0x008000 }) // Green - X
                                  );
    axisX.current.rotation.set(Math.PI / 2, 0, 0);
    scene.current.add(axisX.current);

    axisY.current = new THREE.Mesh( new THREE.CylinderGeometry(1, 1, 20), 
                                    new THREE.MeshBasicMaterial({ color: 0xff0000 }) // Red - Y
                                  );
    axisY.current.rotation.set(0, 0, Math.PI / 2);
    axisX.current.add(axisY.current);

    axisZ.current = new THREE.Mesh( new THREE.CylinderGeometry(1, 1, 10),
                                    new THREE.MeshBasicMaterial({ color: 0x0012ff }) // Purple - Z
                                  );
    axisZ.current.rotation.set(Math.PI / 2, 0, 0);
    axisX.current.add(axisZ.current);

    // The axes that do not move with the tower base but represent the commanded origin
    stn_axisX.current = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 30), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    stn_axisX.current.rotation.set(Math.PI / 2, 0, 0);
    scene.current.add(stn_axisX.current);
    stn_axisY.current = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 30),new THREE.MeshBasicMaterial({ color: 0x000000 }));
    stn_axisY.current.rotation.set(0, 0, Math.PI / 2);
    stn_axisX.current.add(stn_axisY.current);
    stn_axisZ.current = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 20),new THREE.MeshBasicMaterial({ color: 0x000000 }));
    stn_axisZ.current.rotation.set(Math.PI / 2, 0, 0);
    stn_axisX.current.add(stn_axisZ.current);

    // Create first link (tower)
    link1.current = new THREE.Mesh(new THREE.BoxGeometry(1, rpms.tower[0].tower_height, 1), new THREE.MeshBasicMaterial({ color: 0xdaf8e3 }));
    link1.current.position.y = rpms.tower[0].tower_height/2;
    scene.current.add(link1.current);

    // Create second link (tower arm / shoulder)
    link2.current = new THREE.Mesh(new THREE.BoxGeometry(rpms.tower[0].tower_arm_width, rpms.tower[0].tower_arm_height, rpms.tower[0].tower_arm_length), new THREE.MeshBasicMaterial({ color: 0x97ebdb }));
    link2.current.position.z = rpms.tower[0].tower_arm_length/2 + 0.5;
    link2.current.position.y = 0;
    link1.current.add(link2.current); // Add as a child of the first link

    // Create third link (forearm)
    link3.current = new THREE.Mesh(new THREE.BoxGeometry(rpms.forearm[0].forearm_width, rpms.forearm[0].forearm_height, 2*rpms.forearm[0].forearm_length), new THREE.MeshBasicMaterial({ color: 0x00c2c7 }));
    link3.current.position.z = (rpms.tower[0].tower_arm_length/2);
    link3.current.position.y = -(rpms.tower[0].tower_arm_height + rpms.forearm[0].forearm_height)/2;
    link2.current.add(link3.current); 

    // Create fourth link (wrist)
    link4.current = new THREE.Mesh(new THREE.BoxGeometry(rpms.wrist[0].wrist_width, rpms.wrist[0].wrist_height, 2*rpms.wrist[0].wrist_length), new THREE.MeshBasicMaterial({ color: 0x0086ad }));
    link4.current.position.z = rpms.forearm[0].forearm_length; 
    link4.current.position.y = -(rpms.forearm[0].forearm_height + rpms.wrist[0].wrist_height)/2; 
    link3.current.add(link4.current); 

    // Create fifth link (effector)
    link5.current = new THREE.Mesh(new THREE.BoxGeometry(rpms.end_effector[0].end_effector_width, rpms.end_effector[0].end_effector_height, rpms.end_effector[0].end_effector_length), new THREE.MeshBasicMaterial({ color: 0x005582 }));
    link5.current.position.z = rpms.wrist[0].wrist_length - rpms.end_effector[0].end_effector_length/2; 
    link5.current.position.y = -(rpms.wrist[0].wrist_height + rpms.end_effector[0].end_effector_height)/2; 
    link4.current.add(link5.current); 

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.position.y = 0;
    groundMesh.rotation.x = Math.PI / 2;
    scene.current.add(groundMesh);

    camera.current.position.z = 250;
    camera.current.position.y = 100;
    camera.current.lookAt(0, 0, 0);

    const container = document.getElementById("container");
    container.innerHTML = ''; 
    container.appendChild(renderer.current.domElement);

    return () => {
      renderer.current.dispose();
      scene.current.remove(axisX.current);
      scene.current.remove(axisY.current);
      scene.current.remove(axisZ.current);
      scene.current.remove(link1.current);
      scene.current.remove(link2.current);
      scene.current.remove(link3.current);
      scene.current.remove(link4.current);
      scene.current.remove(link5.current);
      scene.current.remove(groundMesh);
    };
  }, [rpms]);

  return (
    <div id="container"></div>
  );
}

export default RobotRenderer;