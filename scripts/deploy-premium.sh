#!/bin/bash

# Deploy Premium Version Script
# This script deploys the premium version with pre-configured API key

echo "🚀 Deploying DescoWise Premium Version..."

# Check if GEMINI_API_KEY is provided
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY environment variable is required for premium deployment"
    echo "Usage: GEMINI_API_KEY=your_key_here ./scripts/deploy-premium.sh"
    exit 1
fi

# Validate API key format (basic check)
if [ ${#GEMINI_API_KEY} -lt 20 ]; then
    echo "❌ Error: API key appears to be too short. Please check your GEMINI_API_KEY."
    exit 1
fi

echo "✅ API key provided and appears valid"

# Set deployment type to premium
export DEPLOYMENT_TYPE=premium

# Deploy to Vercel with premium configuration
echo "📦 Building and deploying to Vercel..."

# Check if project exists, if not create it
PROJECT_NAME="${PROJECT_NAME:-descowise-premium}"

vercel --prod \
    --name "$PROJECT_NAME" \
    --env DEPLOYMENT_TYPE=premium \
    --env GEMINI_API_KEY="$GEMINI_API_KEY" \
    --env GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}" \
    --env GEMINI_TEMPERATURE="${GEMINI_TEMPERATURE:-0.3}"

if [ $? -eq 0 ]; then
    echo "🎉 Premium deployment successful!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "   • Type: Premium (pre-configured API key)"
    echo "   • AI Features: Enabled by default"
    echo "   • API Key: Pre-configured (hidden)"
    echo "   • Model: ${GEMINI_MODEL:-gemini-2.5-flash}"
    echo "   • Temperature: ${GEMINI_TEMPERATURE:-0.3}"
    echo ""
    echo "🔗 Your premium deployment is now live!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
