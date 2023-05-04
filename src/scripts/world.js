import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import pams from './pams';
import timer from './timer';

import { AgentGroup } from './group';

// Configurations
const kCameraOmega = 0.1;
const kCameraRadius = 20;

const kMarketOmega = 0.05;
const kNumAgents = 500;

// Global variables
let camera, scene, renderer, labelRenderer;

let markets = [];
let groups = [];


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
    new THREE.DodecahedronGeometry(8),
    new THREE.MeshNormalMaterial(),
  );

  const marketTwo = new THREE.Mesh(
    new THREE.DodecahedronGeometry(8),
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

  scene.add(
    agentsIndex.group,
    agentsOne.group,
    agentsTwo.group,
    arbitrators.group,
    marketOne,
    marketTwo,
    marketIndex,
  );


  // Add labels to the markets
  agentsIndex.addLabel('Index Market');
  agentsOne.addLabel('Market 01');
  agentsTwo.addLabel('Market 02');

  // The order of the following elements corresponds to the order in PAMS
  markets = [marketOne, marketTwo, marketIndex];
  groups = [agentsOne, agentsTwo, agentsIndex, arbitrators];
}


// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const time = timer.time();
  const pamsTime = Math.round(time * 10) % pams.data().duration;

  // Set up the camera
  camera.position.set(
    kCameraRadius * Math.cos(kCameraOmega * time),
    kCameraRadius * Math.sin(kCameraOmega * time),
    30,
  );

  camera.lookAt(0, 0, 0);

  // Rotate the agents
  groups.forEach(group => {
    group.update(time);
  });

  // Rotate the markets
  markets.forEach(market => {
    market.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationAxis(
      market.userData.axis, time * kMarketOmega,
    ));
  })

  // Draw a line indicating a buy/sell transaction
  // pams.data().trades[pamsTime].forEach(order => {
  //   const groupId = Math.floor(order.agent_id / kNumAgents);
  //   const agentId = Math.floor(order.agent_id) % kNumAgents;

  //   try {
  //     const agentGroup = groups[groupId].children[agentId];
  //     const line = agentGroup.children[1 + order.is_buy];

  //     const market = markets[order.market_id];
  //     let marketPos = new THREE.Vector3();
  //     market.getWorldPosition(marketPos);

  //     // TODO: Aggeregate line objects to single line per group to accelerate rendering
  //     line.geometry.setFromPoints([
  //       agentGroup.children[0].position,
  //       line.worldToLocal(marketPos),
  //     ]);

  //     line.visible = true;

  //     // The setTimeout function eliminates the need to make all lines invisible at every frame,
  //     // reducing the load on the drawing process.
  //     setTimeout(() => {
  //       line.visible = false;
  //     }, 30);

  //   } catch (error) {
  //     console.log(`@${pamsTime} g${groupId}:${agentId}`);
  //     console.log(groups[groupId].children.length);
  //   }
  // });

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

}
