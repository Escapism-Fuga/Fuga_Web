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
oscSocket.onopen = function () {
  console.log("✅ WebSocket Opened on Port " + socketPort + "tree-js/");
  webSocketConnected = true; // Met à jour le statut de la connexion
};

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
