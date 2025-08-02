@echo off
REM Deploy Standard Version Script for Windows
REM This script deploys the standard version without pre-configured API key

echo 🚀 Deploying DescoWise Standard Version...

REM Set deployment type to standard
set DEPLOYMENT_TYPE=standard

REM Deploy to Vercel with standard configuration
echo 📦 Building and deploying to Vercel...

REM Set project name if not provided
if "%PROJECT_NAME%"=="" set PROJECT_NAME=descowise-standard

vercel --prod --name %PROJECT_NAME% --env DEPLOYMENT_TYPE=standard --env GEMINI_MODEL=%GEMINI_MODEL% --env GEMINI_TEMPERATURE=%GEMINI_TEMPERATURE%

if %ERRORLEVEL% EQU 0 (
    echo 🎉 Standard deployment successful!
    echo.
    echo 📋 Deployment Summary:
    echo    • Type: Standard ^(user-provided API key^)
    echo    • AI Features: Requires user API key setup
    echo    • API Key: User-configured during onboarding
    echo    • Model: %GEMINI_MODEL%
    echo    • Temperature: %GEMINI_TEMPERATURE%
    echo.
    echo 🔗 Your standard deployment is now live!
    echo 💡 Users will be prompted to configure their own Gemini API key for AI features.
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    exit /b 1
)
