# GlowCaption Serverless AI

Open `index.html` through a local web server or static hosting.

## Important
This project has no application backend. The AI model is loaded in the user's browser from the configured CDN/model host on first use and then may be cached by the browser.

## Run locally
Use a simple static server, for example VS Code Live Server, GitHub Pages, Netlify static hosting, or another static host. Static hosting is not an AI processing server.

## Current AI model
The starter uses an English Whisper tiny model in the browser. It is intended as a lightweight proof of concept. For Hindi/multilingual transcription, swap to a compatible multilingual browser-supported Whisper model and test memory/performance on the target device.

## Included
- Local video/audio selection
- Browser-side speech recognition attempt
- Timed caption segments
- Glowing caption preview
- Position/color/font controls
- SRT export

## Limitation
This starter does not permanently render/burn captions into a downloadable MP4. That requires substantial client-side video encoding support and is much heavier on phones.
