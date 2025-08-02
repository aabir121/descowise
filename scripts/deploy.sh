#!/bin/bash

# Deploy DescoWise Script
# This script deploys DescoWise with user-provided API key configuration

echo "🚀 Deploying DescoWise..."

# Deploy to Vercel
echo "📦 Building and deploying to Vercel..."

# Check if project exists, if not create it
PROJECT_NAME="${PROJECT_NAME:-descowise}"

vercel --prod \
    --name "$PROJECT_NAME" \
    --env GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}" \
    --env GEMINI_TEMPERATURE="${GEMINI_TEMPERATURE:-0.3}"

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "   • AI Features: Users configure their own Gemini API key"
    echo "   • API Key: User-configured during onboarding"
    echo "   • Model: ${GEMINI_MODEL:-gemini-2.5-flash}"
    echo "   • Temperature: ${GEMINI_TEMPERATURE:-0.3}"
    echo ""
    echo "🔗 Your deployment is now live!"
    echo "💡 Users will be prompted to configure their Gemini API key for AI features."
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
