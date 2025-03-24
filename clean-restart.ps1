# Tuer le processus utilisant le port 7777 (Next.js)
$port1 = 7777
$processInfo1 = netstat -ano | Select-String -Pattern ":$port1\s" | Select-String -Pattern "LISTENING"

if ($processInfo1) {
    $processId1 = ($processInfo1 -split '\s+')[-1]
    Write-Host "Processus trouvé sur le port $port1. PID: $processId1"
    
    try {
        taskkill /F /PID $processId1
        Write-Host "Processus avec PID $processId1 terminé avec succès."
    }
    catch {
        Write-Host "Erreur lors de la tentative de terminer le processus: $_"
    }
}
else {
    Write-Host "Aucun processus n'utilise le port $port1."
}

# Tuer le processus utilisant le port 7778 (Proxy)
$port2 = 7778
$processInfo2 = netstat -ano | Select-String -Pattern ":$port2\s" | Select-String -Pattern "LISTENING"

if ($processInfo2) {
    $processId2 = ($processInfo2 -split '\s+')[-1]
    Write-Host "Processus trouvé sur le port $port2. PID: $processId2"
    
    try {
        taskkill /F /PID $processId2
        Write-Host "Processus avec PID $processId2 terminé avec succès."
    }
    catch {
        Write-Host "Erreur lors de la tentative de terminer le processus: $_"
    }
}
else {
    Write-Host "Aucun processus n'utilise le port $port2."
}

# Supprimer les dossiers de cache
Write-Host "Suppression des dossiers de cache..."
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force .next 
    Write-Host "Dossier .next supprimé."
}
if (Test-Path "node_modules/.cache") { 
    Remove-Item -Recurse -Force node_modules/.cache 
    Write-Host "Cache des modules supprimé."
}

# Attendre un peu
Start-Sleep -Seconds 2

# Lancer les serveurs avec start.js
Write-Host "Démarrage des serveurs Next.js et Proxy..."
node start.js 