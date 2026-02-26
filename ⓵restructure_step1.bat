@echo off
cd /d %~dp0

echo === Create folders ===

mkdir src\api 2>nul
mkdir src\state 2>nul
mkdir src\types 2>nul
mkdir src\ui\pages 2>nul
mkdir src\ui\components\audio 2>nul

echo Done.
pause