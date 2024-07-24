@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

set "extension=syncify.js"
set "url=https://raw.githubusercontent.com/GitGinocchio/Syncify/main/src/spicetify-extension/syncify.js"

rem Verifica i privilegi amministrativi
net session > nul 2>&1
if %errorlevel% neq 0 (
    echo Questo script richiede privilegi amministrativi.
    echo Esegui lo script come amministratore e riprova.
    pause
    exit
)

rem Naviga nella cartella Extensions di Spicetify
cd /d "%appdata%\..\local\spicetify\Extensions"

rem Scarica il file
curl -s -o "%extension%" %url%

rem Attendi fino a quando il file è stato scaricato
:waitloop
if not exist "%extension%" (
    timeout /t 1 >nul
    goto waitloop
)

rem Applica l'estensione
start "" /min cmd /c "spicetify config extensions %extension% & spicetify apply"

echo Estensione Syncify installata con successo!
pause

rem Avvia un nuovo cmd per eliminare questo script
start "" /min cmd /c "del %0"