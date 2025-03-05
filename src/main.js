import * as THREE from "three";
import {
  RGBELoader
} from 'three/examples/jsm/loaders/RGBELoader.js';
import Stats from "three/examples/jsm/libs/stats.module";
import {
  OrbitControls
} from "three/addons/controls/OrbitControls.js";
import {
  EffectComposer
} from "three/addons/postprocessing/EffectComposer.js";
import {
  RenderPass
} from "three/addons/postprocessing/RenderPass.js";
import {
  FXAAShader
} from "three/addons/shaders/FXAAShader.js";
import {
  UnrealBloomPass
} from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  OutputPass
} from "three/addons/postprocessing/OutputPass.js";
import {
  ShaderPass
} from "three/addons/postprocessing/ShaderPass.js";
import {
  GLTFExporter
} from "three/addons/exporters/GLTFExporter.js";
import {
  Tree,
  LeafStyle,
  LeafType
} from "./tree";


const urlParams = new URLSearchParams(window.location.search);
let iteration = urlParams.get('iteration');

let clock = new THREE.Clock();
// Instantiate a exporter
const exporter = new GLTFExporter();

const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Charger et appliquer HDRI
const loader = new RGBELoader();
loader.load('./assets/bg-void.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularRefractionMapping;
  scene.environment = texture; // Appliquer l'HDRI comme environnement
  scene.background = texture; // Optionnel, pour avoir un fond HDRI
});

loader.load('./assets/bg-hdri.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularRefractionMapping;
  scene.environment = texture;
  scene.background = texture;

  // Ajuster l'intensité de l'éclairage
  scene.environment.intensity = 0; // Ajuster cette valeur en fonction de la luminosité de l'HDRI
});


// ---- CAMERA/LIGHTING -------

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight();
sunlight.intensity = 1;
sunlight.position.set(50, 50, 50);
sunlight.castShadow = true;
scene.add(sunlight);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.intensity = 50000;
spotLight.position.set(50, 80, 40);
spotLight.distance = 150;
spotLight.castShadow = true;
spotLight.shadow.camera.left = -30;
spotLight.shadow.camera.right = 30;
spotLight.shadow.camera.top = 30;
spotLight.shadow.camera.bottom = -30;
spotLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
scene.add(spotLight);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 20, 0);
camera.position.set(70, 20, 0);


// ---- POST-PROCESSING -------

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.2,
  0,
  0.2
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

const pixelRatio = renderer.getPixelRatio();
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms["resolution"].value.x =
  1 / (renderer.domElement.offsetWidth * pixelRatio);
fxaaPass.material.uniforms["resolution"].value.y =
  1 / (renderer.domElement.offsetHeight * pixelRatio);
composer.addPass(fxaaPass);


let lastTreeUpdateTime = Date.now();

// ----- TREE -----------

const treeParams = {
  seed: 0,
  maturity: 0,
  animateGrowth: false,

  trunk: {
    color: "", // Color of the tree trunk
    flatShading: false, // Use face normals for shading instead of vertex normals
    textured: true, // Apply texture to bark
    length: 20, // Length of the trunk
    radius: 3.5, // Starting radius of the trunk
    flare: 1.0, // Multipler for base of trunk
  },

  branch: {
    levels: 4, // Number of branch recursions ( Keep under 5 )
    start: 0.6, // Defines where child branches start forming on the parent branch. A value of 0.6 means the
    // child branches can start forming 60% of the way up the parent branch
    stop: 0.95, // Defines where child branches stop forming on the parent branch. A value of 0.9 means the
    // child branches stop forming 90% of the way up the parent branch
    sweepAngle: 2, // Max sweep of the branches (radians)
    minChildren: 3, // Minimum number of child branches
    maxChildren: 4, // Maximum number of child branches
    lengthVariance: 0.2, // % variance in branch length
    lengthMultiplier: 0.7, // Length of child branch relative to parent
    radiusMultiplier: 0.9, // Radius of child branch relative to parent
    taper: 0.7, // Radius of end of branch relative to the start of the branch
    gnarliness: 0.2, // Max amplitude of random angle added to each section's orientation
    gnarliness1_R: 0.05, // Same as above, but inversely proportional to the branch radius
    // The two terms can be used to balance gnarliness of trunk vs. branches
    twist: 0.0,
  },

  geometry: {
    sections: 6, // Number of sections that make up this branch
    segments: 10, // Number of faces around the circumference of the branch
    lengthVariance: 0.1, // % variance in the nominal section length
    radiusVariance: 0.1, // % variance in the nominal section radius
    randomization: 0.1, // Randomization factor applied to vertices
  },

  leaves: {
    style: 1,
    type: 1,
    minCount: 5,
    maxCount: 7,
    size: 2,
    sizeVariance: 0,
    color: new THREE.Color().setHSL("", "", ""),
    emissive: 0.02,
    opacity: 1,
    alphaTest: 0.5,
  },

  sun: {
    direction: new THREE.Vector3(0, 1, 0),
    strength: 0.02,
  },
};

