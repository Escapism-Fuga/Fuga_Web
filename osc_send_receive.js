import * as THREE from "three";
import { Tree } from "./src/main"; // Assurez-vous d'importer la classe Tree correctement


// Configuration WebSocket
let webSocketConnected = false;
let socketPort = 8080;

oscSocket = new osc.WebSocketPort({
  url: "ws://localhost:" + socketPort,
  metadata: true,
});

// ON WEBSOCKET OPEN AND READY
oscSocket.on("ready", function (msg) {
  console.log("WebSocket Opened on Port " + socketPort + "/tree-js/");
  webSocketConnected = true;
});

oscSocket.on("message", function (msg) {
  let address = msg.address;

  if (address.startsWith("/slider")) {
    let firstArgumentValue = msg.args[0].value;
    console.log(firstArgumentValue);
  }
});

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


// Créer une scène Three.js
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let treeParams = {
  seed: 12345,
  trunk: {
    length: 10,
    radius: 0.2, // Assurez-vous que radius est défini pour le tronc
    color: 0x8b4513,
    textured: true,
    flatShading: true, // Si nécessaire
    flare: 0.5, // Flare du tronc pour lui donner un effet d'élargissement
  },
  leaves: {
    color: 0x228b22,
    opacity: 1,
    type: 0,
    style: 0,
  },
  geometry: {
    sections: 10,
    segments: 8,
    randomization: 0.1,
    lengthVariance: 0.1,
    radiusVariance: 0.05,
  },
  branch: {
    levels: 4,
    minChildren: 1,
    maxChildren: 3,
    taper: 0.2, // Réduit le diamètre des branches à mesure qu'elles se prolongent
    sweepAngle: Math.PI / 6, // Angle entre les branches
    radiusMultiplier: 0.8, // Multiplie le rayon des branches
    lengthMultiplier: 0.7, // Multiplie la longueur des branches
    flare: 0.3, // Flare pour les branches
    radius: 0.1, // Rayon de base pour les branches
  },
  maturity: 1.0, // Maturité de l'arbre
  sun: { direction: new THREE.Vector3(1, 1, 1), strength: 0.5 },
};

// Créer un arbre avec Tree.js
let treeObject = new Tree(treeParams); // Crée un nouvel arbre
scene.add(treeObject); // Ajoute l'arbre à la scène Three.js

// Positionner la caméra
camera.position.z = 10;

// Fonction de rendu (animation)
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Lancer l'animation
animate();


