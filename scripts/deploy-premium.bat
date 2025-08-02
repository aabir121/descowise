@echo off
REM Deploy Premium Version Script for Windows
REM This script deploys the premium version with pre-configured API key

echo 🚀 Deploying DescoWise Premium Version...

REM Check if GEMINI_API_KEY is provided
if "%GEMINI_API_KEY%"=="" (
    echo ❌ Error: GEMINI_API_KEY environment variable is required for premium deployment
    echo Usage: set GEMINI_API_KEY=your_key_here && scripts\deploy-premium.bat
    exit /b 1
)

REM Basic validation of API key length
call :strlen %GEMINI_API_KEY% keylen
if %keylen% LSS 20 (
    echo ❌ Error: API key appears to be too short. Please check your GEMINI_API_KEY.
    exit /b 1
)

echo ✅ API key provided and appears valid

REM Set deployment type to premium
set DEPLOYMENT_TYPE=premium

REM Deploy to Vercel with premium configuration
echo 📦 Building and deploying to Vercel...

REM Set project name if not provided
if "%PROJECT_NAME%"=="" set PROJECT_NAME=descowise-premium

vercel --prod --name %PROJECT_NAME% --env DEPLOYMENT_TYPE=premium --env GEMINI_API_KEY=%GEMINI_API_KEY% --env GEMINI_MODEL=%GEMINI_MODEL% --env GEMINI_TEMPERATURE=%GEMINI_TEMPERATURE%

if %ERRORLEVEL% EQU 0 (
    echo 🎉 Premium deployment successful!
    echo.
    echo 📋 Deployment Summary:
    echo    • Type: Premium ^(pre-configured API key^)
    echo    • AI Features: Enabled by default
    echo    • API Key: Pre-configured ^(hidden^)
    echo    • Model: %GEMINI_MODEL%
    echo    • Temperature: %GEMINI_TEMPERATURE%
    echo.
    echo 🔗 Your premium deployment is now live!
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    exit /b 1
)

goto :eof

:strlen
setlocal enabledelayedexpansion
set "str=%~1"
set "len=0"
for /l %%i in (0,1,8191) do (
    if "!str:~%%i,1!" neq "" set /a len+=1
)
endlocal & set "%~2=%len%"
goto :eof
