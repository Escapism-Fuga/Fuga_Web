import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';


import { Tree, LeafStyle, LeafType } from "./tree";

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
  scene.background = texture;  // Optionnel, pour avoir un fond HDRI
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
spotLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
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

// Création des caméras pour les différents points de vue
const cameraTop = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
); //top
cameraTop.position.set(0, 50, 0);
cameraTop.lookAt(0, 20, 0);

const cameraLeft = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
); //bottom-left gauche
cameraLeft.position.set(15, 45, -20);
cameraLeft.lookAt(-5, 30, -4);

const cameraRight = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
); //top right millieu
cameraRight.position.set(33, 20, 20);
cameraRight.lookAt(0, 21, 0);

const cameraFront = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
); //bottom-right droit
cameraFront.position.set(-10, -10, 15);
cameraFront.lookAt(0, 34, -5);

// Camera Version
/*const cameraLeft = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); //bottom-left gauche
cameraLeft.position.set(0, 10, 50);
cameraLeft.lookAt(0, 0, 0);
 
const cameraRight = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);//top right millieu
cameraRight.position.set(10, 20, 10); // Position the camera closer to the scene (centered more)
cameraRight.lookAt(-5, 0, 0);
 
const cameraFront = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); //bottom-right droit
cameraFront.position.set(10, 0, 10);
cameraFront.lookAt(-5, 0, 20);*/

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

//tree.rotation.x = Math.PI / 2;

// ---- UI -----

const gui = new GUI();
gui.add(tree.params, "seed", 0, 65536, 1).name("Seed");
gui.add(tree.params, "maturity", 0, 1).name("Maturity");
gui.add(tree.params, "animateGrowth", 0, 1).name("Animate Growth");

const trunkFolder = gui.addFolder("Trunk").close();
trunkFolder.addColor(tree.params.trunk, "color").name("Color");
trunkFolder.add(tree.params.trunk, "flatShading").name("Flat Shading");
trunkFolder.add(tree.params.trunk, "length", 0, 50).name("Length");
trunkFolder.add(tree.params.trunk, "radius", 0, 5).name("Radius");
trunkFolder.add(tree.params.trunk, "flare", 0, 5).name("Flare");

const branchFolder = gui.addFolder("Branches").close();
branchFolder.add(tree.params.branch, "levels", 1, 5, 1).name("Levels");
branchFolder.add(tree.params.branch, "start", 0, 1).name("Start");
branchFolder.add(tree.params.branch, "stop", 0, 1).name("Stop");
branchFolder
  .add(tree.params.branch, "minChildren", 0, 10, 1)
  .name("Min Children");
branchFolder
  .add(tree.params.branch, "maxChildren", 0, 10, 1)
  .name("Max Children");
branchFolder
  .add(tree.params.branch, "sweepAngle", 0, Math.PI)
  .name("Sweep Angle");
branchFolder
  .add(tree.params.branch, "lengthVariance", 0, 1)
  .name("Length Variance");
branchFolder
  .add(tree.params.branch, "lengthMultiplier", 0, 1)
  .name("Length Multiplier");
branchFolder
  .add(tree.params.branch, "radiusMultiplier", 0, 1)
  .name("Radius Multiplier");
branchFolder.add(tree.params.branch, "taper", 0.5, 1).name("Taper");
branchFolder
  .add(tree.params.branch, "gnarliness", 0, 0.5)
  .name("Gnarliness (1)");
branchFolder
  .add(tree.params.branch, "gnarliness1_R", 0, 0.25)
  .name("Gnarliness (1/R)");
branchFolder
  .add(tree.params.branch, "twist", -0.25, 0.25, 0.01)
  .name("Twist Strength");

const geometryFolder = gui.addFolder("Geometry").close();
geometryFolder
  .add(tree.params.geometry, "sections", 1, 20, 1)
  .name("Section Count");
geometryFolder
  .add(tree.params.geometry, "lengthVariance", 0, 1)
  .name("Section Length Variance");
geometryFolder
  .add(tree.params.geometry, "radiusVariance", 0, 1)
  .name("Section Radius Variance");
geometryFolder
  .add(tree.params.geometry, "segments", 3, 32, 1)
  .name("Radial Segment Count");
geometryFolder
  .add(tree.params.geometry, "randomization", 0, 0.5)
  .name("Vertex Randomization");

const leavesFolder = gui.addFolder("Leaves").close();
leavesFolder.add(tree.params.leaves, "style", LeafStyle).name("Style");
leavesFolder.add(tree.params.leaves, "type", LeafType);
leavesFolder.add(tree.params.leaves, "size", 0, 5).name("Size");
leavesFolder
  .add(tree.params.leaves, "sizeVariance", 0, 1)
  .name("Size Variance");
leavesFolder.add(tree.params.leaves, "minCount", 0, 100, 1).name("Min Count");
leavesFolder.add(tree.params.leaves, "maxCount", 0, 100, 1).name("Max Count");
leavesFolder.addColor(tree.params.leaves, "color").name("Color");
leavesFolder.add(tree.params.leaves, "emissive", 0, 1).name("Emissive");
leavesFolder.add(tree.params.leaves, "opacity", 0, 1).name("Opacity");
leavesFolder.add(tree.params.leaves, "alphaTest", 0, 1).name("AlphaTest");

