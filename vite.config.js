/**
 * @type {import('vite').UserConfig}
 */
export default {
  base: '/tree-js/',  // Répertoire de base pour GitHub Pages, tu peux l'ajuster si nécessaire
  build: {
    outDir: './dist',  // Dossier de sortie pour les fichiers compilés
    sourcemap: true,  // Génère un fichier de sourcemaps pour le débogage
  },
  publicDir: './public',  // Répertoire pour les fichiers statiques

  server: {
    port: 8080,  // Port du serveur de développement et du WebSocket
  },
};
