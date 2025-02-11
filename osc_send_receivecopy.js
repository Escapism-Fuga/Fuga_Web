// Log de démarrage pour vérifier que le script fonctionne
console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

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

/*
// Utilise oscSocket au lieu de socket
oscSocket.onmessage = function (event) {
  console.log("Message reçu:", event.data);

  // Traite le message reçu (par exemple, mise à jour d'un élément HTML)

  let message = event.data;
  if (message.includes("/slider")) {
    const value = message.split(",")[1]; // Extrait la valeur du message OSC
    document.getElementById("sliderValue").textContent = value; // Affiche la valeur
  }

};
*/
