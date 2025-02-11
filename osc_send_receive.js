// Log de démarrage pour vérifier que le script fonctionne
console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

// Configuration WebSocket
let webSocketConnected = false;
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

let tree = new Tree();

// Function pour mettre à jour l'arbre avec les valeurs OSC
function mettreAJourArbre() {
  // Exemple : Mettre à jour la hauteur de l'arbre avec la valeur reçue sur /Slider/1
  let hauteurSlider = oscData["/Slider/1"] || 1; // Valeur par défaut si non définie

  // Mettre à jour la hauteur de l'arbre
  tree.height = hauteurSlider;

  // Exemple : Mettre à jour la couleur de l'arbre en fonction d'un autre slider (ex: /Slider/2)
  let couleurSlider = oscData["/Slider/2"] || 0; // Valeur par défaut
  tree.color = `rgb(${couleurSlider}, 0, 0)`; // Couleur rouge basée sur la valeur

  // Exemple : Modifier la forme ou un autre paramètre de l'arbre
  let formeSlider = oscData["/Slider/3"] || 1; // Valeur par défaut
  tree.shape = formeSlider > 0.5 ? "conique" : "cylindrique"; // Choix de forme

  console.log("Arbre mis à jour avec les nouvelles valeurs OSC :", tree);
}

// Appeler cette fonction à chaque fois qu'une nouvelle donnée OSC est reçue
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

let oscData = {}; // Stockage des valeurs OSC

function traiterMessage(buffer) {
  let dataView = new DataView(buffer);
  let index = 0;
  let messageString = "";

  // 🔥 Lire le nom du message OSC (ex: "/Slider/3")
  while (index < buffer.byteLength) {
    let byte = dataView.getUint8(index++);
    if (byte === 0) break;
    messageString += String.fromCharCode(byte);
  }

  while (index % 4 !== 0) index++; // 🔄 Sauter les null terminators

  // 🔥 Lire les types de données OSC (ex: ",i")
  let typeTag = "";
  while (index < buffer.byteLength) {
    let byte = dataView.getUint8(index++);
    if (byte === 0) break;
    typeTag += String.fromCharCode(byte);
  }

  while (index % 4 !== 0) index++; // 🔄 Sauter les null terminators

  // 🔥 Lire les valeurs en fonction des types OSC
  let values = [];
  for (let i = 1; i < typeTag.length; i++) {
    let type = typeTag[i];

    if (type === "i") {
      // int32
      values.push(dataView.getInt32(index, false));
      index += 4;
    } else if (type === "f") {
      // float32
      values.push(dataView.getFloat32(index, false));
      index += 4;
    } else if (type === "s") {
      // string
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

  // ✅ Stocker les données dans un objet pour une récupération plus facile
  oscData[messageString] = values.length === 1 ? values[0] : values;
  console.log("📊 Mise à jour des données OSC :", oscData);
}

window.addEventListener("beforeunload", function () {
  if (webSocketConnected) {
    oscSocket.close(); // Ferme la connexion WebSocket lorsque la fenêtre est fermée
    console.log("WebSocket fermé avant la fermeture de la fenêtre");
  } else {
    console.log("WebSocket déjà fermé avant la fermeture de la fenêtre");
  }
});
