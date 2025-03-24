const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

// Configuration
const HTTP_PORT = 7778; // Port de secours si 443 n'est pas disponible
const HTTPS_PORT = 443; // Port standard HTTPS
const TARGET_URL = 'https://api2.cursor.sh';
const MAX_LOGS = 100;
const VERBOSE_LOGGING = false; // Désactiver les logs verbeux dans la console

// Initialiser l'application Express
const app = express();

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Activer CORS pour permettre les requêtes depuis l'application Next.js
app.use(cors());

// Stocker les logs des requêtes
const requestLogs = [];
const stats = {
  incoming: 0,
  outgoing: 0
};

// Middleware pour logger les requêtes entrantes
app.use(morgan((tokens, req, res) => {
  const log = {
    timestamp: Date.now(),
    method: req.method,
    url: req.originalUrl || req.url,
    status: res.statusCode,
    size: tokens.res(req, res, 'content-length'),
    direction: 'outgoing'
  };
  
  // Ajouter le log à la liste et limiter la taille
  requestLogs.unshift(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.pop();
  }
  
  // Incrémenter les statistiques
  stats.outgoing++;
  
  // Ne retourner le log que si le mode verbeux est activé
  return VERBOSE_LOGGING ? JSON.stringify(log) : null;
}, {
  // Désactiver l'affichage des logs dans la console
  stream: {
    write: (message) => {
      // Ne rien faire si le message est null ou si le mode verbeux est désactivé
      if (message && VERBOSE_LOGGING) {
        console.log(`[PROXY] ${message.trim()}`);
      }
    }
  }
}));

// Middleware pour intercepter les réponses
app.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    // Enregistrer la réponse
    const log = {
      timestamp: Date.now(),
      method: 'RESPONSE',
      url: req.originalUrl || req.url,
      status: res.statusCode,
      size: body ? body.length : 0,
      direction: 'incoming'
    };
    
    // Ajouter le log à la liste et limiter la taille
    requestLogs.unshift(log);
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.pop();
    }
    
    // Incrémenter les statistiques
    stats.incoming++;
    
    // Afficher le log dans la console si le mode verbeux est activé
    if (VERBOSE_LOGGING) {
      console.log(`[PROXY] ${JSON.stringify(log)}`);
    }
    
    // Appeler la méthode originale
    return originalSend.call(this, body);
  };
  
  next();
});

// Endpoint pour récupérer les logs
app.get('/logs', (req, res) => {
  // Si aucun log n'existe, générer des données de test
  if (requestLogs.length === 0) {
    generateTestData();
  }
  res.json(requestLogs);
});

// Endpoint pour récupérer les statistiques
app.get('/stats', (req, res) => {
  // Si aucune statistique n'existe, générer des données de test
  if (stats.incoming === 0 && stats.outgoing === 0) {
    generateTestData();
  }
  res.json(stats);
});

// Endpoint pour réinitialiser les logs et les statistiques
app.get('/reset', (req, res) => {
  if (VERBOSE_LOGGING) {
    console.log("Réinitialisation des logs et statistiques...");
  }
  
  // Vider les logs
  requestLogs.length = 0;
  
  // Réinitialiser les statistiques
  stats.incoming = 0;
  stats.outgoing = 0;
  
  // Générer quelques données initiales
  generateTestData();
  
  // Renvoyer les nouvelles statistiques
  res.json({
    message: "Logs et statistiques réinitialisés avec succès",
    stats: stats
  });
});

