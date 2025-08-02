@echo off
REM Deploy DescoWise Script for Windows
REM This script deploys DescoWise with user-provided API key configuration

echo 🚀 Deploying DescoWise...

REM Deploy to Vercel
echo 📦 Building and deploying to Vercel...

REM Set project name if not provided
if "%PROJECT_NAME%"=="" set PROJECT_NAME=descowise

vercel --prod --name %PROJECT_NAME% --env GEMINI_MODEL=%GEMINI_MODEL% --env GEMINI_TEMPERATURE=%GEMINI_TEMPERATURE%

if %ERRORLEVEL% EQU 0 (
    echo 🎉 Deployment successful!
    echo.
    echo 📋 Deployment Summary:
    echo    • AI Features: Users configure their own Gemini API key
    echo    • API Key: User-configured during onboarding
    echo    • Model: %GEMINI_MODEL%
    echo    • Temperature: %GEMINI_TEMPERATURE%
    echo.
    echo 🔗 Your deployment is now live!
    echo 💡 Users will be prompted to configure their Gemini API key for AI features.
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    exit /b 1
)
