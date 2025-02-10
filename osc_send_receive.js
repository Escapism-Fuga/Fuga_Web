// Log de démarrage pour vérifier que le script fonctionne
console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

// Configuration WebSocket
let webSocketConnected = false;
let socketPort = 8080;
let oscSocket = new WebSocket(`ws://localhost:${socketPort}/tree-js`);

oscSocket.onopen = function () {
  console.log("WebSocket ouvert sur le port " + socketPort);
  webSocketConnected = true;

};



oscSocket.onerror = function (err) {
  console.error("Erreur WebSocket:", err);
  console.log("La connexion WebSocket a échoué. Vérifie si le serveur WebSocket est bien en ligne.");
};

oscSocket.onmessage = function (event) {
  const msg = JSON.parse(event.data);  // Suppose que le message est en format JSON
  console.log("Message reçu:", msg);  // Affiche tout le message reçu
  let address = msg.address;
  let firstArgumentValue = msg.args[0].value;

  if (address.startsWith("/Slider/1")) {
    console.log("Chiffre " + firstArgumentValue)
  }
};



oscSocket.onclose = function () {
  console.log("WebSocket fermé");
  webSocketConnected = false;
};

window.addEventListener("beforeunload", function () {
  if (webSocketConnected) {
    oscSocket.close(); // Ferme la connexion WebSocket lorsque la fenêtre est fermée
    console.log("WebSocket fermé avant la fermeture de la fenêtre");
  } else {
    console.log("WebSocket déjà fermé avant la fermeture de la fenêtre");
  }
});