const forceFolder = gui.addFolder("Sun Direction").close();
const directionFolder = forceFolder.addFolder("Sun Direction");
directionFolder.add(tree.params.sun.direction, "x", -1, 1).name("X");
directionFolder.add(tree.params.sun.direction, "y", -1, 1).name("Y");
directionFolder.add(tree.params.sun.direction, "z", -1, 1).name("Z");
forceFolder.add(tree.params.sun, "strength", -0.1, 0.1).name("Sun Strength");

const postProcessingFolder = gui.addFolder("Post Processing").close();
const bloomFolder = postProcessingFolder.addFolder("Bloom");
bloomFolder.add(bloomPass, "threshold", 0, 1).name("Threshold");
bloomFolder.add(bloomPass, "strength", 0, 3).name("Strength");
bloomFolder.add(bloomPass, "radius", 0, 10).name("Radius");

gui
  .add(
    {
      export: () =>
        exporter.parse(
          tree,
          (glb) => {
            const blob = new Blob([glb], {
              type: "application/octet-stream",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.getElementById("downloadLink");
            link.href = url;
            link.download = "tree.glb";
            link.click();
          },
          (err) => {
            console.error(err);
          },
          {
            binary: true,
          }
        ),
    },
    "export"
  )
  .name("Export to GLB");

gui.onChange(() => {
  tree.generate();
  tree.traverse((o) => {
    if (o.material) {
      o.material.needsUpdate = true;
    }
  });
});

// --- RENDER LOOP ------

// Background Void

// Bg Video loop
/*const video = document.createElement('video');
video.src = './assets/background-loop-v2.mp4'; // Specify the path to your video
video.load();
video.play();
video.loop = true; // Set video to loop

// Create a texture from the video
const videoTexture = new THREE.VideoTexture(video);

// Create a material with the video texture
const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

// Create a plane geometry to display the video
const videoGeometry = new THREE.PlaneGeometry(16, 9); // Adjust the size as needed

// Create the mesh (the object to show the video)
const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);

// Position the mesh in the scene
videoMesh.position.set(0, 10, -5); // Adjust the position as needed
scene.add(videoMesh);*/

/*
const loader = new THREE.TextureLoader();
loader.load('./assets/bg-void.png', (texture) => {
  scene.background = texture;
});*/

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
window.addEventListener("resize", () => {
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

let hue = 0; // Cible vers laquelle on

let sat;
let light;

let lerpSpeed = 0; // Plus lent si la différence est importante

function lerp(a, b, t) {
  return a + (b - a) * t;
}

let growth = 0;
let targetGrowth = 0;

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

oscSocket.on("message", function (msg) {
  let address = msg.address;
  if (address.startsWith("/encoder")) {
    let firstArgumentValue = msg.args[0].value;

    // Augmenter ou diminuer la teinte
    if (firstArgumentValue == 1) {
      console.log(hue);
      hue = hue + 0.01; // Cycle entre 0 et 360°
    } else if (firstArgumentValue == -1) {
      console.log(hue);
      hue = hue - 0.01; // Évite les valeurs négatives
    }

    if (hue == 1) {
      hue = 0;
    }
  }

  if (address.startsWith("/sliderOne")) {
    let firstArgumentValue = msg.args[0].value;
    treeParams.leaves.sizeVariance = firstArgumentValue;
    // On suppose que la valeur du slider est entre 0 et 1

    updateTree();
  }
  if (address.startsWith("/sliderTwo")) {
    let firstArgumentValue = msg.args[0].value;
    treeParams.branch.lengthVariance = firstArgumentValue;
    updateTree();
  }
  if (address.startsWith("/sliderThree")) {
    let firstArgumentValue = msg.args[0].value;
     treeParams.trunk.flare = firstArgumentValue;
    updateTree();
  }

  if (address.startsWith("/sliderSat")) {
    let firstArgumentValue = msg.args[0].value;
    sat = firstArgumentValue;
  }
  if (address.startsWith("/sliderGrow")) {
    let firstArgumentValue = msg.args[0].value;
    lerpSpeed = firstArgumentValue / 100000;

    if (firstArgumentValue > 0.5) {
      targetGrowth = 1;
    }

    updateTreeSmooth();
  }
  if (address.startsWith("/sliderLight")) {
    let firstArgumentValue = msg.args[0].value;
    light = firstArgumentValue;
  }

  if (address.startsWith("/bouton")) {
    growth = 0;
    let random = Math.random();
    let randomSeed = random * 50000;
    treeParams.seed = randomSeed;
    // Call function to update the tree
    updateTreeSmooth();
  }

  let newColor = new THREE.Color();
  newColor.setHSL(hue, sat, light); // Normalize hue between 0 and 1 (divide by 360)
  treeParams.leaves.color = newColor;
  tree.updateLeavesColor(newColor);

  updateTree();
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