const tree = new Tree(treeParams);
tree.castShadow = true;
tree.receiveShadow = true;
scene.add(tree);


// --- RENDU PRINCIPAL ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();

  if (treeParams.animateGrowth) {
    const dt = clock.getDelta();
    tree.params.maturity = Math.min(1, tree.params.maturity + 0.2 * dt);
    tree.generate();
  }

  let currentTime = Date.now(); // Get current time
  let deltaTime = currentTime - lastTreeUpdateTime; // Calculate delta time (in milliseconds)

  if (deltaTime > 50) {
    updateTree();
    lastTreeUpdateTime = currentTime;
  }

  // Rendu principal
  composer.render();
}

// Evénement de redimensionnement pour ajuster la caméra et le rendu
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// Configuration WebSocket
let webSocketConnected = false;
let socketPort = 8080;

let oscSocket = new osc.WebSocketPort({
  url: "ws://localhost:" + socketPort,
  metadata: true,
});

// ON WEBSOCKET OPEN AND READY
oscSocket.on("ready", function (msg) {
  console.log("WebSocket Opened on Port " + socketPort + "/tree-js/");
  webSocketConnected = true;
});


// Track whether the encoder is moving


let hue = 0; // Cible vers laquelle on

let saturation = 0;
let light = 0;

let lerpSpeed = 0; // Plus lent si la différence est importante

function lerp(a, b, t) {
  return a + (b - a) * t;
}

let growth = 0;
let targetGrowth = 0;

let lastArgumentSat = 0;
let lastArgumentLight = 0;
let lastArgumentEncoder = 0;
let lastArgumentOne = 0;
let lastArgumentTwo = 0;
let lastArgumentThree = 0;
let lastArgumentGrow = 0;
let lastArgumentReset = 0;
let lastArgumentBloom = 0;



function updateTreeSmooth() {
  // Limiter la vitesse de croissance de l'arbre
  growth = lerp(growth, targetGrowth, lerpSpeed);

  // Appliquer la maturité à la génération de l'arbre
  treeParams.maturity = Math.min(1, Math.max(0, growth));

  if (Math.abs(growth - treeParams.maturity) > 0.01) {
    // Mettre à jour l'arbre
    tree.generate();

  }

  requestAnimationFrame(updateTreeSmooth);
}

let isDying = false;  // Variable pour savoir si la fonction die est déjà en cours d'exécution
let isGrowing = false; // Variable pour savoir si la fonction grow est en cours d'exécution


function grow() {
  
  isGrowing = true; // Marquer que grow est en cours
  isDying = false;
  targetGrowth = 1;
  lerpSpeed += 0.00001;
  updateTreeSmooth();

  console.log("growing");

  setTimeout(function () {
    isDying = true;
    isGrowing = false;
    die();
  }, 10000);
}

function die() {
    setInterval(function () {
      if (isDying) {
      lerpSpeed = 0;
      growth -= 0.0001;
      targetGrowth = 0;
      updateTreeSmooth();
      console.log("dying");

      if (growth <= 0) {
        console.log("dead");
        isDying = false; // Réinitialiser isDying une fois que l'on est "mort"
      }
    }
    }, 50); // 50 millisecondes = 0.05 secondes
  
}


