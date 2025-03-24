const { exec } = require('child_process');

const PORT = 7777;

// Pour Windows
function killPortOnWindows(port) {
  // Trouver le PID qui utilise le port
  exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (error, stdout, stderr) => {
    if (error) {
      console.log(`Aucun processus trouvé sur le port ${port}.`);
      startNextServer();
      return;
    }

    // Extraire le PID du résultat
    const lines = stdout.trim().split('\n');
    if (lines.length > 0) {
      const line = lines[0].trim();
      const pidMatch = line.match(/\s+(\d+)$/);
      
      if (pidMatch && pidMatch[1]) {
        const pid = pidMatch[1];
        console.log(`Processus trouvé sur le port ${port}. PID: ${pid}`);
        
        // Tuer le processus
        exec(`taskkill /F /PID ${pid}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Erreur lors de la tentative de terminer le processus: ${error.message}`);
          } else {
            console.log(`Processus avec PID ${pid} terminé avec succès.`);
          }
          
          // Attendre un peu pour s'assurer que le port est libéré
          setTimeout(startNextServer, 1000);
        });
      } else {
        console.log('PID non trouvé dans la sortie netstat.');
        startNextServer();
      }
    } else {
      console.log(`Aucun processus trouvé sur le port ${port}.`);
      startNextServer();
    }
  });
}

function startNextServer() {
  console.log('Démarrage du serveur Next.js sur le port 7777...');
  const nextProcess = exec('npx next dev -p 7777', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors du démarrage du serveur Next.js: ${error.message}`);
      return;
    }
  });
  
  // Transmettre la sortie et les erreurs au processus parent
  nextProcess.stdout.pipe(process.stdout);
  nextProcess.stderr.pipe(process.stderr);
}

// Exécuter la fonction principale
console.log('Libération du port 7777...');
killPortOnWindows(PORT); 