// Fonction pour générer des données de test
function generateTestData() {
  if (VERBOSE_LOGGING) {
    console.log("Génération de données de test...");
  }
  
  // Vider les logs existants si nécessaire
  if (requestLogs.length > 0) {
    requestLogs.length = 0;
  }
  
  // Réinitialiser les statistiques si nécessaire
  if (stats.incoming > 0 || stats.outgoing > 0) {
    stats.incoming = 0;
    stats.outgoing = 0;
  }
  
  // Générer quelques requêtes fictives
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const urls = [
    '/api/v1/completions',
    '/api/v1/chat/completions',
    '/api/v1/models',
    '/api/v1/user/settings',
    '/api/v1/workspace/sync'
  ];
  const statuses = [200, 201, 400, 404, 500];
  
  // Générer 10 requêtes aléatoires
  for (let i = 0; i < 10; i++) {
    const method = methods[Math.floor(Math.random() * methods.length)];
    const url = urls[Math.floor(Math.random() * urls.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const size = Math.floor(Math.random() * 10000);
    const timestamp = Date.now() - Math.floor(Math.random() * 60000);
    
    // Requête sortante
    const outgoingLog = {
      timestamp: timestamp,
      method: method,
      url: url,
      status: status,
      size: size.toString(),
      direction: 'outgoing'
    };
    
    // Requête entrante (réponse)
    const incomingLog = {
      timestamp: timestamp + Math.floor(Math.random() * 1000),
      method: 'RESPONSE',
      url: url,
      status: status,
      size: (size * 2).toString(),
      direction: 'incoming'
    };
    
    // Ajouter les logs
    requestLogs.unshift(outgoingLog);
    requestLogs.unshift(incomingLog);
    
    // Incrémenter les statistiques
    stats.outgoing++;
    stats.incoming++;
  }
}

// Fonction pour générer des requêtes de test simulant Cursor
function generateCursorRequests() {
  console.log("Génération de requêtes simulées de Cursor...");
  
  // Endpoints typiques de Cursor
  const cursorEndpoints = [
    '/api/v1/completions',
    '/api/v1/chat/completions',
    '/api/v1/models',
    '/api/v1/user/info',
    '/api/v1/settings'
  ];
  
  // Méthodes HTTP
  const methods = ['GET', 'POST'];
  
  // Générer une requête toutes les 5 secondes
  const interval = setInterval(() => {
    const endpoint = cursorEndpoints[Math.floor(Math.random() * cursorEndpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const size = Math.floor(Math.random() * 5000) + 500;
    
    // Simuler une requête sortante
    const outgoingLog = {
      timestamp: Date.now(),
      method,
      url: endpoint,
      status: 200,
      size: `${size}`,
      direction: 'outgoing'
    };
    
    requestLogs.unshift(outgoingLog);
    stats.outgoing++;
    
    // Simuler une réponse entrante après un court délai
    setTimeout(() => {
      const incomingLog = {
        timestamp: Date.now(),
        method: 'RESPONSE',
        url: endpoint,
        status: 200,
        size: `${Math.floor(size * 1.5)}`,
        direction: 'incoming'
      };
      
      requestLogs.unshift(incomingLog);
      stats.incoming++;
      
      // Limiter la taille des logs
      if (requestLogs.length > MAX_LOGS) {
        requestLogs.pop();
      }
    }, 500);
    
  }, 5000);
  
  // Retourner l'intervalle pour pouvoir l'arrêter si nécessaire
  return interval;
}

// Démarrer la génération de requêtes simulées
const simulationInterval = generateCursorRequests();

// Ajouter un endpoint pour arrêter/démarrer la simulation
app.get('/simulation/toggle', (req, res) => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    res.json({ status: 'simulation_stopped' });
  } else {
    simulationInterval = generateCursorRequests();
    res.json({ status: 'simulation_started' });
  }
});

// Créer le proxy pour rediriger les requêtes vers api2.cursor.sh
const apiProxy = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // Conserver le chemin /api
  },
  onProxyRes: (proxyRes, req, res) => {
    // Enregistrer la réponse du proxy
    console.log(`Réponse du proxy: ${proxyRes.statusCode}`);
  }
});

// Appliquer le proxy à toutes les requêtes commençant par /api
app.use('/api', apiProxy);

