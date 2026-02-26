@echo off
cd /d %~dp0

echo === Moving files ===

move src\use-app-state.ts src\state\ >nul

move src\api.ts src\api\ >nul

move src\types.ts src\types\ >nul

move src\ui\components\HomePage.tsx src\ui\pages\ >nul
move src\ui\components\RolePlayPage.tsx src\ui\pages\ >nul
move src\ui\components\LearningPage.tsx src\ui\pages\ >nul
move src\ui\components\HistoryPage.tsx src\ui\pages\ >nul

echo Done.
pause