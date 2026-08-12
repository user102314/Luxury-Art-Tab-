@echo off
setlocal
cd /d "%~dp0.."

set VPS=ubuntu@57.129.42.159
set REMOTE=/opt/luxury-art

echo === Build JAR ===
call mvn -q -DskipTests clean package
if errorlevel 1 exit /b 1

echo === Upload WebP images (~21 Mo) ===
ssh -o BatchMode=yes %VPS% "mkdir -p %REMOTE%/uploads/products"
scp -o BatchMode=yes -r uploads\products %VPS%:%REMOTE%/uploads/

echo === Deploy JAR ===
scp -o BatchMode=yes target\luxury-art-backend-1.0.0.jar %VPS%:%REMOTE%/

echo === Restart backend ===
ssh -o BatchMode=yes %VPS% "sudo systemctl restart luxury-art-backend && sleep 12 && systemctl is-active luxury-art-backend && curl -s http://127.0.0.1:8081/api/health"

echo === Verify WebP sample ===
ssh -o BatchMode=yes %VPS% "curl -s -o /dev/null -w 'webp=%%{http_code}\n' http://127.0.0.1:8081/uploads/products/26/caec4be1-5039-4050-a9f3-e360125ace8d-b1194.webp"

echo === Done ===
endlocal