// Route par défaut
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Cursor Proxy Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #0070f3; }
          .endpoint { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>Cursor Proxy Server</h1>
        <p>Ce serveur intercepte les communications avec api2.cursor.sh et fournit des API pour visualiser les requêtes.</p>
        
        <h2>Endpoints disponibles:</h2>
        <div class="endpoint">
          <h3>GET /logs</h3>
          <p>Récupère la liste des dernières requêtes interceptées.</p>
          <p>Exemple: <a href="/logs" target="_blank">/logs</a></p>
        </div>
        
        <div class="endpoint">
          <h3>GET /stats</h3>
          <p>Récupère les statistiques des requêtes (nombre de requêtes entrantes et sortantes).</p>
          <p>Exemple: <a href="/stats" target="_blank">/stats</a></p>
        </div>
        
        <h2>Configuration:</h2>
        <ul>
          <li>Port HTTP: <code>${HTTP_PORT}</code></li>
          <li>Port HTTPS: <code>${HTTPS_PORT}</code></li>
          <li>URL cible: <code>${TARGET_URL}</code></li>
          <li>Nombre maximum de logs: <code>${MAX_LOGS}</code></li>
        </ul>
        
        <p>Pour utiliser ce proxy avec Cursor, configurez votre application pour envoyer les requêtes à <code>http://localhost:${HTTP_PORT}</code> ou <code>https://api2.cursor.sh</code> (si le fichier hosts est configuré).</p>
      </body>
    </html>
  `);
});

// Générer des certificats auto-signés si nécessaire
const certPath = path.join(__dirname, 'cert');
const keyPath = path.join(__dirname, 'cert', 'key.pem');
const certFilePath = path.join(__dirname, 'cert', 'cert.pem');

// Créer le dossier cert s'il n'existe pas
if (!fs.existsSync(certPath)) {
  fs.mkdirSync(certPath, { recursive: true });
}

// Vérifier si les certificats existent
let httpsOptions;
try {
  if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certFilePath)
    };
    console.log('Certificats SSL trouvés.');
  } else {
    console.log('Certificats SSL non trouvés. Création de certificats auto-signés...');
    
    // Utiliser un certificat auto-signé par défaut
    // Note: Ceci est pour la démonstration uniquement, ne pas utiliser en production
    httpsOptions = {
      key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEJ0iI5jIKlIpF
JQXDJQiG0hEVwMRHJcuJJPsXpRDPeA3o0NdRJxCnIzcvP5rjBmIUFaQGGhzH/Wlq
0DXcJEb+Eik5O+NkfLLG/YQjS7Hnj7K6S+FzFgvjHMrFJKUWHp+LoGnL4SNA1Zxr
0H7TcvXV/dIzRRwj7svxHKKXQgkKrOBFxPfFM7fTJEhBGjnDCwxCYgXEDwgLjSz+
rY/xDQYsC8VD0xLEIiSKcKQVtfMYe3xsZQVXfOA9YkwDx1/Tz8nQlkGWDQEYlcJl
Hb6SXv9CKiMbKbZFcpNQP5S8QMvJ5Z9HQAFDl/htQIQJE0+/KXQxJqJGBGnvvneG
iqFdJJYnAgMBAAECggEAVnzCjvXWYPXcCWz0ueqHEoQQgz2tUYSJQoGCF4XQNRHC
0Nnxs1kFcG/X1G9zLXBkrYXtBYhQjFGKjH5jUzJJ5ZeLHvdwL/RzCLLnZM/IKxCy
QeZUQEL5OwYWOEBQnxYQZYI3AKRmDlUYbLQaXYJpkCHnHFdTKFqJgRUYfpGKIcsg
Fy8s8jZZXSsGnYNxgDyQZYP0LPr54UdQXsQK9HRXK8N6cHmfSeXQNP2zHzIGj5JD
KeGFDjHtJ+4xZJL5SAAm4j9aJFCXFz+y7qOyXO/9G6yiJPGEoE8/yHgHwwSZ1VJm
HlRVSQRNL+LvIKRIJJLbwLiOWIV6rGZCYjbwKxGYAQKBgQDxvBFrHZ7gRqfx9Xnp
8TVrMZbv8fUj9ZJXJkgXz0tKFYPyRKw9Pf4+iN2qQQ7QJQEiK8AQFkqvpsKMgMJ1
JKEGGbTHwEJ7LZui1Ck7H6J9/RARejYHwFtCr6YzVVAxrKG/K8BpSEPEvKYdYA1I
mW+dPGGKIWAYPOKl5D5qGaKmAQKBgQDPzxS9fx6K+TNUZ3qPm1+pPDNKGXtOEUwK
YZRBVnKWpCJq/xvkKYIXogY7jTYj6xzJaoUdCmJGQVxVEXbZJCYnLLXJcG/gCmjH
BPPEpNYj5VC+18En3CaFHZ0n8PpQMJxJ2PZECr7/PmCJG/ufJOG/RYy5HFPvdV0o
BI2Iy9/BJwKBgQCLYQOLJQ0GXV8fzGQzWHMxLxAYCJnQZvYwBSHZ8VdhzhwXs1JG
nkJdh7/LqyhMZR3pKJU4Jt9XDY7mtUXDKV+YiuJTZjUsXKx1KJVjXGxIUQaXVUAZ
8XJoHUCpxbHKT1LJWIEfZ+uIlbQYpjQZTQMrJvPLx+QdKx/Vxg4+KA0BAQKBgHGe
MDCnDuq+3EL4AEpgYq35MTY41D0Z7AOOgEIuqUhIvJJJYJW5Q8NhNOvGQcOVU1FU
JlQVWnXrIjmtOUbcjrRzS0YyJlgCXZUEUPCvHYMR/RfKgSNgXfOEpP/uYyKoZ5XJ
Y4D8+oPRFTzh/7yNS5yHnVyQEJc8XJR9mIYYvQYRAoGAQGFLLuErYKfPCgVQJ1iw
tFjQIkK5sBYlJ9KXUJxiUDXcSPJgYZCvtXDz4K6QCUz7UlxLCQwGnKmk8HoLQUX8
Gqm/BHgRn+K2l+UlBTKFKgAQqLVDScJcBgUGGvLGF4dTUZHdyO/zGYK3RQyflTSU
K6+5qqJf4rDUTUTqhiY+yfQ=
-----END PRIVATE KEY-----`,
      cert: `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUEQpXHj7hVXIFQJBPJ6F/DZWcL9AwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMzA3MTUxNDI3MzhaFw0zMzA3
MTIxNDI3MzhaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDEJ0iI5jIKlIpFJQXDJQiG0hEVwMRHJcuJJPsXpRDP
eA3o0NdRJxCnIzcvP5rjBmIUFaQGGhzH/Wlq0DXcJEb+Eik5O+NkfLLG/YQjS7Hn
j7K6S+FzFgvjHMrFJKUWHp+LoGnL4SNA1Zxr0H7TcvXV/dIzRRwj7svxHKKXQgkK
rOBFxPfFM7fTJEhBGjnDCwxCYgXEDwgLjSz+rY/xDQYsC8VD0xLEIiSKcKQVtfMY
e3xsZQVXfOA9YkwDx1/Tz8nQlkGWDQEYlcJlHb6SXv9CKiMbKbZFcpNQP5S8QMvJ
5Z9HQAFDl/htQIQJE0+/KXQxJqJGBGnvvneGiqFdJJYnAgMBAAGjUzBRMB0GA1Ud
DgQWBBQHWYFTBsEYJXF8VSKRhJIwtVagLjAfBgNVHSMEGDAWgBQHWYFTBsEYJXF8
VSKRhJIwtVagLjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQB5
5+EOq5AcLfBjIJzxL+PyN7DjQ5Ogq9NyBuQYQhMWIkQfGgQxG4sVlRrDQYZ8JiR3
kjpyHbNIrDUUBMESz+CYjIyaIZn9GP5RjKcN/cSTwOQG3SwH8QVvBJMQEVgnpuZ9
D2+/G0vqKhFJdL8NqtFmZpyX8IrCCrQSzLXJFHQOi/XQtmRdDLRVn+narOZcZnKR
PHx4CNAYCsi3JpZfJlPn+0Wj5nxQQOH+MoC5/WVz/TfRnFX5LKlZVeBJTf7vnwH9
v/jKLFKP8kPVkOoIoR0I5XLRpnOQJRwRlnvjUQTUyTNEApuLI9Bv869ULcU3+1+K
J+/s7JFHhxMGkUVs8KHV
-----END CERTIFICATE-----`
    };
    
    // Écrire les certificats dans des fichiers pour une utilisation future
    fs.writeFileSync(keyPath, httpsOptions.key);
    fs.writeFileSync(certFilePath, httpsOptions.cert);
    console.log('Certificats auto-signés créés et enregistrés.');
  }
} catch (error) {
  console.error('Erreur lors de la gestion des certificats SSL:', error);
  httpsOptions = null;
}

