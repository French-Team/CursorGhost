$port = 7777

# Trouver le processus qui utilise le port 7777
$processInfo = netstat -ano | Select-String -Pattern ":$port\s" | Select-String -Pattern "LISTENING"

if ($processInfo) {
    # Extraire le PID du processus
    $processId = ($processInfo -split '\s+')[-1]
    Write-Host "Processus trouvé sur le port $port. PID: $processId"
    
    try {
        # Tuer le processus
        taskkill /F /PID $processId
        Write-Host "Processus avec PID $processId terminé avec succès."
    }
    catch {
        Write-Host "Erreur lors de la tentative de terminer le processus: $_"
    }
}
else {
    Write-Host "Aucun processus n'utilise le port $port."
}

# Attendre un peu pour s'assurer que le port est libéré
Start-Sleep -Seconds 1 