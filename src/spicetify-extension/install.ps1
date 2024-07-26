$url = "https://raw.githubusercontent.com/GitGinocchio/Syncify/main/src/spicetify-extension/syncify.js"
$spicetifyPath = Join-Path -Path $env:LOCALAPPDATA -ChildPath "spicetify"
$extensionsPath = Join-Path -Path $spicetifyPath -ChildPath "Extensions"
$extension = "syncify.js"

function Install-Spicetify {
    Write-Host "Spicetify non è installato. Procedo con l'installazione..."
    Write-Host "Installazione di Spicetify CLI..."
    iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex

    Write-Host "Installazione di Spicetify Marketplace..."
    iwr -useb https://raw.githubusercontent.com/spicetify/marketplace/main/resources/install.ps1 | iex

    Write-Host "Installazione di Spicetify completata con successo."
}

function Get-UserResponse {
    do {
        Clear-Host
        $response = Read-Host "Vuoi installare Spicetify? (Y/N)"
        if ($response -eq 'Y') {
            Install-Spicetify
            return
        } elseif ($response -eq 'N') {
            Write-Host "Installazione dell'estensione interrotta dall'utente."
            Start-Sleep -Seconds 3
            exit
        } else {
            Clear-Host
            Write-Host "Risposta non valida. Per favore rispondi con 'Y' o 'N'."
            Start-Sleep -Seconds 3
        }
    } while ($true)
}

Clear-Host

if (-not (Test-Path -Path $spicetifyPath)) {
    Write-Host "Spicetify non è installato."
    Get-UserResponse
}

if (-not (Test-Path -Path $extensionsPath)) {
    New-Item -ItemType Directory -Path $extensionsPath | Out-Null
}

Set-Location -Path $extensionsPath

iwr -Uri $url -OutFile $extension

spicetify config extensions $extension | Out-Null
spicetify apply | Out-Null

Write-Host "Estensione Syncify installata con successo!"
Start-Sleep -Seconds 3
exit

