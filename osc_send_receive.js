// Log de démarrage pour vérifier que le script fonctionne
console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

// Configuration WebSocket
let webSocketConnected = false;
let socketPort = 8080;

// Remarque : remplace cette URL par l'URL de ton serveur WebSocket si nécessaire
const oscSocket = new WebSocket("ws://127.0.0.1:8080/tree-js/");

console.log(" BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");

// Lorsque la connexion WebSocket est ouverte
oscSocket.onopen = function () {
  console.log("WebSocket ouvert sur le port " + socketPort);  // Vérifie si la connexion WebSocket a réussi
  webSocketConnected = true;
  console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
};

// Lorsque la connexion WebSocket échoue
oscSocket.onerror = function (err) {
  console.log("Erreur WebSocket:", err);  // Affiche l'erreur si la connexion échoue
  console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
};

// Lorsque le serveur WebSocket envoie un message
oscSocket.onmessage = function (msg) {
  console.log("Message reçu depuis le serveur WebSocket:", msg.data);
  console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
};

// Lorsque la connexion WebSocket se ferme
oscSocket.onclose = function () {
  console.log("WebSocket fermé");
  webSocketConnected = false;
  console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
};

// Événement avant la fermeture de la fenêtre (avant que la page ne soit fermée)
window.addEventListener("beforeunload", function (event) {
  oscSocket.close();  // Ferme la connexion WebSocket lorsque la fenêtre est fermée
  console.log("WebSocket fermé avant la fermeture de la fenêtre");
});

// Assurer que WebSocket est ouvert une fois que la page est complètement chargée
window.addEventListener("load", function (event) {
  console.log("Page chargée, connexion WebSocket ouverte...");
  // Si nécessaire, tu peux aussi envoyer un message initial ici, exemple :
  // oscSocket.send("Message de test");
});
