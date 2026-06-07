@echo off
title AutoCompare AI - Uruchamianie

cd /d "%~dp0"

echo =========================================================
echo   AutoCompare AI - Uruchamianie Aplikacji
echo =========================================================
echo.
echo Katalog projektu: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [BLAD] Node.js nie jest zainstalowany lub nie zostal dodany do PATH!
    echo Pobierz i zainstaluj Node.js z oficjalnej strony: https://nodejs.org/
    echo Po instalacji uruchom ten plik ponownie.
    echo.
    pause
    exit /b
)

if not exist "node_modules" (
    echo [INFO] Brak folderu node_modules. Instalowanie zaleznosci, to moze chwile potrwac...
    call npm install
    if errorlevel 1 (
        echo [BLAD] Instalacja zaleznosci npm install nie powiodla sie!
        echo Sprawdz polaczenie z internetem i sprobuj ponownie.
        echo.
        pause
        exit /b
    )
    echo [INFO] Zaleznosci zainstalowane pomyslnie.
    echo.
)

echo [1/2] Uruchamianie serwera deweloperskiego Next.js...
start "AutoCompare AI Server" cmd /k "npm run dev"

echo [2/2] Otwieranie przegladarki na http://localhost:3000...
echo.

ping -n 4 127.0.0.1 >nul

start http://localhost:3000

echo.
echo Gotowe! Aplikacja zostala uruchomiona.
echo Serwer Next.js dziala w osobnym oknie konsoli o nazwie AutoCompare AI Server.
echo Aby wylaczyc aplikacje, po prostu zamknij tamto okno konsoli.
echo.
ping -n 6 127.0.0.1 >nul
