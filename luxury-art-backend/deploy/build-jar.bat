@echo off
setlocal
cd /d "%~dp0.."

echo === Build JAR production Luxury Art Backend ===
call mvn -q -DskipTests clean package
if errorlevel 1 (
  echo BUILD FAILED
  exit /b 1
)

set JAR=target\luxury-art-backend-1.0.0.jar
if not exist "%JAR%" (
  echo JAR introuvable: %JAR%
  exit /b 1
)

for %%A in ("%JAR%") do echo OK: %%~fA  (%%~zA bytes)
echo.
echo Copier sur le VPS:
echo   scp %JAR% user@VPS:/opt/luxury-art/
echo   scp deploy\env.prod.example user@VPS:/opt/luxury-art/.env
echo   scp deploy\luxury-art-backend.service user@VPS:/tmp/
echo.
echo Sur le VPS:
echo   sudo mkdir -p /opt/luxury-art/uploads
echo   sudo nano /opt/luxury-art/.env
echo   sudo cp /tmp/luxury-art-backend.service /etc/systemd/system/
echo   sudo systemctl daemon-reload
echo   sudo systemctl enable --now luxury-art-backend
echo   sudo systemctl status luxury-art-backend
endlocal
