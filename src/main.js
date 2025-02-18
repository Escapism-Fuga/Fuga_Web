import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import {
  GUI
} from "three/addons/libs/lil-gui.module.min.js";
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
spotLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
scene.add(spotLight);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 20, 0);
camera.position.set(70, 20, 0);
 
// Création des caméras pour les différents points de vue
const cameraTop = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); //top
cameraTop.position.set(0, 50, 0);
cameraTop.lookAt(0, 20, 0);
 
const cameraLeft = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); //bottom-left Devant
cameraLeft.position.set(50, 20, 20);
cameraLeft.lookAt(0, 0, 28);
 
const cameraRight = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);//top right Ecran-droit
cameraRight.position.set(50, 20, 0);
cameraRight.lookAt(0, 0, 27);
 
const cameraFront = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); //bottom-right Ecran-gauche
cameraFront.position.set(50, 10, 20);
cameraFront.lookAt(10, 10, 27);



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

// ----- TREE -----------

const treeParams = {
  seed: 0,
  maturity: 1,
  animateGrowth: false,

  trunk: {
    color: "", // Color of the tree trunk
    flatShading: false, // Use face normals for shading instead of vertex normals
    textured: true, // Apply texture to bark
    length: 20, // Length of the trunk
    radius: 1.5, // Starting radius of the trunk
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
    segments: 8, // Number of faces around the circumference of the branch
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
    color: 0x6b7f48,
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

tree.rotation.x = Math.PI / 2;

// ---- UI -----


// --- RENDER LOOP ------
// Fonction de rendu des différentes vues
function renderMultipleViews() {
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;
 
 
  // --- Rendu pour la vue en haut à droite ---
  renderer.setViewport(width, height, width, height);
  renderer.setScissor(width, height, width, height);
  renderer.setScissorTest(true);
  renderer.render(scene, cameraRight);
 
  // --- Rendu pour la vue en bas à gauche ---
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width, height);
  renderer.setScissorTest(true);
  renderer.render(scene, cameraLeft);
 
  // --- Rendu pour la vue en bas à droite ---
  renderer.setViewport(width, 0, width, height);
  renderer.setScissor(width, 0, width, height);
  renderer.setScissorTest(true);
  renderer.render(scene, cameraFront);
}


let resetTimeout = null;
// --- RENDU PRINCIPAL ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
 
  if (treeParams.animateGrowth) {
    const dt = clock.getDelta();
    tree.params.maturity = Math.min(1, tree.params.maturity + 0.2 * dt);
 
    if (tree.params.maturity >= 1 && !resetTimeout) {
      resetTimeout = setTimeout(() => {
        tree.params.seed = Math.random() * 60000;
        tree.params.maturity = 0.1;
        resetTimeout = null;
      }, 3000);
    }
 
    tree.generate();
  }
 
  // Rendu des 4 vues
  renderMultipleViews();
}
 
// Evénement de redimensionnement pour ajuster la caméra et le rendu
window.addEventListener('resize', () => {
  cameraTop.aspect = window.innerWidth / window.innerHeight;
  cameraLeft.aspect = window.innerWidth / window.innerHeight;
  cameraRight.aspect = window.innerWidth / window.innerHeight;
  cameraFront.aspect = window.innerWidth / window.innerHeight;
 
  cameraTop.updateProjectionMatrix();
  cameraLeft.updateProjectionMatrix();
  cameraRight.updateProjectionMatrix();
  cameraFront.updateProjectionMatrix();
 
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

let growth = 0; // Niveau de maturité brut (0-100)
let targetGrowth = 0; // Cible vers laquelle on

let rouge = 0;
let vert = 0;
let bleu = 0;

oscSocket.on("message", function (msg) {
  let address = msg.address;
  let lerpSpeed = 0.05; // Plus lent si la différence est importante

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function updateTreeSmooth() {
    // Limiter la vitesse de croissance de l'arbre
    growth = lerp(growth, targetGrowth, lerpSpeed);

    // Appliquer la maturité à la génération de l'arbre
    treeParams.maturity = Math.min(1, Math.max(0, growth));

    if (Math.abs(growth - treeParams.maturity) > 0.01) {
      updateTree(); // Mettre à jour l'arbre
    }


    requestAnimationFrame(updateTreeSmooth);
  }

  if (address.startsWith("/encoder")) {
    let firstArgumentValue = msg.args[0].value;

    // Met à jour la cible de la croissance
    if (firstArgumentValue == 1) {
      targetGrowth += 0.05; // Augmente de 0.01 à chaque fois
    } else if (firstArgumentValue == -1) {
      targetGrowth -= 0.05; // Diminue de 0.01
    }

    // Assurer que la valeur de la croissance reste dans la plage [0, 1]
    targetGrowth = Math.min(1, Math.max(0, targetGrowth));

    requestAnimationFrame(updateTreeSmooth);
  }


  if (address.startsWith("/sliderOne")) {
    let firstArgumentValue = msg.args[0].value;
    treeParams.leaves.sizeVariance = firstArgumentValue;
    updateTree();
  }
  if (address.startsWith("/sliderTwo")) {
    let firstArgumentValue = msg.args[0].value;
    treeParams.branch.lengthVariance = firstArgumentValue;
    updateTree();
  }

  if (address.startsWith("/sliderR")) {
    let firstArgumentValue = msg.args[0].value;
    rouge = firstArgumentValue;
  }
  if (address.startsWith("/sliderG")) {
    let firstArgumentValue = msg.args[0].value;
    vert = firstArgumentValue;
  }
  if (address.startsWith("/sliderB")) {
    let firstArgumentValue = msg.args[0].value;
    bleu = firstArgumentValue;
  }

  if (address.startsWith("/bouton")) {

    let random = Math.random();
    let randomSeed = random * 50000;
    targetGrowth = 0;
    treeParams.seed = randomSeed;
    // Call function to update the tree
    updateTree();
  }

  
  let newColor = new THREE.Color(rouge, vert, bleu);
    treeParams.leaves.color = newColor;
    updateTree();
  
});

// Function to update the tree (make sure this works with your tree generation logic)
function updateTree() {
  // Regenerate or update the tree based on the new parameters (like trunk length)
  // Call the tree's generate method to update the geometry
  tree.generate();
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