@echo off
cd /d %~dp0

echo === Fix imports ===

powershell -Command ^
"(Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx) | ForEach-Object { ^
 (Get-Content $_.FullName) ^
 -replace '\.\./\.\./api\.ts','@/api/api' ^
 -replace '\.\./api\.ts','@/api/api' ^
 -replace '\.\./\.\./types\.ts','@/types' ^
 -replace '\.\./types\.ts','@/types' ^
 | Set-Content $_.FullName
}"

echo Done.
pause