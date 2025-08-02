#!/bin/bash

# Deploy Standard Version Script
# This script deploys the standard version without pre-configured API key

echo "🚀 Deploying DescoWise Standard Version..."

# Set deployment type to standard
export DEPLOYMENT_TYPE=standard

# Deploy to Vercel with standard configuration
echo "📦 Building and deploying to Vercel..."

# Check if project exists, if not create it
PROJECT_NAME="${PROJECT_NAME:-descowise-standard}"

vercel --prod \
    --name "$PROJECT_NAME" \
    --env DEPLOYMENT_TYPE=standard \
    --env GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}" \
    --env GEMINI_TEMPERATURE="${GEMINI_TEMPERATURE:-0.3}"

if [ $? -eq 0 ]; then
    echo "🎉 Standard deployment successful!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "   • Type: Standard (user-provided API key)"
    echo "   • AI Features: Requires user API key setup"
    echo "   • API Key: User-configured during onboarding"
    echo "   • Model: ${GEMINI_MODEL:-gemini-2.5-flash}"
    echo "   • Temperature: ${GEMINI_TEMPERATURE:-0.3}"
    echo ""
    echo "🔗 Your standard deployment is now live!"
    echo "💡 Users will be prompted to configure their own Gemini API key for AI features."
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
