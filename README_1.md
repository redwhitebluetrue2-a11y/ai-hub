# AI Hub v2 - Smart Router - Expo Build

This is the full App Store-ready build of your AI aggregator with Meta AI included.

## Quick Start
1. npm install
2. npx expo start
3. Scan QR with Expo Go app on your phone

## Add Real API Keys
Open src/ApiKeys.js and paste your keys. They are stored securely with SecureStore on device, never in code.

Keys needed:
- OPENAI_API_KEY (ChatGPT)
- ANTHROPIC_API_KEY (Claude)
- GEMINI_API_KEY
- PERPLEXITY_API_KEY
- DEEPSEEK_API_KEY
- GROK_API_KEY (xAI)
- COPILOT uses OPENAI key via Azure

Meta AI is built-in via this app (orchestrator).

## Build for App Store
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android

Then submit via:
eas submit --platform ios
eas submit --platform android

## Smart Routing
src/router.js contains the intent detection that assigns tasks to specialists.
Edit PROVIDER_ROLES to change who does what.

