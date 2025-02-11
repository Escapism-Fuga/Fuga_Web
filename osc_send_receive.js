import * as THREE from "three";
import { Tree } from "./src/tree"; // Assurez-vous d'importer la classe Tree correctement

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
    length: 5,
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

// Configuration WebSocket
let socketPort = 8080;
console.log("🛠 Tentative de connexion WebSocket...");
let oscSocket = new WebSocket(`ws://localhost:${socketPort}/tree-js`);

oscSocket.onopen = function () {
  console.log("✅ WebSocket connecté sur le port " + socketPort);
};

oscSocket.onerror = function (err) {
  console.error("❌ Erreur WebSocket :", err);
};

oscSocket.onclose = function () {
  console.warn("⚠️ WebSocket fermé !");
};

let oscData = {}; // Stockage des valeurs OSC

// Fonction pour mettre à jour l'arbre avec les données OSC
function mettreAJourArbre() {
  let maturiteSlider = oscData["/Slider/1"] || 5; // Valeur par défaut pour la maturité
  let couleurSlider = oscData["/Slider/2"] || 0; // Valeur pour la couleur

  // Modifie la propriété 'maturity' de l'arbre Tree.js
  treeObject.params.maturity = maturiteSlider / 10; // Ajuste la maturité

  // Mettre à jour les matériaux de l'arbre pour simuler le vieillissement
  treeObject.branchesMesh.material.color.setRGB(
    couleurSlider / 255,
    1 - couleurSlider / 255,
    0
  ); // Changer la couleur

  // Mettre à jour la géométrie de l'arbre (par exemple, la hauteur du tronc)
  treeObject.generate(); // Génére un nouvel arbre avec les paramètres mis à jour

  console.log("Arbre mis à jour avec la maturité :", treeObject);
}

// Appeler la fonction à chaque réception de nouvelles données OSC
oscSocket.onmessage = function (event) {
  if (event.data instanceof Blob) {
    let reader = new FileReader();
    reader.onload = function () {
      let arrayBuffer = reader.result;
      traiterMessage(arrayBuffer); // Traiter les messages OSC
      mettreAJourArbre(); // Mettre à jour l'arbre avec les nouvelles données
    };
    reader.readAsArrayBuffer(event.data);
  }
};

// Fonction pour traiter les messages OSC reçus
function traiterMessage(buffer) {
  let dataView = new DataView(buffer);
  let index = 0;
  let messageString = "";

  // Lire le nom du message OSC (ex: "/Slider/1")
  while (index < buffer.byteLength) {
    let byte = dataView.getUint8(index++);
    if (byte === 0) break;
    messageString += String.fromCharCode(byte);
  }

  while (index % 4 !== 0) index++; // Sauter les null terminators

  // Lire les types de données OSC (ex: ",i")
  let typeTag = "";
  while (index < buffer.byteLength) {
    let byte = dataView.getUint8(index++);
    if (byte === 0) break;
    typeTag += String.fromCharCode(byte);
  }

  while (index % 4 !== 0) index++; // Sauter les null terminators

  // Lire les valeurs en fonction des types OSC
  let values = [];
  for (let i = 1; i < typeTag.length; i++) {
    let type = typeTag[i];

    if (type === "i") {
      values.push(dataView.getInt32(index, false));
      index += 4;
    } else if (type === "f") {
      values.push(dataView.getFloat32(index, false));
      index += 4;
    } else if (type === "s") {
      let str = "";
      while (index < buffer.byteLength) {
        let byte = dataView.getUint8(index++);
        if (byte === 0) break;
        str += String.fromCharCode(byte);
      }
      values.push(str);
    } else {
      console.warn("⚠️ Type OSC inconnu :", type);
    }
  }

  // Stocker les données dans un objet pour une récupération plus facile
  oscData[messageString] = values.length === 1 ? values[0] : values;
  console.log("📊 Mise à jour des données OSC :", oscData);
}