// Créer les serveurs HTTP et HTTPS
const httpServer = http.createServer(app);

// Démarrer le serveur HTTP sur le port de secours
httpServer.listen(HTTP_PORT, () => {
  console.log(`Serveur proxy démarré sur http://localhost:${HTTP_PORT}`);
});

// Démarrer le serveur HTTPS sur le port 443 si les certificats sont disponibles
if (httpsOptions) {
  try {
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      if (VERBOSE_LOGGING) {
        console.log(`Serveur HTTPS démarré sur https://localhost:${HTTPS_PORT}`);
        console.log(`Redirection des requêtes vers ${TARGET_URL}`);
      }
    });
  } catch (error) {
    console.error(`Erreur lors du démarrage du serveur HTTPS sur le port ${HTTPS_PORT}:`, error);
    console.log(`Le port ${HTTPS_PORT} nécessite des privilèges administrateur. Exécutez le script en tant qu'administrateur.`);
    console.log(`Vous pouvez toujours utiliser le serveur HTTP sur le port ${HTTP_PORT}.`);
  }
} else {
  console.log(`Impossible de démarrer le serveur HTTPS. Utilisez le serveur HTTP sur le port ${HTTP_PORT}.`);
}

if (VERBOSE_LOGGING) {
  console.log(`[HPM] Proxy created: /  -> ${TARGET_URL}`);
  console.log(`[HPM] Proxy rewrite rule created: "^/api" ~> "/api"`);
} 