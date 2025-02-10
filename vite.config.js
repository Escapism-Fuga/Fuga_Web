/**
 * @type {import('vite').UserConfig}
 */
export default {
  // Configuration pour spécifier la base de l'URL pour GitHub Pages
  base: '/tree-js/',

  build: {
    outDir: './dist',  // Répertoire de sortie après la compilation
    sourcemap: true,  // Génère des fichiers de source map pour le débogage
  },

  publicDir: './public',  // Répertoire public pour les fichiers statiques

  server: {
    port: 8080,  // Le port du serveur de développement
    open: true,  // Ouvre automatiquement le navigateur lorsque le serveur démarre
  },
}
