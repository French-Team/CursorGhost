const express = require('express');
const next = require('next');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = 7777;

app.prepare().then(() => {
    const server = express();
    const wss = new WebSocket.Server({ server: server });

    // Stocker les connexions WebSocket actives
    const clients = new Set();

    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
    });

    // Middleware pour logger les requêtes et diffuser via WS
    server.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const logEntry = {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: Date.now() - start,
                time: new Date().toISOString()
            };

            // Envoyer le log à tous les clients connectés
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(logEntry));
                }
            });

            next();
        });
    });

    server.all('*', (req, res) => handle(req, res));

    server.listen(port, () => {
        console.log(`> Serveur prêt sur http://localhost:${port}`);
    });
}).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
});