oscSocket.on("message", function (msg) {
  let address = msg.address;

  if (address.startsWith("/sliderOne" + iteration)) {

    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));

    treeParams.leaves.sizeVariance = roundedValue / 3;
    // On suppose que la valeur du slider est entre 0 et 1
    treeParams.leaves.emissive = roundedValue / 3;
    treeParams.sun.strength = roundedValue / 30;

  }
  if (address.startsWith("/sliderTwo" + iteration)) {
    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));
    treeParams.branch.lengthVariance = roundedValue / 8.23;
    treeParams.geometry.lengthVariance = roundedValue / 5;
  }
  if (address.startsWith("/sliderThree" + iteration)) {
    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));
    treeParams.trunk.flare = roundedValue;
    treeParams.branch.twist = roundedValue;
    treeParams.branch.taper = 0.5 + roundedValue / 6;
  }

  if (address.startsWith("/sliderSat" + iteration)) {

    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));

    treeParams.leaves.sizeVariance = roundedValue * 2;
    treeParams.branch.lengthVariance = roundedValue / 3;
    treeParams.branch.taper = 0.5 + roundedValue / 6;

    // Check if the value has changed (encoder is moving)
    if (roundedValue - lastArgumentSat >= 0.1 || roundedValue - lastArgumentSat <= -0.1) {
      targetGrowth = 1;
      lastArgumentSat = roundedValue;

      grow();
    }
  }

  if (address.startsWith("/sliderLight" + iteration)) {

    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));


    treeParams.branch.twist = roundedValue / 10;
    treeParams.sun.strength = roundedValue / 50;
    treeParams.geometry.lengthVariance = roundedValue / 10;

    // Check if the value has changed (encoder is moving)
    if (roundedValue - lastArgumentLight >= 0.1 || roundedValue - lastArgumentLight <= -0.1) {
      targetGrowth = 1;
      lastArgumentLight = roundedValue;

      grow();
    }
  }
  if (address.startsWith("/encoder" + iteration)) {
    let firstArgumentValue = msg.args[0].value;

    // Check if the value has changed (encoder is moving)
    if (firstArgumentValue != lastArgumentEncoder) {
      targetGrowth = 1;
      grow();


      if (firstArgumentValue === 1) {
        treeParams.geometry.randomization += 0.1;
        treeParams.trunk.length += 0.1;
        treeParams.branch.gnarliness += 0.01;
      } else if (roundedValue === -1) {
        treeParams.geometry.randomization -= 0.1;
        treeParams.trunk.length -= 0.1;
        treeParams.branch.gnarliness -= 0.01;
      }

      lastArgumentEncoder = firstArgumentValue;
    }

  }

  /*
    if (address.startsWith("/sliderGrow")) {
      let roundedValue = msg.args[0].value;
      lerpSpeed = roundedValue / 1000;

      if (roundedValue > 0.5) {
        targetGrowth = 1;
      }

      updateTreeSmooth();
    }
  */
  if (address.startsWith("/sliderBloom" + iteration)) {
    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));
    treeParams.branch.twist = roundedValue;

  }

  if (address.startsWith("/bouton")) {
    let firstArgumentValue = msg.args[0].value;
    let roundedValue = parseFloat(firstArgumentValue.toFixed(2));
    if (roundedValue == 1) {

      growth = 0;
      let random = Math.random();
      let randomSeed = random * 50000;
      treeParams.seed = randomSeed;
      console.log(targetGrowth);
      // Call function to update the tree

    }
  }

  let newColor = new THREE.Color();
  newColor.setHSL(1, 1, 0.5); // Normalize hue between 0 and 1 (divide by 360)
  treeParams.leaves.color = newColor;
  tree.updateLeavesColor(newColor);

});

function updateTree() {
  tree.leavesMesh.material.color.set(treeParams.leaves.color);

  tree.generate();
  // Re-render or update other properties if necessary
}

// ON WEBSOCKET CLOSED
oscSocket.on("close", function (msg) {
  console.log("WebSocket closed");
  messageText.innerText = "WebSocket closed";
  webSocketConnected = false;
});

// ON WINDOW UNLOAD
window.addEventListener("beforeunload", (event) => {
  oscSocket.close();
});

// ON WINDOW LOAD
window.addEventListener("load", (event) => {
  oscSocket.open();
});