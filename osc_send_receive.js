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

oscSocket.onmessage = function(event) {
  try {
      // Vérifier si les données sont un Blob ou ArrayBuffer
      let data = event.data;

      // Si les données sont un Blob, les lire en texte
      if (data instanceof Blob) {
          let reader = new FileReader();
          reader.onload = function() {
              // Une fois les données lues, extraire la chaîne JSON valide
              let jsonString = reader.result.split("s ")[1];  // Extraire la chaîne après "s "

              // Tenter de parser le JSON
              let jsonData = JSON.parse(jsonString);

              // Utiliser jsonData
              console.log(jsonData);
          };
          reader.readAsText(data);  // Lire le Blob comme texte
      } else {
          // Si les données sont déjà une chaîne, effectuer le même traitement
          let jsonString = data.split("s ")[1];  // Extraire la chaîne après "s "

          // Tenter de parser le JSON
          let jsonData = JSON.parse(jsonString);

          // Utiliser jsonData
          console.log(jsonData);
      }
  } catch (error) {
      console.error("Erreur de parsing JSON: ", error);
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
