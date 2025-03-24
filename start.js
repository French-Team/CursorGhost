const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Fonction pour préfixer les logs
const prefixLog = (prefix, color, data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${color}[${prefix}]${colors.reset} ${line}`);
    }
  });
};

// Vérifier si le fichier proxy-server.js existe
const proxyServerPath = path.join(__dirname, 'proxy-server.js');
if (!fs.existsSync(proxyServerPath)) {
  console.error(`${colors.red}[ERROR]${colors.reset} Le fichier proxy-server.js n'existe pas.`);
  console.log(`${colors.yellow}[INFO]${colors.reset} Veuillez créer le fichier proxy-server.js avant de démarrer.`);
  process.exit(1);
}

// Démarrer le serveur proxy
console.log(`${colors.cyan}[SETUP]${colors.reset} Démarrage du serveur proxy...`);
const proxyServer = spawn('node', ['proxy-server.js'], { stdio: 'pipe' });

proxyServer.stdout.on('data', (data) => {
  prefixLog('PROXY', colors.green, data);
});

proxyServer.stderr.on('data', (data) => {
  prefixLog('PROXY ERROR', colors.red, data);
});

proxyServer.on('close', (code) => {
  console.log(`${colors.red}[PROXY]${colors.reset} Le serveur proxy s'est arrêté avec le code ${code}`);
  // Arrêter l'application Next.js si le proxy s'arrête
  if (nextApp && !nextApp.killed) {
    nextApp.kill();
  }
  process.exit(code);
});

// Démarrer l'application Next.js
console.log(`${colors.cyan}[SETUP]${colors.reset} Démarrage de l'application Next.js...`);

// Utiliser 'npx' au lieu de 'npm run' pour éviter les problèmes de chemin
// npx est généralement disponible si node est installé
const nextApp = spawn('npx', ['next', 'dev', '-p', '7777'], { 
  stdio: 'pipe',
  shell: true // Utiliser le shell pour une meilleure compatibilité Windows
});

nextApp.stdout.on('data', (data) => {
  prefixLog('NEXT', colors.blue, data);
});

nextApp.stderr.on('data', (data) => {
  prefixLog('NEXT ERROR', colors.magenta, data);
});

nextApp.on('close', (code) => {
  console.log(`${colors.blue}[NEXT]${colors.reset} L'application Next.js s'est arrêtée avec le code ${code}`);
  // Arrêter le proxy si l'application Next.js s'arrête
  if (proxyServer && !proxyServer.killed) {
    proxyServer.kill();
  }
  process.exit(code);
});

// Gérer l'arrêt propre des processus
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}[SHUTDOWN]${colors.reset} Arrêt des serveurs...`);
  
  if (proxyServer && !proxyServer.killed) {
    proxyServer.kill();
  }
  
  if (nextApp && !nextApp.killed) {
    nextApp.kill();
  }
  
  process.exit(0);
});

console.log(`${colors.cyan}[INFO]${colors.reset} Serveurs démarrés. Appuyez sur Ctrl+C pour arrêter.`);
console.log(`${colors.green}[INFO]${colors.reset} Application disponible sur: http://localhost:7777`);
console.log(`${colors.green}[INFO]${colors.reset} API du proxy disponible sur: http://localhost:7778`); 