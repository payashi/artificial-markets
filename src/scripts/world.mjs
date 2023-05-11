import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import pams from './pams.mjs';
import timer from './timer.mjs';

import { AgentGroup } from './group.mjs';

// Configurations
const kCameraOmega = 0.1;
const kCameraRadius = 20;

const kMarketOmega = 0.05;
const kNumAgents = 500;

// Global variables
let camera, scene, renderer, labelRenderer;

const markets = new THREE.Group();
const agents = new THREE.Group();
const lines = new THREE.Group();


init();
animate();

function init() {
  // Add renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  document.body.appendChild(labelRenderer.domElement);

  // Add scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 500);

  // Add markets
  const marketIndex = new THREE.Mesh(
    new THREE.OctahedronGeometry(4),
    new THREE.MeshNormalMaterial(),
  );

  const marketOne = new THREE.Mesh(
    new THREE.DodecahedronGeometry(6),
    new THREE.MeshNormalMaterial(),
  );

  const marketTwo = new THREE.Mesh(
    new THREE.DodecahedronGeometry(6),
    new THREE.MeshNormalMaterial(),
  );

  marketOne.userData.axis = new THREE.Vector3(-1, 0, 0);
  marketTwo.userData.axis = new THREE.Vector3(-1, 0, 0);
  marketIndex.userData.axis = new THREE.Vector3(-1, 0, 0);

  marketOne.position.set(24, 0, 0);
  marketTwo.position.set(-24, 0, 0);

  // Create groups around each market
  const agentsOne = new AgentGroup('one', marketOne, kNumAgents, { geometry: new THREE.DodecahedronGeometry(0.5) });
  const agentsTwo = new AgentGroup('two', marketTwo, kNumAgents, { geometry: new THREE.DodecahedronGeometry(0.5) });
  const agentsIndex = new AgentGroup('index', marketIndex, kNumAgents, { radius: 6, geometry: new THREE.OctahedronGeometry(0.5) });
  const arbitrators = new AgentGroup('arbitrators', marketIndex, kNumAgents, { radius: 12, mode: 'ring' });

  // Add labels to the markets
  agentsIndex.addLabel('Index Market', 'index');
  agentsOne.addLabel('Market 01', 'one');
  agentsTwo.addLabel('Market 02', 'two');

  // The order of the following elements corresponds to the order in PAMS
  markets.add(marketOne, marketTwo, marketIndex);
  agents.add(agentsOne, agentsTwo, agentsIndex, arbitrators);

  for (let i = 0; i < markets.children.length; i++) {
    const buyLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 1 })
    );
    const sellLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x428af5, linewidth: 1 })
    );
    lines.add(buyLine);
    lines.add(sellLine);
  }

  scene.add(agents, markets, lines);
}


// Animation loop
async function animate() {
  requestAnimationFrame(animate);

  const time = timer.time();
  const pamsTime = Math.round(time * 10) % (await pams.duration());

  // Set up the camera
  camera.position.set(
    kCameraRadius * Math.cos(kCameraOmega * time),
    kCameraRadius * Math.sin(kCameraOmega * time),
    30,
  );

  camera.lookAt(0, 0, 0);

  // Rotate the agents
  agents.children.forEach(group => {
    group.update(time);
  });

  // Rotate the markets
  markets.children.forEach(market => {
    market.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationAxis(
      market.userData.axis, time * kMarketOmega,
    ));
  })


  const trades = (await pams.trades())[pamsTime];

  // for (const mid in trades) {
  //   const mtrades = trades[mid];
  //   const startPoint = markets.children[mid].position;

  //   const points = mtrades[1].map((trade) => {
  //     const gid = trade[0];
  //     const aid = trade[1];
  //     const group = agents.children[gid];
  //     const endPoint = new THREE.Vector3().addVectors(
  //       agents.children[gid].position,
  //       group.children[aid].position,
  //     );
  //     return [
  //       startPoint, endPoint,
  //     ];
  //   }).flat();
  //   lines.children[2 * mid + 1].geometry.setFromPoints(points);
  // }

  // Draw a line indicating a buy/sell transaction
  trades.forEach((mtrades, mid) => {
    const startPoint = markets.children[mid].position;

    // 0: buy, 1: sell
    for (let i = 0; i < 2; i++) {
      const points = mtrades[i].map((trade) => {
        const gid = trade[0];
        const aid = trade[1];
        const group = agents.children[gid];
        const endPoint = new THREE.Vector3().addVectors(
          agents.children[gid].position,
          group.children[aid].position,
        );
        return [startPoint, endPoint];
      }).flat();
      lines.children[2 * mid + i].geometry.setFromPoints(points);
    }
  });

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

