@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

net session > nul 2>&1
if %errorlevel% neq 0 (
    echo Questo script richiede privilegi amministrativi.
    echo Esegui lo script come amministratore e riprova.
    pause
    exit
)

cd %appdata%
cd ..
cd local

if exist "spicetify" (
  cd spicetify
  cd Extensions
  if exist "%~dp0\syncify.js" (
    move "%~dp0\syncify.js" ".\syncify.js" > nul 2>&1
    start "" /min cmd /c "spicetify config extensions syncify.js & spicetify apply"
    echo Estensione Syncify installata con successo!
  ) else (
    echo Il file javascript non e' presente in questa cartella, inserire qui il file "syncify.js" e riprovare.
  )
) else (
  echo Spicetify non è installato su questo pc.
)
pause
start "" /min cmd /c "del %0"