// Importation du module osc.js (assure-toi que ce module est installé via npm ou inclus dans ton projet)
import osc from "osc";

// Log initial pour vérifier que ton script se charge correctement
console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

// WebSocket Port et Connexion
let webSocketConnected = false;
let socketPort = 8080;

// Création de l'objet WebSocket
const oscSocket = new osc.WebSocketPort({
  url: "ws://127.0.0.1:8080/tree-js/",  // URL de ton WebSocket
  metadata: true,
});

// Log pour vérifier que le WebSocket a été initialisé
console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

// Événement lorsque la connexion WebSocket est prête
oscSocket.on("ready", function (msg) {
  console.log("WebSocket ouvert sur le port " + socketPort); 
  webSocketConnected = true;
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});

// Gestion des erreurs de connexion WebSocket
oscSocket.on("error", function (err) {
  console.log("Erreur WebSocket:", err);  // Affiche les erreurs de connexion
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});

// Réception des messages via WebSocket
oscSocket.on("message", function (msg) {
  console.log("Message reçu: ", msg);
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});

// Fermeture de la connexion WebSocket
oscSocket.on("close", function (msg) {
  console.log("WebSocket fermé");
  webSocketConnected = false;
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});

// Gestion de l'événement avant de quitter la fenêtre
window.addEventListener("beforeunload", (event) => {
  oscSocket.close();
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});

// Ouverture de la connexion WebSocket au chargement de la fenêtre
window.addEventListener("load", (event) => {
  oscSocket.open();
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});
